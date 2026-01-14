
const atDefaultExpiration = Date.now() + (60 * 1000);
const rtDefaultExpiration = Date.now() + (2 * 60 * 1000);

// eslint-disable-next-line no-unused-vars
class OidcLanding {
  constructor(stripes, config, utils) {
    this.stripes = stripes;
    this.config = config;
    this.utils = utils;
  }

  /**
   * getLoginTenant
   * Get the login tenant info from global config.
   *
   * @returns {object} tenant info object
   */
  getLoginTenant = () => {
    const tenants = Object.values(this.config.tenantOptions);

    // Selecting first for now until selection dropdown is added for multiple tenants
    return tenants[0];
  };

  /**
   * fetchOverriddenUserWithPerms
   * When starting a session after turning from OIDC authentication, the user's current tenant
   * (provided to X-Okapi-Tenant) may not match the central tenant. overrideUser=true query allow us to
   * retrieve a real user's tenant permissions and service points even if X-Okapi-Tenant == central tenant.
   * Example, we have user `exampleUser` that directly affiliated with `Member tenant` and for central tenant exampleUser is a shadow user.
   * Previously, we had to log in to central tenant as a shadow user, and then switch the affiliation.
   * But providing query overrideUser=true, we fetch the real user's tenant with its permissions and service points.
   * Response looks like this, {originalTenantId: "Member tenant", permissions: {permissions: [...memberTenantPermissions]}, ...rest}.
   * Now, we can set the originalTenantId to the session with fetched permissions and servicePoints.
   * Compare with fetchUserWithPerms, which only fetches data from the current tenant, which is called during an established session when switching tenants.
   * @param {string} serverUrl
   * @param {string} tenant
   * @param {string} token
   *
   * @returns {Promise} Promise resolving to the response-body (JSON) of the request
   */
  fetchOverriddenUserWithPerms = async (serverUrl, tenant, token, rtrIgnore = false) => {
    const res = await fetch(
      `${serverUrl}/users-keycloak/_self?expandPermissions=true&fullPermissions=true&overrideUser=true`,
      {
        headers: this.utils.getHeaders(tenant, token),
        rtrIgnore,
      },
    );

    return res;
  };

  /**
   * handleLoginError
   * Clear out session data, dispatch authentication errors, then dispatch
   * okapi-ready to indicate that we're ready to start fresh. Return the
   * response-body, er, JSON, from the failed auth-n request.
   *
   * @param {function} dispatch store.dispatch
   * @param {Response} resp HTTP response from a failed auth-n request
   *
   * @returns {Promise} resolving to the response's JSON
   */
  handleLoginError = async (resp) => {
    await localforage.removeItem(SESSION_NAME);
    const responseBody = await this.utils.processBadResponse(resp);

    return responseBody;
  };

  /**
   * processSession
   * create a new session with the response from either a username/password
   * authentication request or a .../_self request.
   * response body is shaped like
   * {
      'access_token': 'SOME_STRING',
      'expires_in': 420,
      'refresh_expires_in': 1800,
      'refresh_token': 'SOME_STRING',
      'token_type': 'Bearer',
      'not-before-policy': 0,
      'session_state': 'SOME_UUID',
      'scope': 'profile email'
  * }
  *
  * @param {string} tenant
  * @param {Response} resp HTTP response
  *
  * @returns {Promise} resolving to login response body or undefined on error
  */
  processSession = async (tenant, resp, ssoToken) => {
    if (resp.ok) {
      const json = await resp.json();
      const token = resp.headers.get('X-Okapi-Token') || json.access_token || ssoToken;
      await this.createSession(tenant, token, json);
      return json;
    } else {
      // handleLoginError will dispatch setAuthError, then resolve to undefined
      return this.handleLoginError(resp);
    }
  };

