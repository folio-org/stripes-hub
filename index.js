/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

/** path to users API call */
const USERS_PATH = 'users-keycloak';

class StripesHub {
  constructor(stripes, config) {
    this.stripes = stripes;
    this.config = config;
  }

  /**
   * getSession
   * simple wrapper around access to values stored in localforage
   * to insulate RTR functions from that API.
   *
   * @returns {object} Session object from localforage
  */
  getSession = async () => {
    return localforage.getItem(SESSION_NAME);
  };

  /**
   * getCurrentTenant
   * Get the current tenant info from global config.
   * 
   * @returns {object} tenant info object
   */
  getCurrentTenant = () => {
    const tenants = Object.values(this.config.tenantOptions);

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
  getOIDCRedirectUri = (tenant, clientId) => {
    // we need to use `encodeURIComponent` to separate `redirect_uri` URL parameters from the rest of URL parameters that `redirect_uri` itself is part of
    return encodeURIComponent(`${window.location.protocol}//${window.location.host}/oidc-landing?tenant=${tenant}&client_id=${clientId}`);
  };

  /**
   * getLoginUrl
   * Construct login URL based on Okapi config and current tenant info.
   * 
   * @returns {string} login URL
   */
  getLoginUrl = () => {
    const loginTenant = this.getCurrentTenant();

    const redirectUri = this.getOIDCRedirectUri(loginTenant.name, loginTenant.clientId);
    return `${this.stripes.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
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
   * @param {*} session session object
   * @param {function} handleError error-handler function; returns a Promise that returns null
   *
   * @returns {Promise} resolves to user data if session is valid, or the result of handleError() if not
   */
  validateSession = async (session, handleError) => {
    try {
      const tenant = this.getCurrentTenant().name;
      const { token, tenant: sessionTenant = tenant } = session;

      const resp = await fetch(`${this.stripes.url}/${USERS_PATH}/_self?expandPermissions=true`, {
        headers: this.getHeaders(sessionTenant, token),
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

  /**
   * logout
   * Redirect to login URL to initiate logout process.
   */
  logout = () => {
    window.location.href = this.getLoginUrl();
  }

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
  init = async () => {
    const session = await this.getSession();
    const handleError = () => this.logout();

    return session?.user?.id ? this.validateSession(session, handleError) : handleError();
  }
}
