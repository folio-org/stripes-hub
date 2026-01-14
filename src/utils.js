/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

/** name for the folio access token cookie */
const FOLIO_ACCESS_TOKEN = 'folioAccessToken';

/** key for the logging out action */
const IS_LOGGING_OUT = '@folio/stripes/core::Logout';

/**
 * dispatched if the session is idle (without activity) for too long
 */
const RTR_TIMEOUT_EVENT = '@folio/stripes/core::RTRIdleSessionTimeout';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

/** key for login response in local storage */
const LOGIN_RESPONSE = 'loginResponse';

/** path to users API call */
const USERS_PATH = 'users-keycloak';

class Utils {
  constructor(stripes, config) {
    this.stripes = stripes;
    this.config = config;
  }

  /**
   * getHeaders
   * Construct headers for FOLIO requests.
   *
   * @param {string} tenant the tenant name
   * @param {string} token the auth token
   * @returns {object} headers for FOLIO requests
   */
  getHeaders = (tenant, token) => {
    return {
      'X-Okapi-Tenant': tenant,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'X-Okapi-Token': token }),
    };
  };

  /**
   * getCookie
   * Retrieve a cookie value by name.
   * Based on code from https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
   * 
   * @param {string} name 
   */
  getCookie = (name) => {
    document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
  };

  /**
   * setCookieFromHttpResponse
   * Set cookies from the response headers.
   *
   * @param {Response} response the fetch response object
   */
  setCookieFromHttpResponse = (response) => {
    for (const entry of response.headers.entries()) {
      //const rawCookies = response.headers.getSetCookie();
      if (entry[0].toLowerCase() === 'set-cookie') {
        entry[1].split(',').forEach(cookieStr => {
          document.cookie = cookieStr;
        });
      }
    }
  };

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
  getLoginTenant = (stripesConfig) => {
    // derive from the URL
    const urlParams = new URLSearchParams(window.location.search);
    let tenant = urlParams.get('tenant');
    let clientId = urlParams.get('client_id');

    // derive from stripes.config.js::config::tenantOptions
    if (stripesConfig?.tenantOptions && Object.keys(stripesConfig?.tenantOptions).length === 1) {
      const key = Object.keys(stripesConfig.tenantOptions)[0];
      tenant ||= stripesConfig.tenantOptions[key]?.name;
      clientId ||= stripesConfig.tenantOptions[key]?.clientId;
    }

    // default to stripes.config.js::okapi
    tenant ||= stripesOkapi?.tenant;
    clientId ||= stripesOkapi?.clientId;

    return {
      tenant,
      clientId,
    };
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
   * storeLogoutTenant
   * Store the tenant ID in local storage for use during logout.
   *
   * @param {string} tenantId the tenant ID
   */
  storeLogoutTenant = (tenantId) => {
    localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify({ tenantId }));
  };

  processBadResponse = async (response, defaultClientError) => {
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
}