// var loginServices = require(['./loginServices'], () => {
//   loginServices.requestLogin(window.okapi.url || '', window.okapi.token || '');
// });

const IS_LOGGING_OUT = '@folio/stripes/core::Logout';

const TENANT_LOCAL_STORAGE_KEY = 'tenant';

const defaultErrorCodes = {
  DEFAULT_ERROR: 'default.error',
  DEFAULT_SERVER_ERROR: 'default.server.error',
};

const ssoErrorCodes = {
  SSO_SESSION_FAILED_ERROR: 'sso.session.failed',
};

const changePasswordErrorCodes = {
  EXPIRED_ERROR_CODE: 'link.expired',
  USED_ERROR_CODE: 'link.used',
  INVALID_ERROR_CODE: 'link.invalid',
};

const forgotFormErrorCodes = {
  EMAIL_INVALID: 'email.invalid',
  UNABLE_LOCATE_ACCOUNT: 'unable.locate.account',
  UNABLE_LOCATE_ACCOUNT_PASSWORD: 'unable.locate.account.password',
};

const defaultErrors = {
  DEFAULT_LOGIN_CLIENT_ERROR: {
    code: defaultErrorCodes.DEFAULT_ERROR,
    type: 'error',
  },
  DEFAULT_LOGIN_SERVER_ERROR:{
    code: defaultErrorCodes.DEFAULT_SERVER_ERROR,
    type: 'error',
  },
  INVALID_LINK_ERROR: {
    code: changePasswordErrorCodes.INVALID_ERROR_CODE,
    type: 'error',
  },
  FORGOTTEN_PASSWORD_CLIENT_ERROR: {
    code: forgotFormErrorCodes.UNABLE_LOCATE_ACCOUNT_PASSWORD,
    type: 'error',
  },
  FORGOTTEN_USERNAME_CLIENT_ERROR: {
    code: forgotFormErrorCodes.UNABLE_LOCATE_ACCOUNT,
    type: 'error',
  },
  SSO_SESSION_FAILED_ERROR: {
    code: ssoErrorCodes.SSO_SESSION_FAILED_ERROR,
    type: 'error',
  },
};

const getLoginErrors = (payload) => {
  try {
    if (typeof payload === 'object') {
      const { errors } = payload;

      return errors;
    } else {
      const { errors } = JSON.parse(payload);

      return errors || [defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR];
    }
  } catch (e) {
    return [defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR];
  }
};

function getProcessedErrors(response, status, defaultClientError) {
  switch (status) {
    case 400:
      return [defaultClientError];
    case 422:
      return getLoginErrors(response);
    case 404:  // Okapi's deployment of mod-users-bl hasn't completed
    case 500:
      return [defaultErrors.DEFAULT_LOGIN_SERVER_ERROR];
    default:
      return [defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR];
  }
}

async function processBadResponse(response, defaultClientError) {
  const clientError = defaultClientError || defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR;
  let actionPayload;

  try {
    const responseBody = await response.json();
    const responsePayload = responseBody.errorMessage || responseBody;
    actionPayload = getProcessedErrors(responsePayload, response.status, clientError);
  } catch (e) {
    actionPayload = [defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR];
  }

  // if (typeof dispatch === 'function') {
  //   //dispatch(setAuthError(actionPayload));
  //   return undefined;
  // } else {
    return actionPayload;
  //}
}

const getOIDCRedirectUri = (tenant, clientId) => {
  // we need to use `encodeURIComponent` to separate `redirect_uri` URL parameters from the rest of URL parameters that `redirect_uri` itself is part of
  return encodeURIComponent(`${window.location.protocol}//${window.location.host}/oidc-landing?tenant=${tenant}&client_id=${clientId}`);
};



const storeLogoutTenant = (tenantId) => {
  localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify({ tenantId }));
};

const getLogoutTenant = () => {
  const storedTenant = localStorage.getItem(TENANT_LOCAL_STORAGE_KEY);
  return storedTenant ? JSON.parse(storedTenant) : undefined;
};

async function logout(okapiUrl, queryClient) {
  // check the private-storage sentinel: if logout has already started
  // in this window, we don't want to start it again.
  if (sessionStorage.getItem(IS_LOGGING_OUT)) {
    return Promise.resolve();
  }

  // check the shared-storage sentinel: if logout has already started
  // in another window, we don't want to invoke shared functions again
  // (like calling /authn/logout, which can only be called once)
  // BUT we DO want to clear private storage such as session storage
  // and redux, which are not shared across tabs/windows.
  const logoutPromise = localStorage.getItem(SESSION_NAME) ?
    fetch(`${okapiUrl}/authn/logout`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      /* Since the tenant in the x-okapi-token and the x-okapi-tenant header on logout should match,
      switching affiliations updates store.okapi.tenant, leading to mismatched tenant names from the token.
      Use the tenant name stored during login to ensure they match.
        */
      headers: getHeaders(getLogoutTenant()?.tenantId || store.getState()?.okapi?.tenant),
    })
    :
    Promise.resolve();

  return logoutPromise
    // clear private-storage
    .then(() => {
      // set the private-storage sentinel to indicate logout is in-progress
      sessionStorage.setItem(IS_LOGGING_OUT, 'true');

      // localStorage events emit across tabs so we can use it like a
      // BroadcastChannel to communicate with all tabs/windows
      localStorage.removeItem(SESSION_NAME);
      localStorage.removeItem(RTR_TIMEOUT_EVENT);
      localStorage.removeItem(TENANT_LOCAL_STORAGE_KEY);

      // store.dispatch(setIsAuthenticated(false));
      // store.dispatch(clearCurrentUser());
      // store.dispatch(clearOkapiToken());
      // store.dispatch(resetStore());

      // clear react-query cache
      if (queryClient) {
        queryClient.removeQueries();
      }
    })
    // clear shared storage
    // .then(localforage.removeItem(SESSION_NAME))
    // .then(localforage.removeItem('loginResponse'))
    .catch(e => {
      console.error('error during logout', e); // eslint-disable-line no-console
    })
    .finally(() => {
      // clear the console unless config asks to preserve it
      // if (!config.preserveConsole) {
      //   console.clear(); // eslint-disable-line no-console
      // }
      // clear the storage sentinel
      sessionStorage.removeItem(IS_LOGGING_OUT);
    });
}

