import localforage from 'localforage';
import { isObject, noop } from 'lodash';

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

// const keys to-be-ingested by stripes-core
const DISCOVERY_URL_KEY = 'entitlementUrl';
const HOST_LOCATION_KEY = 'hostLocation';
const REMOTE_LIST_KEY = 'entitlements';

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
 * @returns {Promise<string>} Session object from localforage
*/
export const getSession = async () => {
  const session = await localforage.getItem(SESSION_NAME);
  return session;
};

/**
 * getLoginTenant
 * Retrieve tenant and clientId values from the URL for params named tenant and client_id.
 *
 * @returns { tenant: string, clientId: string }
 */
export const getLoginTenant = () => {
  // derive from the URL
  const urlParams = new URLSearchParams(globalThis.location.search);
  let name = urlParams.get('tenant');
  let clientId = urlParams.get('client_id');

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

/** error-handler: log it */
const handleWithLog = (msg) => {
  console.error(msg); // eslint-disable-line no-console
};

/** error-handler: throw it */
const handleWithThrow = (msg) => {
  throw new Error(msg);
};

/**
 * ffetch (folio-fetch)
 * Wrapper around fetch to include Okapi headers and error handling. Throws
 * if response is not ok. Returns parsed JSON response.
 *
 * @param {string} url URL to retrieve
 * @param {string} tenant tenant for x-okapi-tenant header
 * @returns {Promise} resolves to the JSON response
 */
const ffetch = async (url, tenant) => {
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
 * @param {object} config config
 * @param {string} tenant
 * @returns {Promise<map>} map of entitlement data, keyed by module ID
 */
const fetchEntitlements = async (config, tenant) => {
  const entitlement = {};
  const json = await ffetch(`${config.hostUrl}/entitlements/${tenant}/applications`, tenant);
  const elist = json.applicationDescriptors;
  elist.forEach(application => {
    application.uiModules.forEach(module => {
      entitlement[module.id] = module;

      // store application IDs for use in the dicovery API query
      entitlement[module.id].applicationId = application.id;
    });
    application.uiModuleDescriptors.forEach(module => {
      if (entitlement[module.id]) {

        entitlement[module.id].okapiInterfaces = module.requires;
        entitlement[module.id].optionalOkapiInterfaces = module.optional;
        entitlement[module.id] = { ...entitlement[module.id], ...module.metadata?.stripes };
      }
    });
  });

  return entitlement;
};

/**
 * fetchCustomDiscovery
 * Fetch discovery data with a single query. Knit results into the provided
 * entitlement data, returning a new map of module ID to
 * entitlement/discovery/module-descriptor data
 *
 * @param {object} config config
 * @param {string} tenant
 * @param {object} entitlement
 * @param {function} handler handler for orphaned discovery entries
 * @returns {Promise<object>} map of entitlement and discovery data, keyed by module ID
 */
const fetchCustomDiscovery = async (config, tenant, entitlement) => {
  const map = {};

  const json = await ffetch(`${config.discoveryUrl}`, tenant);
  json.discovery.forEach(entry => {
    if (entitlement[entry.id]) {
      console.log(`Adding discovery data for ${entry.id} => ${entry.location}`);
      map[entry.id] = entitlement[entry.id];
      map[entry.id].location = entry.location;
    }
  });

  return map;
};

/**
 * fetchDefaultDiscovery
 * Fetch discovery data for each of the given applications by application-id.
 * Knit results into the provided entitlement data, returning a new map of
 * module ID to entitlement/discovery/module-descriptor data
 *
 * @param {object} config
 * @param {string} tenant
 * @param {object} entitlement
 * @returns {Promise<object>} map of entitlement and discovery data, keyed by module ID
 */
const fetchDefaultDiscovery = async (config, tenant, entitlement) => {
  const map = {};

  const applicationIds = Array.from(new Set(Object.values(entitlement).map(mod => mod.applicationId)));

  for (const appId of applicationIds) {
    const json = await ffetch(`${config.hostUrl}/applications/${appId}/discovery?limit=500`, tenant);
    json.discovery.forEach(entry => {
      if (entitlement[entry.id]) {
        console.log(`Adding discovery data for ${entry.id} => ${entry.location}`);
        map[entry.id] = entitlement[entry.id];
        map[entry.id].location = entry.location;
      }
    });
  };

  return map;
};

/**
 * fetchDiscovery
 * Fetch discovery data for the tenant and merge it with corresponding
 * entitlement data, returning the intersection. (e.g. if discovery has
 * entries for a, b, c and entitlement has entries for b, c, d then the
 * returned map will have entries for b and c only.)
 *
 * @param {object} config
 * @param {string} tenant
 * @param {map} entitlement
 * @returns {Promise<object>} map of entitlement and discovery data, keyed by module ID
 */
const fetchDiscovery = async (config, tenant, entitlement) => {
  // Ordinarily, the discovery API query goes against the same gateway as
  // any other API query. Running module-federation locally, however, requires
  // running a local discovery server, and routing discovery API queries only
  // to that local server. Provide the config value `discoveryUrl` to do so.
  const discoveryHandler = config.discoveryUrl ? fetchCustomDiscovery : fetchDefaultDiscovery;
  const map = await discoveryHandler(config, tenant, entitlement);

  // modules have names like @folio/users but they are registered in entitlement
  // with names like folio_users. who is responsible for this nonsense? anyway, fix it here.
  // this is horribly brittle. what if we had a package @oh_noes/hosed that
  // went into discovery as oh_noes_hosed? we'd be hosed.
  // to be addressed in STRIPES-1009
  Object.keys(map).forEach((key) => {
    map[key].module = `@${map[key].name.replace('_', '/')}`;
  });

  return map;
};

/**
 * loadStripes
 * Dynamically load stripes CSS and JS assets using the build's manifest.json.
 * Stripes will bootstrap itself once its JS is loaded.
 */
const loadStripes = async (stripesCore) => {
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
    link.href = `${stripesCore.location}${cssFile}`;
    document.head.appendChild(link);
  });

  jsImports.forEach((jsRef) => {
    const jsFile = manifest.assets[jsRef].file;
    // dynamic import doesn't work here?!?
    const script = document.createElement('script');
    script.src = `${stripesCore.location}${jsFile}`;
    document.body.appendChild(script);
  });

  // compilers get cranky in functions marked async that don't await anything,
  // so we have to return _something_ here.
  return Promise.resolve();
}

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
 * @param {string} tenant
 * @returns {Promise<void>} resolves when stripes is initialized
 */
