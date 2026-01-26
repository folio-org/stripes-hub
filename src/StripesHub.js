import localforage from 'localforage';

import {
  getLogoutTenant,
  getSession,
  loadStripes,
  USERS_PATH,
  IS_LOGGING_OUT,
  SESSION_NAME,
  RTR_TIMEOUT_EVENT,
  TENANT_LOCAL_STORAGE_KEY,
  LOGIN_RESPONSE,
  getHeaders,
} from './loginServices';

function StripesHub({ stripes, config }) {
  let stripesCore = null;


  /**
   * getCurrentTenant
   * Get the current tenant info from global config.
   *
   * @returns {object} tenant info object
   */
  const getCurrentTenant = () => {
    const tenants = Object.values(config.tenantOptions);

    // Selecting first for now until selection dropdown is added for multiple tenants
    return tenants[0];
  };

  // ^^^^^^^^^^^^^^^^
  /**
   * getSession
   * simple wrapper around access to values stored in localforage
   * to insulate RTR functions from that API.
   *
   * @returns {object} Session object from localforage
  */
  getSession = () => {
    return localforage.getItem(SESSION_NAME);
  };

  sessionIsValid = (session) => {
    return session && session.isAuthenticated;
  }

  getConfigTenant = () => {
    const tenants = Object.values(config.tenantOptions);

    // Selecting first for now until selection dropdown is added for multiple tenants
    return tenants[0];
  }

  getSessionTenant = (session) => {
    return session.tenant;
  }

  /**
   * storeLogoutTenant
   * Store the tenant ID in local storage for use during logout.
   *
   * @param {string} tenantId the tenant ID
   */
  storeLogoutTenant = (tenantId) => {
    localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify({ tenantId }));
  };

  /**
   * getLogoutTenant
   * Retrieve the tenant ID from local storage for use during logout.
   *
   * @returns {object|undefined} tenant info object or undefined if not found
   */
  getLogoutTenant = () => {
    const storedTenant = localStorage.getItem(TENANT_LOCAL_STORAGE_KEY);
    return storedTenant ? JSON.parse(storedTenant) : undefined;
  };

  /**
   * getOIDCRedirectUri
   * Construct OIDC redirect URI based on current location, tenant, and client ID.
   *
   * @param {string} tenant - the tenant name
   * @param {string} clientId - the client ID
   * @returns {string} encoded redirect URI
   */
  getOIDCRedirectUri = (tenant, clientId) => {
    // we need to use `encodeURIComponent` to separate `redirect_uri` URL parameters from the rest of URL parameters that `redirect_uri` itself is part of
    return encodeURIComponent(`${window.location.protocol}//${window.location.host}/oidc-landing?tenant=${tenant}&client_id=${clientId}`);
  };



  /**
   * getHeaders
   * Construct headers for FOLIO requests.
   *
   * @param {*} tenant the tenant name
   * @param {*} token the auth token
   * @returns {object} headers for FOLIO requests
   */
  getHeaders = (tenant, token) => {
    return {
      'X-Okapi-Tenant': tenant,
      'Content-Type': 'application/json',
      ...(token && { 'X-Okapi-Token': token }),
    };
  }

  /**
   * ffetch (folio-fetch)
   * Wrapper around fetch to include Okapi headers and error handling. Throws
   * if response is not ok.
   *
   * @param {string} url URL to retrieve
   * @param {string} tenant tenant for x-okapi-tenant header
   * @returns {Promise} resolves to the JSON response
   */
  ffetch = async (url, tenant) => {
    const res = await fetch(url, {
      headers: getHeaders(tenant),
      credentials: 'include',
      mode: 'cors',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fetch to ${url} failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const json = await res.json();
    return json;
  }

  /**
   * fetchEntitlements
   * Fetch entitlement data for the tenant, then coalesce UI modules across
   * applications into a single map, keyed by module ID, including .
   * @param {string} tenant
   * @returns
   */
  fetchEntitlements = async (tenant) => {
    console.log(`Fetching entitlements for tenant ${tenant}...`); // eslint-disable-line no-console
    const uiMap = {};
    const json = await ffetch(`${stripes.url}/entitlements/${tenant}/applications`, tenant);
    const elist = json.applicationDescriptors;
    elist.forEach(application => {
      application.uiModules.forEach(module => {
        uiMap[module.id] = module;
      });
      application.uiModuleDescriptors.forEach(module => {
        if (uiMap[module.id]) {
          // console.error(`===> found module descriptor for ${module.id}`);
          uiMap[module.id].okapiInterfaces = module.requires;
          uiMap[module.id].optionalOkapiInterfaces = module.optional;
          uiMap[module.id] = { ...uiMap[module.id], ...module.metadata?.stripes };
        }
      });
    });

    return uiMap;
  };

  /** error-handler: do nothing */
  handleWithNoop = () => { };

  /** error-handler: log it */
  handleWithLog = (msg) => {
    console.error(msg); // eslint-disable-line no-console
  };

  /** error-handler: throw it */
  handleWithThrow = (msg) => {
    throw new Error(msg);
  };

  /**
   * fetchDiscovery
   * Fetch discovery data for the tenant and merge it with corresponding
   * entitlement data, returning the intersection. (e.g. if discovery has
   * entries for a, b, c and entitlement has entries for b, c, d then the
   * returned map will have entries for b and c only.)
   *
   * @param {string} tenant
   * @param {map} uiMap
   * @param {function} handler error handler
   * @returns
   */
  fetchDiscovery = async (tenant, uiMap, handler) => {
    console.log(`Fetching discovery for tenant ${tenant}...`); // eslint-disable-line no-console
    const map = {};

    const discoveryUrl = stripes.discoveryUrl ?? `${stripes.url}/modules/discovery`;
    const json = await ffetch(`${discoveryUrl}?limit=100`, tenant);
    json.discovery.forEach(entry => {
      if (uiMap[entry.id]) {
        map[entry.id] = uiMap[entry.id];
        map[entry.id].location = entry.location;
        map[entry.id].module = `@${entry.name.replace('_', '/')}`;
      } else {
        handler(`No entitlement found for discovered module ID ${entry.id}`);
      }
    });

    // TODO: better way to handle this situation?
    // cache stripes-core location for later use
    stripesCore = json.discovery.find((entry) => entry.name === 'folio_stripes-core');

    return map;
  };

  findStripes = async () => {
    const disco = await localforage.getItem(REMOTE_LIST_KEY);
    return disco.find((entry) => entry.name === HOST_APP_NAME);
  }

  /**
   * loadStripes
   * Dynamically load stripes CSS and JS assets using the build's manifest.json.
   * Stripes will bootstrap itself once its JS is loaded.
   */
  loadStripes = async () => {
    console.log('Loading Stripes...'); // eslint-disable-line no-console

    const manifestJSON = await fetch(`${stripesCore.location}/manifest.json`);
    const manifest = await manifestJSON.json();

    // collect imports...
    const jsImports = new Set();
    const cssImports = new Set();
    Object.keys(manifest.entrypoints).forEach((entry) => {
      manifest.entrypoints[entry].imports.forEach((imp) => {
        if (imp.endsWith('.js')) {
          jsImports.add(imp);
        } else if (imp.endsWith('.css')) {
          cssImports.add(imp);
        }
      });
    });

    cssImports.forEach((cssRef) => {
      const cssFile = manifest.assets[cssRef].file
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${stripesCore.location}/${cssFile}`;
      document.head.appendChild(link);
    });

    jsImports.forEach((jsRef) => {
      const jsFile = manifest.assets[jsRef].file;
      import(`${stripesCore.location}/${jsFile}`);
    });
  }

  // //////////////////////

  /**
   * getOIDCRedirectUri
   * Construct OIDC redirect URI based on current location, tenant, and client ID.
   *
   * @param {string} tenant - the tenant name
   * @param {string} clientId - the client ID
   * @returns {string} encoded redirect URI
   */
  const getOIDCRedirectUri = (tenant, clientId) => {
    // we need to use `encodeURIComponent` to separate `redirect_uri` URL parameters from the rest of URL parameters that `redirect_uri` itself is part of
    return encodeURIComponent(`${window.location.protocol}//${window.location.host}/oidc-landing?tenant=${tenant}&client_id=${clientId}`);
  };

  /**
   * getLoginUrl
   * Construct login URL based on Okapi config and current tenant info.
   *
   * @returns {string} login URL
   */
  const getLoginUrl = () => {
    const loginTenant = getCurrentTenant();

    const redirectUri = getOIDCRedirectUri(loginTenant.name, loginTenant.clientId);
    return `${stripes.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
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

      const resp = await fetch(`${stripes.url}/${USERS_PATH}/_self?expandPermissions=true`, {
        headers: getHeaders(sessionTenant, token),
        credentials: 'include',
        mode: 'cors',
      });
      if (resp.ok) {
        const data = await resp.json();

        loadStripes(stripes);
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

  /**
   * logout
   * Redirect to login URL to initiate logout process.
   */
  const logout = async () => {
    window.location.href = getLoginUrl();

    // check the private-storage sentinel: if logout has already started
    // in this window, we don't want to start it again.
    if (sessionStorage.getItem(IS_LOGGING_OUT)) {
      return;
    }

    // check the shared-storage sentinel: if logout has already started
    // in another window, we don't want to invoke shared functions again
    // (like calling /authn/logout, which can only be called once)
    // BUT we DO want to clear private storage such as session storage
    // and redux, which are not shared across tabs/windows.
    if (localStorage.getItem(SESSION_NAME)) {
      await fetch(`${stripes.url}/authn/logout`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        // Since the tenant in the x-okapi-token and the x-okapi-tenant header
        // on logout should match, switching affiliations updates
        // store.okapi.tenant, leading to mismatched tenant names from the token.
        // Use the tenant name stored during login to ensure they match.
        headers: getHeaders(getLogoutTenant()?.tenantId),
      });
    }

    try {
      // clear private-storage
      //
      // set the private-storage sentinel to indicate logout is in-progress
      sessionStorage.setItem(IS_LOGGING_OUT, 'true');

      // localStorage events emit across tabs so we can use it like a
      // BroadcastChannel to communicate with all tabs/windows
      localStorage.removeItem(SESSION_NAME);
      localStorage.removeItem(RTR_TIMEOUT_EVENT);
      localStorage.removeItem(TENANT_LOCAL_STORAGE_KEY);

      // clear shared storage
      await localforage.removeItem(SESSION_NAME);
      await localforage.removeItem(LOGIN_RESPONSE);
    } catch (e) {
      console.error('error during logout', e); // eslint-disable-line no-console
    }

    // clear the console unless config asks to preserve it
    if (!config.preserveConsole) {
      console.clear(); // eslint-disable-line no-console
    }
    // clear the storage sentinel
    sessionStorage.removeItem(IS_LOGGING_OUT);
  };

  /**
   * init
   * 1 Investigate localstorage for a stored session.
   * 2 Retrieve user data
   * 3 Retrieve module entitlements
   * 4 Retrieve module discovery
   * 5 Load stripes, which bootstraps itself and loads remote modules.
   *
   * If no session is found, redirect to login.
   *
   * @returns {Promise} resolves when session validation is complete
   */
  const init = async () => {
    try {
      const session = await getSession();

      const handleError = () => logout();

      session?.user?.id ? validateSession(session, handleError) : handleError();

      if (session && sessionIsValid(session)) {
        const tenant = getSessionTenant(session);
        const { tenant: sessionTenant = tenant } = session;

        const uiMap = await fetchEntitlements(sessionTenant);
        const disco = await fetchDiscovery(sessionTenant, uiMap, handleWithLog);

        await localforage.setItem(DISCOVERY_URL_KEY, stripes.discoveryUrl ?? stripes.url);
        await localforage.setItem(HOST_APP_NAME, 'folio_stripes');
        await localforage.setItem(HOST_LOCATION_KEY, stripesCore.location);
        await localforage.setItem(REMOTE_LIST_KEY, Object.values(disco).filter(module => module.name !== 'folio_stripes-core'));

        await loadStripes();
      } else {

        handleError();

        console.error('session is missing; authenticating');
        document.body.innerHTML = '<h2>Redirecting to login...</h2>';
        // this.authenticate();
      }
    } catch (e) {
      console.error('error during StripesHub init', e); // eslint-disable-line no-console
      alert(`error during StripesHub init: ${JSON.stringify(e, null, 2)}`); // eslint-disable-line no-alert
    }

  };

  init();

  return (
    <div data-testid="StripesHub">
    </div>
  );
}

export default StripesHub;
