const SESSION_USER_KEY = 'okapiSess';
const SESSION_ENTITLEMENT_KEY = '@folio/entitlement';
const APP_MAX_COUNT = 500;

/** name for the session key in local storage */
const SESSION_NAME = 'okapiSess';

/** key for the logging out action */
const IS_LOGGING_OUT = '@folio/stripes/core::Logout';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

/** key for login response in local storage */
const LOGIN_RESPONSE = 'loginResponse';

/** path to users API call */
const USERS_PATH = 'users-keycloak';

// eslint-disable-next-line no-unused-vars
class StripesHub {
  constructor(gateways, config) {
    this.gateways = gateways;
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
    const session = await localforage.getItem(SESSION_USER_KEY);
    return session;
  };

  sessionIsValid = (session) => {
    // For now, just check for presence of userId
    return !!session.user.id;
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
    return `${this.gateways.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
  };

  /**
   * getHeaders
   * Construct headers for FOLIO requests.
   *
   * @param {*} tenant the tenant name
   * @returns {object} headers for FOLIO requests
   */
  getHeaders = (tenant) => {
    return {
      'X-Okapi-Tenant': tenant,
      'Content-Type': 'application/json',
    };
  }

  cacheUserData = async (tenant) => {
    console.log('caching user data for tenant', tenant);
    const resp = await fetch(`${this.gateways.url}/${USERS_PATH}/_self?expandPermissions=true`, {
      headers: this.getHeaders(tenant),
      credentials: 'include',
      mode: 'cors',
    });
    if (resp.ok) {
      const data = await resp.json();
      await localforage.setItem(SESSION_USER_KEY, data);
      console.log('cached!', data);
    } else {
      const text = await resp.text();
      throw text;
    }
  }

  cacheEntitlementData = async (tenant) => {
    console.log('caching entitlement data for tenant', tenant);

    const resp = await fetch(`${this.gateways.url}/entitlements/${tenant}/applications?limit=${APP_MAX_COUNT}`, {
      headers: this.getHeaders(tenant),
      credentials: 'include',
      mode: 'cors',
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.totalRecords > 0) {
        await localforage.setItem(SESSION_ENTITLEMENT_KEY, data.applicationDescriptors);
        console.log('cached!', data.applicationDescriptors);
      } else {
        throw new Error(`No applications available for tenant ${tenant}`);
      }
    } else {
      const text = await resp.text();
      throw text;
    }
  }


  loadStripes = async () => {
    console.log('loading Stripes...');
    const host = 'http://localhost:8080';

    const text = await fetch(`${host}/manifest.json`).then(res => res.text());
    const manifest = JSON.parse(text);

    const styles = manifest.entrypoints.css.imports || [];
    const scripts = manifest.entrypoints.stripesConfig.imports || [];
    for (const entry of manifest.entrypoints.index.imports) {
      if (entry.endsWith('.css')) {
        styles.push(entry);
      } else if (entry.endsWith('.js')) {
        scripts.push(entry);
      }
    }

    const base = document.createElement('base');
    base.href = host;
    document.head.append(base);

    styles.forEach((href) => {
      const style = document.createElement('link');
      style.href = `${host}${manifest.assets[href].file}`;
      style.type = 'text/css';
      style.rel = 'stylesheet';
      document.head.append(style);
    });

    scripts.forEach((src) => {
      const script = document.createElement('script');
      script.src = `${host}${manifest.assets[src].file}`;
      document.head.appendChild(script);
    });
  }

  authenticate = async () => {
    //@@ await localforage.clear();

    const loginTenant = this.getCurrentTenant();
    const redirectUri = this.getOIDCRedirectUri(loginTenant.name, loginTenant.clientId);

    window.location.href = `${this.gateways.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
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
    try {
      const session = await this.getSession();
      if (session && this.sessionIsValid(session)) {
        console.log('session is valid')
        const tenant = this.getCurrentTenant().name;
        const { tenant: sessionTenant = tenant } = session;
        // await this.cacheUserData(sessionTenant);
        // await this.cacheEntitlementData(sessionTenant);
        await this.loadStripes();
      } else {
        console.log('session is missing; authenticating');
        document.body.innerHTML = '<h2>Redirecting to login...</h2>';
        // this.authenticate();
      }
    } catch (e) {
      console.error('error during StripesHub init', e); // eslint-disable-line no-console
      alert(`error during StripesHub init: ${JSON.stringify(e, null, 2)}`); // eslint-disable-line no-alert
    }
  }
}