export const initStripes = async (config, tenant) => {
  const entitlement = await fetchEntitlements(config, tenant);
  const discovery = await fetchDiscovery(config, tenant, entitlement);

  const stripesCore = Object.values(discovery).find((entry) => entry.name === 'folio_stripes-core');
  if (stripesCore) {
    await localforage.setItem(DISCOVERY_URL_KEY, config.discoveryUrl ?? config.hostUrl);
    await localforage.setItem(HOST_APP_NAME, 'folio_stripes');
    await localforage.setItem(HOST_LOCATION_KEY, stripesCore.location);

    // REMOTE_LIST_KEY stores the list of apps that stripes will load,
    // so we have to remove stripes from that list. Otherwise, Malkovich.
    // Malkovich Malkovich Malkovich? Malkovich!
    await localforage.setItem(REMOTE_LIST_KEY, Object.values(discovery).filter(module => module.name !== 'folio_stripes-core'));

    return loadStripes(stripesCore);
  }

  throw new Error('Could not find stripes-core in discovery data');
}

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
  throw new TypeError('Did not receive { atExpires: int, rtExpires: int }');
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
 * then initalize and load stripes.
 *
 * @param {string} tenant tenant name
 * @param {string} token access token [deprecated; prefer folioAccessToken cookie]
 * @param {*} data response from call to _self
 * @param {object} config
 *
 * @returns {Promise} resolving when stripes is initialized
 */
export const createSession = async (tenant, token, data, config) => {
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
  await initStripes(config, tenant);
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
  * @param {string} ssoToken token from SSO login, if any
  * @param {object} config
  *
  * @returns {Promise} resolving to login response body or undefined on error
  */
export const processSession = async (tenant, resp, ssoToken, config) => {
  if (resp.ok) {
    const json = await resp.json();
    const token = resp.headers.get('X-Okapi-Token') || json.access_token || ssoToken;
    await createSession(tenant, token, json, config);
    return json;
  } else {
    // handleLoginError will dispatch setAuthError, then resolve to undefined
    return handleLoginError(resp);
  }
};

/**
 * requestUserWithPerms
 * retrieve currently-authenticated user, then process the result to begin a session.
 * @param {object} config
 * @param {string} tenant
 * @param {string} token
 *
 * @returns {Promise} Promise resolving to the response-body (JSON) of the request
 */
export const requestUserWithPerms = async (config, tenant, token) => {
  const resp = await fetchOverriddenUserWithPerms(config.hostUrl, tenant, token, !token);

  if (resp.ok) {
    const sessionData = await processSession(tenant, resp, token, config);
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
