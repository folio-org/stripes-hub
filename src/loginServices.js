import localforage from 'localforage';
import { isObject } from 'lodash';

import { defaultErrors } from './constants';

/** name for the session key in local storage */
export const SESSION_NAME = 'okapiSess';

/** key for the logging out action */
export const IS_LOGGING_OUT = '@folio/stripes/core::Logout';

/**
 * dispatched if the session is idle (without activity) for too long
 */
export const RTR_TIMEOUT_EVENT = '@folio/stripes/core::RTRIdleSessionTimeout';

/** key for storing tenant info in local storage */
export const TENANT_LOCAL_STORAGE_KEY = 'tenant';

/** key for login response in local storage */
export const LOGIN_RESPONSE = 'loginResponse';

/** path to users API call */
export const USERS_PATH = 'users-keycloak';

/** name for whatever the entitlement service will call the hub app (stripes, stripes-core, etc.) */
const HOST_APP_NAME = 'folio_stripes';

const MEDATADATA_KEY = 'discovery';

// const keys to-be-ingested by stripes-core
const HOST_LOCATION_KEY = 'hostLocation';
const REMOTE_LIST_KEY = 'entitlements';
const ENTITLEMENT_URL_KEY = 'entitlementUrl';

 /** fetchEntitlement
   * fetches entitlement data including the name, version, and location of each remote module and the host app.
   * @param {string} entitlementUrl the endpoing to fetch entitlement data from
   * @returns {object} entitlement data object
   */

  const fetchEntitlement = async (entitlementUrl) => {
    const entitlements = await fetch(entitlementUrl);
    if (!entitlements.ok) {
      throw new Error(`Failed to fetch entitlements from ${entitlementUrl}: ${entitlements.status} ${entitlements.statusText}`);
    }
    const entitlementData = await entitlements.json();
    return entitlementData;
  };

  /** fetchModuleMetadata
   * Fetches module metadata - originally from the package.json of each module that categorizes the module
   * @param {string} moduleMetadataUrl the URL to fetch module metadata from
   * @returns {object} module metadata object
   *
  */

  const fetchModuleMetadata = async (moduleMetadataUrl) => {
    const moduleMetadataResp = await fetch(moduleMetadataUrl);
    if (!moduleMetadataResp.ok) {
      throw new Error(`Failed to fetch module metadata from ${moduleMetadataUrl}: ${moduleMetadataResp.status} ${moduleMetadataResp.statusText}`);
    }
    const moduleMetadata = await moduleMetadataResp.json();
    return moduleMetadata;
  };

  /**
   * loadStripes
   * Dynamically load Stripes core assets based on manifest.json.
   */
  export const loadStripes = async (stripes) => {
    console.log('Loading Stripes...'); // eslint-disable-line no-console

    //TODO: make these dynamic based on config for deployed tenants, for now it is the same as entitlementUrl
    //const moduleMetadataUrl = `${ENTITLEMENT_URL}/entitlements/${TENANT_NAME}/applications`;
    const moduleMetadataUrl = stripes.entitlementUrl;
    const stripesCoreLocation = stripes.stripesCoreUrl; // or procured from entitlement response...

    // store the location for stripes to pick up when it loads.

    await localforage.setItem(ENTITLEMENT_URL_KEY, stripes.entitlementUrl);

    const entitlementData = await fetchEntitlement(stripes.entitlementUrl);

    // fetch module metadata...
    const moduleMetadata = await fetchModuleMetadata(moduleMetadataUrl);

    moduleMetadata[MEDATADATA_KEY].forEach((module) => {
      const entitlementEntry = entitlementData.discovery.findIndex((entry) => entry.name === module.name);
      entitlementData.discovery[entitlementEntry].metadata = module;
    });

    // pull the host app out of the registry and store its location in localforage to pass to stripes.
    const hostEntitlement = entitlementData.discovery.find((entry) => entry.name === HOST_APP_NAME);
    if (hostEntitlement) {
      stripesCoreLocation = hostEntitlement.url;
    }
    await localforage.setItem(HOST_LOCATION_KEY, stripesCoreLocation);

    const entitlementMinusStripes = entitlementData.discovery.filter((entry) => entry.name !== HOST_APP_NAME);
    await localforage.setItem(REMOTE_LIST_KEY, entitlementMinusStripes);

    const manifestJSON = await fetch(`${stripesCoreLocation}/manifest.json`);
    const manifest = await manifestJSON.json();

    // collect imports...
    const JSimports = new Set();
    const CSSimports = new Set();
    Object.keys(manifest.entrypoints).forEach((entry) => {
      manifest.entrypoints[entry].imports.forEach((imp) => {
        if (imp.endsWith('.js')) {
          JSimports.add(imp);
        } else if (imp.endsWith('.css')) {
          CSSimports.add(imp);
        }
      });
    });

    CSSimports.forEach((cssRef) => {
      const cssFile = manifest.assets[cssRef].file;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${stripesCoreLocation}${cssFile}`;
      document.head.appendChild(link);
    });

    JSimports.forEach((jsRef) => {
      const jsFile = manifest.assets[jsRef].file;
      import(/* webpackIgnore: true */ `${stripesCoreLocation}${jsFile}`);
    });
  }

/**
 * getHeaders
 * Construct headers for FOLIO requests.
 *
 * @param {string} tenant the tenant name
 * @param {string} token the auth token
 * @returns {object} headers for FOLIO requests
 */
export const getHeaders = (tenant, token) => {
  return {
    'X-Okapi-Tenant': tenant,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token && { 'X-Okapi-Token': token }),
  };
};

/**
 * getSession
 * simple wrapper around access to values stored in localforage
 * to insulate RTR functions from that API.
 *
 * @returns {object} Session object from localforage
*/
export const getSession = () => {
  return localforage.getItem(SESSION_NAME);
};

/**
 * getLoginTenant
 * Retrieve tenant and clientId values. In order of preference, look here:
 *
 * 1 the URL for params named tenant and client_id
 * 2 stripes.config.js::config::tenantOptions iff it contains a single tenant,
 *   i.e. if it is shaped like this:
 *   tenantOptions: { someT: { name: 'someT', clientId: 'someC' }}
 * 3 stripes.config.js::okapi, the deprecated-but-historical location of these
 *   values
 *
 * @param {*} stripesConfig stripes.config.js::config
 * @returns { tenant: string, clientId: string }
 */
export const getLoginTenant = (stripesConfig) => {
  // derive from the URL
  const urlParams = new URLSearchParams(window.location.search);
  let name = urlParams.get('tenant');
  let clientId = urlParams.get('client_id');

  // derive from stripes.config.js::config::tenantOptions
  if (stripesConfig?.tenantOptions && Object.keys(stripesConfig?.tenantOptions).length === 1) {
    const key = Object.keys(stripesConfig.tenantOptions)[0];
    name ||= stripesConfig.tenantOptions[key]?.name;
    clientId ||= stripesConfig.tenantOptions[key]?.clientId;
  }

  return {
    name,
    clientId,
  };
};

/**
 * getLogoutTenant
 * Retrieve the tenant ID from local storage for use during logout.
 *
 * @returns {object|undefined} tenant info object or undefined if not found
 */
export const getLogoutTenant = () => {
  const storedTenant = localStorage.getItem(TENANT_LOCAL_STORAGE_KEY);
  return storedTenant ? JSON.parse(storedTenant) : undefined;
};

/**
 * storeLogoutTenant
 * Store the tenant ID in local storage for use during logout.
 *
 * @param {string} tenantId the tenant ID
 */
export const storeLogoutTenant = (tenantId) => {
  localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify({ tenantId }));
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
export const spreadUserWithPerms = (userWithPerms) => {
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
export const setTokenExpiry = async (te) => {
  if (Number.isInteger(te.atExpires) && Number.isInteger(te.rtExpires)) {
    const tokenExpiration = {
      ...te,
      accessTokenExpiration: new Date(te.atExpires).toISOString(),
      refreshTokenExpiration: new Date(te.rtExpires).toISOString(),
    };

    const sess = await getSession();
    const val = { ...sess, tokenExpiration };
    return localforage.setItem(SESSION_NAME, val);
  }

  // eslint-disable-next-line no-console
  console.error('Expected { atExpires: int, rtExpires: int }; received', te);
  return Promise.reject(new TypeError('Did not receive { atExpires: int, rtExpires: int }'));
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
export const createSession = async (tenant, token, data, stripes) => {
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
  loadStripes(stripes);
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
export const processSession = async (tenant, resp, ssoToken, stripes) => {
  if (resp.ok) {
    const json = await resp.json();
    const token = resp.headers.get('X-Okapi-Token') || json.access_token || ssoToken;
    await createSession(tenant, token, json, stripes);
    return json;
  } else {
    // handleLoginError will dispatch setAuthError, then resolve to undefined
    return handleLoginError(resp);
  }
};

/**
 * requestUserWithPerms
 * retrieve currently-authenticated user, then process the result to begin a session.
 * @param {object} stripes
 * @param {string} tenant
 * @param {string} token
 *
 * @returns {Promise} Promise resolving to the response-body (JSON) of the request
 */
export const requestUserWithPerms = async (stripes, tenant, token) => {
  const resp = await fetchOverriddenUserWithPerms(stripes.url, tenant, token, !token);

  if (resp.ok) {
    const sessionData = await processSession(tenant, resp, token, stripes);
    return sessionData;
  } else {
    const error = await resp.json();
    throw error;
  }
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
export const fetchOverriddenUserWithPerms = async (serverUrl, tenant, token, rtrIgnore = false) => {
  const res = await fetch(
    `${serverUrl}/users-keycloak/_self?expandPermissions=true&fullPermissions=true&overrideUser=true`,
    {
      headers: getHeaders(tenant, token),
      credentials: "include",
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
export const handleLoginError = async (resp) => {
  await localforage.removeItem(SESSION_NAME);
  const responseBody = await processBadResponse(resp);

  return responseBody;
};

export const getProcessedErrors = (response, status, defaultClientError) => {
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
};

export const getLoginErrors = (payload) => {
  try {
    if (isObject(payload)) {
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

export const processBadResponse = async (response, defaultClientError) => {
  const clientError = defaultClientError || defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR;
  let actionPayload;

  try {
    const responseBody = await response.json();
    const responsePayload = responseBody.errorMessage || responseBody;
    actionPayload = getProcessedErrors(responsePayload, response.status, clientError);
  } catch (e) {
    actionPayload = [defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR];
  }

  return actionPayload;
};
