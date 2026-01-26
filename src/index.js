/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

/** key for login response in local storage */
const LOGIN_RESPONSE = 'loginResponse';

/** path to users API call */
const USERS_PATH = 'users-keycloak';

/** name for whatever the entitlement service will call the hub app (stripes, stripes-core, etc.) */
const HOST_APP_NAME = 'folio_stripes';

// const keys to-be-ingested by stripes-core
const HOST_LOCATION_KEY = 'hostLocation';
const REMOTE_LIST_KEY = 'entitlements';
const DISCOVERY_URL_KEY = 'entitlementUrl';

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

  sessionIsValid = (session) => {
    return session && session.isAuthenticated;
  }

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

  getConfigTenant = () => {
    const tenants = Object.values(this.config.tenantOptions);

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
      headers: this.getHeaders(tenant),
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
        await localforage.setItem(SESSION_NAME, data);

        return data;
      } else {
        const text = await resp.text();
        throw text;
      }
    } catch (error) {
      // error a warning, then call the error handler if we received one
      console.error(error); // eslint-disable-line no-console
      return handleError ? handleError() : Promise.resolve();
    }
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
    const json = await this.ffetch(`${this.stripes.url}/entitlements/${tenant}/applications`, tenant);
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

    const discoveryUrl = this.stripes.discoveryUrl ?? `${this.stripes.url}/modules/discovery`;
    const json = await this.ffetch(`${discoveryUrl}?limit=100`, tenant);
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
    this.stripesCore = json.discovery.find((entry) => entry.name === 'folio_stripes-core');

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

    const manifestJSON = await fetch(`${this.stripesCore.location}/manifest.json`);
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
      link.href = `${this.stripesCore.location}/${cssFile}`;
      document.head.appendChild(link);
    });

    jsImports.forEach((jsRef) => {
      const jsFile = manifest.assets[jsRef].file;
      import(`${this.stripesCore.location}/${jsFile}`);
    });
  }

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
  init = async () => {
    try {
      const session = await this.getSession();
      if (session && this.sessionIsValid(session)) {
        const tenant = this.getSessionTenant(session);
        const { tenant: sessionTenant = tenant } = session;

        const uiMap = await this.fetchEntitlements(sessionTenant);
        const disco = await this.fetchDiscovery(sessionTenant, uiMap, this.handleWithLog);

        await localforage.setItem(DISCOVERY_URL_KEY, this.stripes.discoveryUrl ?? this.stripes.url);
        await localforage.setItem(HOST_APP_NAME, 'folio_stripes');
        await localforage.setItem(HOST_LOCATION_KEY, this.stripesCore.location);
        await localforage.setItem(REMOTE_LIST_KEY, Object.values(disco).filter(module => module.name !== 'folio_stripes-core'));

        await this.loadStripes();
      } else {
        console.error('session is missing; authenticating');
        document.body.innerHTML = '<h2>Redirecting to login...</h2>';
        // this.authenticate();
      }
    } catch (e) {
      console.error('error during StripesHub init', e); // eslint-disable-line no-console
      alert(`error during StripesHub init: ${JSON.stringify(e, null, 2)}`); // eslint-disable-line no-alert
    }
  }
}
