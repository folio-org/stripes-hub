/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

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

/** name for whatever the entitlement service will call the hub app (stripes, stripes-core, etc.) */
const HOST_APP_NAME = 'folio_stripes';

const ENTITLEMENT_URL = 'http://localhost:3001/registry';
const TENNANT_NAME = 'diku';
const MODULE_METADATA_URL = `${ENTITLEMENT_URL}/entitlements/${TENNANT_NAME}/applications`;
const MEDATADATA_KEY = 'discovery';

// const keys to-be-ingested by stripes-core
const HOST_LOCATION_KEY = 'hostLocation';
const REMOTE_LIST_KEY = 'entitlements';
const ENTITLEMENT_URL_KEY = 'entitlementUrl';

// eslint-disable-next-line no-unused-vars
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
  getSession = () => {
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
  }

  /**
   * logout
   * Redirect to login URL to initiate logout process.
   */
  logout = async () => {
    window.location.href = this.getLoginUrl();

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
      await fetch(`${this.stripes.url}/authn/logout`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        // Since the tenant in the x-okapi-token and the x-okapi-tenant header
        // on logout should match, switching affiliations updates
        // store.okapi.tenant, leading to mismatched tenant names from the token.
        // Use the tenant name stored during login to ensure they match.
        headers: this.getHeaders(this.getLogoutTenant()?.tenantId),
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
    if (!this.config.preserveConsole) {
      console.clear(); // eslint-disable-line no-console
    }
    // clear the storage sentinel
    sessionStorage.removeItem(IS_LOGGING_OUT);
  }

  /** fetchEntitlement
   * fetches entitlement data including the name, version, and location of each remote module and the host app.
   * @param {string} entitlementUrl the endpoing to fetch entitlement data from
   * @returns {object} entitlement data object
   */

  fetchEntitlement = async (entitlementUrl) => {
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

  fetchModuleMetadata = async (moduleMetadataUrl) => {
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
  loadStripes = async () => {
    console.log('Loading Stripes...'); // eslint-disable-line no-console

    let stripesCoreLocation = 'http://localhost:3000'; // or procured from entitlement response...

    // store the location for stripes to pick up when it loads.

    await localforage.setItem(ENTITLEMENT_URL_KEY, ENTITLEMENT_URL);

    const entitlementData = await this.fetchEntitlement(ENTITLEMENT_URL);

    // fetch module metadata...
    const moduleMetadata = await this.fetchModuleMetadata(MODULE_METADATA_URL);

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
      const cssFile = manifest.assets[cssRef].file
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${stripesCoreLocation}${cssFile}`;
      document.head.appendChild(link);
    });

    JSimports.forEach((jsRef) => {
      const jsFile = manifest.assets[jsRef].file;
      import(`${stripesCoreLocation}${jsFile}`);
      //   const script = document.createElement('script');
      //   script.src = `${stripesCoreLocation}${jsFile}`;
      //   document.body.appendChild(script);
    });
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
    await this.loadStripes();
    // const session = await this.getSession();
    // const handleError = () => this.logout();

    // return session?.user?.id ? this.validateSession(session, handleError) : handleError();
  }
}
