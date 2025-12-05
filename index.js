/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

/**
 * getSession
 * simple wrapper around access to values stored in localforage
 * to insulate RTR functions from that API.
 *
 * @returns {object} Okapi session object from localforage
 */
const getSession = async () => {
  return localforage.getItem(SESSION_NAME);
};

/**
 * getCurrentTenant
 * Get the current tenant info from global config.
 * 
 * @returns {object} tenant info object
 */
const getCurrentTenant = () => {
  const tenants = Object.values(window.config.tenantOptions);

  // Selecting first for now until selection dropdown is added for multiple tenants
  return tenants[0];
}

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
 * getKeycloakLoginUrl
 * Construct Keycloak login URL based on Okapi config and current tenant info.
 * 
 * @param {object} okapi - okapi config object with authnUrl and url properties
 * @returns {string} Keycloak login URL
 */
const getKeycloakLoginUrl = (okapi) => {
  const loginTenant = getCurrentTenant();

  const redirectUri = getOIDCRedirectUri(loginTenant.name, loginTenant.clientId);
  return `${okapi.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
};

/**
 * validateUser
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
 * @param {string} okapiUrl
 * @param {string} tenant
 * @param {object} session
 * @param {function} handleError error-handler function; returns a Promise that returns null
 *
 * @returns {Promise} resolves to user data if session is valid, or the result of handleError() if not
 */
async function validateUser(okapiUrl, tenant, session, handleError) {
  try {
    const { token, tenant: sessionTenant = tenant } = session;
    const usersPath = 'users-keycloak';
    const resp = await fetch(`${okapiUrl}/${usersPath}/_self?expandPermissions=true`, {
      headers: getHeaders(sessionTenant, token),
      credentials: 'include',
      mode: 'cors',
    });
    if (resp.ok) {
      const data = await resp.json();
      
      //TODO: load Stripes here
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
}

function logout() {
  window.location.href = getKeycloakLoginUrl(window.okapi);
}

/**
 * validateSession
 * 1. Pull the session from local storage; if it contains a user id,
 *    validate it by fetching /_self to verify that it is still active,
 *    dispatching load-resources actions.
 * 2. Check if SSO (SAML) is enabled, dispatching check-sso actions
 * 3. dispatch set-okapi-ready.
 *
 * @param {string} okapiUrl
 * @param {string} tenant
 */
function validateSession(okapiUrl, tenant) {
  getSession()
    .then((sess) => {
      const handleError = () => logout();
      return sess?.user?.id ? validateUser(okapiUrl, tenant, sess, handleError) : handleError();
    })
}

// Manually kick off session check on page load with default tenant
validateSession(window.okapi.url, getCurrentTenant().name);
