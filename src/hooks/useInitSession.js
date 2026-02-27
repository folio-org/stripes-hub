import { useQuery } from 'react-query';
import localforage from 'localforage';

import {
  fetchDiscovery,
  fetchEntitlements,
  getCurrentTenant,
  getHeaders,
  getSession,
  loadStripes,
  setUnauthorizedPathToSession,
} from '../loginServices';

/** name for whatever the entitlement service will call the hub app (stripes, stripes-core, etc.) */
const HOST_APP_NAME = 'folio_stripes';

/** name for FOLIO config stored in localforage to be used by entitled applications (such as stripes-core) */
const FOLIO_CONFIG_KEY = 'folio_config';

/** name for FOLIO branding file locations to be used by entitled applications (such as stripes-core) */
const FOLIO_BRANDING_KEY = 'branding_config';

/** root API path to user session data */
const USERS_PATH = 'users-keycloak';

// localstorage keys to-be-ingested by stripes-core
const DISCOVERY_URL_KEY = 'discoveryUrl';
const HOST_LOCATION_KEY = 'hostLocation';
const REMOTE_LIST_KEY = 'entitlements';

/**
 * Pull the session from local storage and validate it by fetching from .../_self.
 * If the session is valid, fetch entitlements and discovery data,
 * then initialize stripes.
 *
 * If the session is invalid at any point in that process, redirect to login.
 * @param {*} config
 * @param {*} branding
 * @param {*} loginUrl
 * @returns
 */
const useInitSession = (config, branding, loginUrl) => {
  const getSessionTenant = (session) => {
    return session.tenant;
  };

  const authenticate = () => {
    // Cache the current path so we can return to it after authenticating.
    if (globalThis.location.pathname !== '/') {
      setUnauthorizedPathToSession();
    }
    globalThis.location.pathname = loginUrl;
  };

  const sessionIsValid = (session) => {
    return !!session?.isAuthenticated;
  };

  /**
   * validateSession
   * Data in localstorage has led us to believe a session is active. To confirm,
   * fetch from .../_self and dispatch the results, allowing any changes to authz
   * since that session data was persisted to take effect immediately.
   *
   * If the fetch succeeds, dispatch the result to update the session.
   * Otherwise, call logout() to purge redux and storage because either:
   *   1. the session data was corrupt. yikes!
   *   2. the session data was valid but cookies were missing. yikes!
   * Either way, our belief that a session is active has been proven wrong, so
   * we want to clear out all relevant storage.
   *
   * @param {*} session session object
   * @param {function} handleError error-handler function; returns a Promise that returns null
   *
   * @returns {Promise} resolves to user data if session is valid, or the result of handleError() if not
   */
  const validateSession = async (session, handleError) => {
    try {
      const tenant = getCurrentTenant().name;
      const { token, tenant: sessionTenant = tenant } = session;

      const resp = await fetch(`${config.gatewayUrl}/${USERS_PATH}/_self?expandPermissions=true`, {
        headers: getHeaders(sessionTenant, token),
        credentials: 'include',
        mode: 'cors',
      });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      } else {
        const text = await resp.text();
        throw text;
      }
    } catch (error) {
      // log a warning, then call the error handler if we received one
      console.error(error); // eslint-disable-line no-console
      return handleError ? handleError() : Promise.resolve();
    }
  };

  const { isLoading: isLoadingSession, data: session, error: sessionError } = useQuery(
    ['@folio/stripes-core', 'initSession'],
    async () => {
      try {
        const cachedSession = await getSession();

        // retrieve session data. if none is available, redirect to login
        // because we pass `authenticate()` as the error handler
        cachedSession?.user?.id ? await validateSession(cachedSession, authenticate) : authenticate();

        if (cachedSession && sessionIsValid(cachedSession)) {
          return cachedSession;
        } else {
          authenticate();
        }
      } catch (e) {
        console.error('error during StripesHub init', e); // eslint-disable-line no-console
        throw new Error('Session init error')
      }
    },
    {
      retry: false,
    }
  );

  const { isLoading: isLoadingEntitlement, data: entitlement, error: entitlementError } = useQuery(
    ['@folio/stripes-core', 'entitlement'],
    async () => {
      const tenant = getCurrentTenant().name;
      const entitlement = await fetchEntitlements(config, tenant);
      return entitlement;
    },
    {
      retry: false,
      enabled: !!session,
    }
  );

  const { isLoading: isLoadingDiscovery, data: discovery, error: discoveryError } = useQuery(
    ['@folio/stripes-core', 'discovery'],
    async () => {
      const tenant = getCurrentTenant().name;
      const discovery = await fetchDiscovery(config, tenant, entitlement);
      return discovery;
    },
    {
      retry: false,
      enabled: !!entitlement && Object.keys(entitlement).length > 0, // discovery depends on entitlement, so don't run until we have entitlement data
    }
  );

  /**
   * initStripes
   * Fetch entitlements and discovery data, then cache it in local storage.
   * Pluck stripes from the discovery data and purge it from the cache (we don't
   * want stripes to try to load itself) and then load stripes.
   *
   * Stripes is keyed by folio_stripes-core in the entitlement data, which is
   * composed of Application Descriptors, themselves composed of Module
   * Descriptors. IOW, entitlement data only contains modules that have MDs.
   * Since Stripes itself does not contain an MD but stripes-core does, we take
   * advantage of that fact, using the folio_stripes-core key in entitlement and
   * discovery data to find stripes' location.
   *
   * @param {object} config
   * @param {object} branding
   * @param {string} tenant
   * @returns {Promise<void>} resolves when stripes is initialized
   */
  const { isLoading: isLoadingStripes, error: stripesError } = useQuery(
    ['@folio/stripes-core', 'stripes'],
    async () => {
      console.log({ session, entitlement, discovery });
      const stripesCore = Object.values(discovery).find((entry) => entry.name === 'folio_stripes-core');
      if (stripesCore) {
        await localforage.setItem(DISCOVERY_URL_KEY, config.discoveryUrl ?? config.gatewayUrl);
        await localforage.setItem(HOST_APP_NAME, HOST_APP_NAME);
        await localforage.setItem(FOLIO_CONFIG_KEY, config);
        await localforage.setItem(FOLIO_BRANDING_KEY, branding);
        await localforage.setItem(HOST_LOCATION_KEY, stripesCore.location);

        // REMOTE_LIST_KEY stores the list of apps that stripes will load,
        // so we have to remove stripes from that list. Otherwise, Malkovich.
        // Malkovich Malkovich Malkovich? Malkovich!
        await localforage.setItem(REMOTE_LIST_KEY, Object.values(discovery).filter(module => module.name !== 'folio_stripes-core'));

        await loadStripes(stripesCore);
        return Promise.resolve(true);
      }

      throw new Error('Stripes core module not found in discovery data');
    },
    {
      retry: false,
      enabled: !!session && !!entitlement && !!discovery, // stripes init depends on session, entitlement, and discovery, so don't run until we have all of that data
    }
  );

  return ({
    isLoadingDiscovery,
    discoveryError,
    isLoadingEntitlement,
    entitlementError,
    isLoadingStripes,
    stripesError,
    isLoadingSession,
    sessionError,
  });
};

export default useInitSession;
