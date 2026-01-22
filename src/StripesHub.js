import localforage from 'localforage';

import {
  getLogoutTenant,
  getSession,
  USERS_PATH,
  IS_LOGGING_OUT,
  SESSION_NAME,
  RTR_TIMEOUT_EVENT,
  TENANT_LOCAL_STORAGE_KEY,
  LOGIN_RESPONSE,
  getHeaders,
} from './loginServices';

function StripesHub({ stripes, config }) {
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

        // TODO: load Stripes here
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
   * 1. Pull the session from local storage; if it contains a user id,
   *    validate it by fetching /_self to verify that it is still active,
   *    dispatching load-resources actions.
   * 2. Check if SSO (SAML) is enabled, dispatching check-sso actions
   * 3. dispatch set-okapi-ready.
   *
   * @returns {Promise} resolves when session validation is complete
   */
  const init = async () => {
    const session = await getSession();
    const handleError = () => logout();

    return session?.user?.id ? validateSession(session, handleError) : handleError();
  };

  init();

  return (
    <div test-id="StripesHub">
    </div>
  );
}

export default StripesHub;