/**
 * checkOkapiSession
 * 1. Pull the session from local storage; if it contains a user id,
 *    validate it by fetching /_self to verify that it is still active,
 *    dispatching load-resources actions.
 * 2. Check if SSO (SAML) is enabled, dispatching check-sso actions
 * 3. dispatch set-okapi-ready.
 *
 * @param {string} okapiUrl
 * @param {string} tenant
 */
function checkOkapiSession(okapiUrl, tenant) {
  getOkapiSession()
    .then((sess) => {
      const handleError = () => logout(okapiUrl, store);
      return sess?.user?.id ? validateUser(okapiUrl, store, tenant, sess, handleError) : null;
    })
    .then((res) => {
      // check whether SSO is enabled if either
      // 1. res is null (when we are starting a new session)
      // 2. login-saml interface is present (when we are resuming an existing session)
      if (!res || store.getState().discovery?.interfaces?.['login-saml']) {
        return getSSOEnabled(okapiUrl, store, tenant);
      }
      return Promise.resolve();
    })
    .finally(() => {
      //store.dispatch(setOkapiReady());
    });
}

/**
 * createOkapiSession
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
 * @returns {Promise}
 */
async function createOkapiSession(tenant, token, data) {
  const { user, perms } = spreadUserWithPerms(data);

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
  const okapiSess = {
    token,
    isAuthenticated: true,
    user,
    perms,
    tenant: sessionTenant,
    tokenExpiration,
  };

  return Promise.resolve(okapiSess);
}

/**
 * requestLogin
 * authenticate with a username and password. return a promise that posts the values
 * and then processes the result to begin a session.
 * @param {string} okapiUrl
 * @param {string} tenant
 * @param {object} data
 *
 * @returns {Promise}
 */
function requestLogin(okapiUrl, tenant, data) {
  const loginPath = 'login-with-expiry';
  return fetch(`${okapiUrl}/bl-users/${loginPath}?expandPermissions=true&fullPermissions=true`, {
    body: JSON.stringify(data),
    credentials: 'include',
    headers: { 'X-Okapi-Tenant': tenant, 'Content-Type': 'application/json' },
    method: 'POST',
    mode: 'cors',
  })
    .then(resp => processOkapiSession(tenant, resp));
}

/**
 * handleLoginError
 * Clear out session data, dispatch authentication errors, then dispatch
 * okapi-ready to indicate that we're ready to start fresh. Return the
 * response-body, er, JSON, from the failed auth-n request.
 *
 * @param {Response} resp HTTP response from a failed auth-n request
 *
 * @returns {Promise} resolving to the response's JSON
 */
function handleLoginError(resp) {
  processBadResponse(resp)
  // return localforage.removeItem(SESSION_NAME)
  //   .then(() => processBadResponse(resp))
  //   .then(responseBody => {
  //     //dispatch(setOkapiReady());
  //     return responseBody;
  //   });
}

/**
 * processOkapiSession
 * create a new okapi session with the response from either a username/password
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
 * @returns {Promise} resolving with login response body, rejecting with, ummmmm
 */
function processOkapiSession(tenant, resp, ssoToken) {
  if (resp.ok) {
    return resp.json()
      .then(json => {
        const token = resp.headers.get('X-Okapi-Token') || json.access_token || ssoToken;
        return createOkapiSession(tenant, token, json)
          .then(() => json);
      })
      .then((json) => {
        return json;
      });
  } else {
    return handleLoginError(resp);
  }
}

/**
 * isStorageEnabled
 * Return true if local-storage, session-storage, and cookies are all enabled.
 * Return false otherwise.
 * @returns boolean true if storages are enabled; false otherwise.
 */
function isStorageEnabled() {
  let isEnabled = true;
  // local storage
  try {
    localStorage.getItem('test-key');
  } catch (e) {
    console.warn('local storage is disabled'); // eslint-disable-line no-console
    isEnabled = false;
  }

  // session storage
  try {
    sessionStorage.getItem('test-key');
  } catch (e) {
    console.warn('session storage is disabled'); // eslint-disable-line no-console
    isEnabled = false;
  }

  // cookies
  if (!navigator.cookieEnabled) {
    console.warn('cookies are disabled'); // eslint-disable-line no-console
    isEnabled = false;
  }

  return isEnabled;
};

requestLogin(window.okapi.url || '', window.okapi.tenant || '', {
  username: 'testuser',
  password: 'testpass',
});