  /**
   * spreadUserWithPerms
   * Restructure the response from `bl-users/self?expandPermissions=true`
   * to return an object shaped like
   * {
   *   user: { id, username, ...personal }
   *   perms: { foo: true, bar: true, ... }
   * }
   *
   * @param {object} userWithPerms
   *
   * @returns {object} { user, perms }
   */
  spreadUserWithPerms = (userWithPerms) => {
    const user = {
      id: userWithPerms?.user?.id,
      username: userWithPerms?.user?.username,
      ...userWithPerms?.user?.personal,
    };

    // remap data's array of permission-names to set with
    // permission-names for keys and `true` for values.
    //
    // userWithPerms is shaped differently depending on the API call
    // that generated it.
    // in community-folio, /login sends data like [{ "permissionName": "foo" }]
    //   and includes both directly and indirectly assigned permissions
    // in community-folio, /_self sends data like ["foo", "bar", "bat"]
    //   but only includes directly assigned permissions
    // in community-folio, /_self?expandPermissions=true sends data like [{ "permissionName": "foo" }]
    //   and includes both directly and indirectly assigned permissions
    // in eureka-folio, /_self sends data like ["foo", "bar", "bat"]
    //   and includes both directly and indirectly assigned permissions
    //
    // we'll parse it differently depending on what it looks like.
    let perms = {};
    const list = userWithPerms?.permissions?.permissions;
    if (list && Array.isArray(list) && list.length > 0) {
      // shaped like this ["foo", "bar", "bat"] or
      // shaped like that [{ "permissionName": "foo" }]?
      if (typeof list[0] === 'string') {
        perms = Object.assign({}, ...list.map(p => ({ [p]: true })));
      } else {
        perms = Object.assign({}, ...list.map(p => ({ [p.permissionName]: true })));
      }
    }

    return { user, perms };
  };

  /**
   * createSession
   * Remap the given data into a session object shaped like:
   * {
   *   user: { id, username, personal }
   *   tenant: string,
   *   perms: { permNameA: true, permNameB: true, ... }
   *   isAuthenticated: boolean,
   *   tokenExpiration: { atExpires, rtExpires }
   * }
   * Dispatch the session object, then return a Promise that fetches
   * and dispatches tenant resources.
   *
   * @param {string} tenant tenant name
   * @param {string} token access token [deprecated; prefer folioAccessToken cookie]
   * @param {*} data response from call to _self
   *
   * @returns {Promise} resolving to { user, tenant, perms, isAuthenticated, tokenExpiration }
   */
  createSession = async (tenant, token, data) => {
    const { user, perms } = this.spreadUserWithPerms(data);

    // if we can't parse tokenExpiration data, e.g. because data comes from `.../_self`
    // which doesn't provide it, then set an invalid AT value and a near-future (+10 minutes) RT value.
    // the invalid AT will prompt an RTR cycle which will either give us new AT/RT values
    // (if the RT was valid) or throw an RTR_ERROR (if the RT was not valid).
    const tokenExpiration = {
      atExpires: data.tokenExpiration?.accessTokenExpiration ? new Date(data.tokenExpiration.accessTokenExpiration).getTime() : -1,
      rtExpires: data.tokenExpiration?.refreshTokenExpiration ? new Date(data.tokenExpiration.refreshTokenExpiration).getTime() : Date.now() + (10 * 60 * 1000),
    };

    /* @ See the comments for fetchOverriddenUserWithPerms.
    * There are consortia(multi-tenant) and non-consortia modes/envs.
    * We don't want to care if it is consortia or non-consortia modes, just use fetchOverriderUserWithPerms on login to initiate the session.
    * 1. In consortia mode, fetchOverriderUserWithPerms returns originalTenantId.
    * 2. In non-consortia mode, fetchOverriderUserWithPerms won't response with originalTenantId,
    * instead `tenant` field will be provided.
    * 3. As a fallback use default tenant.
    */
    const sessionTenant = data.originalTenantId || data.tenant || tenant;
    const session = {
      token,
      isAuthenticated: true,
      user,
      perms,
      tenant: sessionTenant,
      tokenExpiration,
    };

    // localStorage events emit across tabs so we can use it like a
    // BroadcastChannel to communicate with all tabs/windows.
    // here, we set a dummy 'true' value just so we have something to
    // remove (and therefore emit and respond to) on logout
    localStorage.setItem(SESSION_NAME, 'true');

    await localforage.setItem('loginResponse', data);
    const sessionData = await localforage.getItem(SESSION_NAME);
    // for keycloak-based logins, token-expiration data was already
    // pushed to storage, so we pull it out and reuse it here.
    // for legacy logins, token-expiration data is available in the
    // login response.
    if (sessionData?.tokenExpiration) {
      session.tokenExpiration = sessionData.tokenExpiration;
    } else if (data.tokenExpiration) {
      session.tokenExpiration = {
        atExpires: new Date(data.tokenExpiration.accessTokenExpiration).getTime(),
        rtExpires: new Date(data.tokenExpiration.refreshTokenExpiration).getTime(),
        accessTokenExpiration: data.tokenExpiration.accessTokenExpiration,
        refreshTokenExpiration: data.tokenExpiration.refreshTokenExpiration,
      };
    } else {
      // somehow, we ended up here without any legit token-expiration values.
      // that's not great, but in theory we only ended up here as a result
      // of logging in, so let's punt and assume our cookies are valid.
      // set an expired AT and RT 10 minutes into the future; the expired
      // AT will kick off RTR, and on success we'll store real values as a result,
      // or on failure we'll get kicked out. no harm, no foul.
      session.tokenExpiration = {
        atExpires: -1,
        rtExpires: Date.now() + (10 * 60 * 1000),
      };
    }

    await localforage.setItem(SESSION_NAME, session);

    console.log('TODO: load Stripes here', session);
    //await this.loadResources(store, sessionTenant, user.id);
  };

  /**
   * requestUserWithPerms
   * retrieve currently-authenticated user, then process the result to begin a session.
   * @param {string} serverUrl
   * @param {string} tenant
   * @param {string} token
   *
   * @returns {Promise} Promise resolving to the response-body (JSON) of the request
   */
  requestUserWithPerms = async (serverUrl, tenant, token) => {
    const resp = await this.fetchOverriddenUserWithPerms(serverUrl, tenant, token, !token);

    if (resp.ok) {
      const sessionData = await this.processSession(tenant, resp, token);
      return sessionData;
    } else {
      const error = await resp.json();
      throw error;
    }
  }

  /**
   * setTokenExpiry
   * simple wrapper around access to values stored in localforage
   * to insulate RTR functions from that API. Supplement the existing
   * session with updated token expiration data. Given values (millisecond
   * timestamps) are persisted as-is; corresponding human-readable values
   * (accessTokenExpiration, refreshTokenExpiration) are written as well.
   *
   * @param {object} shaped like { atExpires, rtExpires }; each is a millisecond timestamp
   * @returns {Promise} resolving to updated session object
   */
  setTokenExpiry = async (te) => {
    if (Number.isInteger(te.atExpires) && Number.isInteger(te.rtExpires)) {
      const tokenExpiration = {
        ...te,
        accessTokenExpiration: new Date(te.atExpires).toISOString(),
        refreshTokenExpiration: new Date(te.rtExpires).toISOString(),
      };

      const sess = await this.utils.getSession();
      const val = { ...sess, tokenExpiration };
      return localforage.setItem(SESSION_NAME, val);
    }

    // eslint-disable-next-line no-console
    console.error('Expected { atExpires: int, rtExpires: int }; received', te);
    return Promise.reject(new TypeError('Did not receive { atExpires: int, rtExpires: int }'));
  };

  /**
   * initSession
   * Callback for useExchangeCode to execute after exchanging the OTP
   * for token-expiration data and cookies
   * @param {object} tokenData shaped like { accessTokenExpiration, refreshTokenExpiration}
   */
  initSession = (tokenData) => {
    const loginTenant = this.utils.getLoginTenant();

    if (tokenData) {
      this.setTokenExpiry({
        atExpires: tokenData.accessTokenExpiration ? new Date(tokenData.accessTokenExpiration).getTime() : atDefaultExpiration,
        rtExpires: tokenData.refreshTokenExpiration ? new Date(tokenData.refreshTokenExpiration).getTime() : rtDefaultExpiration,
      })
        .then(() => {
          return this.utils.storeLogoutTenant(loginTenant.tenant);
        })
        .then(() => {
          return this.requestUserWithPerms(this.stripes.url, loginTenant.tenant, this.utils.getCookie(FOLIO_ACCESS_TOKEN));
        });
    }
  };

  useExchangeCode = async () => {
    let json = {};
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const loginTenant = this.getLoginTenant();

    if (code) {
      try {
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("redirect-uri", `${window.location.protocol}//${window.location.host}/oidc-landing.html?tenant=${loginTenant.name}&client_id=${loginTenant.clientId}`);

        const response = await fetch(`${this.stripes.url}/authn/token?${params}`, {
          headers: this.utils.getHeaders(loginTenant.name)
        });

        if (response.ok === false) {
          throw { response };
        }

        json = await response.json();
        await this.utils.setCookieFromHttpResponse(response);
        // note: initSession is expected to execute an unawaited promise.
        // initSession calls .../_self and other functions in order to
        // populate the session, eventually dispatching redux actions
        // (isAuthenticated, sessionData, okapiReady), triggering
        // RootWithIntl to re-render.
        //
        // return the json response from `authn/token` in order to
        // show a status update on the calling page while session-init
        // is still in-flight.
        this.initSession(json);
      } catch (fetchError) {
        // throw json from the error-response, or just rethrow
        if (fetchError?.response?.json) {
          const errorJson = await fetchError.response.json();
          throw errorJson;
        }

        throw fetchError;
      }
    } else {

      // eslint-disable-next-line no-throw-literal
      throw new Error('OTP code is missing');
    }

    return json;
  };

  init = async () => {
    const token = await this.useExchangeCode();
    console.log('OIDC Redirect completed, token:', token);
    return token;
  };
}
