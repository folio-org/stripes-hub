import React, { useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import PreLoginLanding from './PreLoginLanding';

import {
  setUnauthorizedPathToSession,
  getLoginUrl,
  storeCurrentTenant,
} from './loginServices';

const AuthnLogin = ({config, branding}) => {
  const { tenantOptions } = config;
  const tenants = Object.values(tenantOptions);

  useLayoutEffect(() => {
    /**
     * Cache the current path so we can return to it after authenticating.
     * In RootWithIntl, unauthenticated visits to protected paths will be
     * handled by this component, i.e.
     *   /some-interesting-path <AuthnLogin>
     * but if the user was de-authenticated due to a session timeout, they
     * will have a history something like
     *   /some-interesting-path <SomeInterestingComponent>
     *   /logout <Logout>
     *   / <AuthnLogin>
     * but we still want to return to /some-interesting-path, which will
     * have been cached by the logout-timeout handler, and must not be
     * overwritten here.
     *
     * @see OIDCRedirect
     */
    if (config.authnUrl && globalThis.location.pathname !== '/') {
      setUnauthorizedPathToSession();
    }

    // If only 1 tenant is defined in config (in either okapi or config.tenantOptions) set to okapi to be accessed there
    // in the rest of the application for compatibity across existing modules.
    if (tenants.length === 1) {
      const loginTenant = tenants[0];
      storeCurrentTenant(loginTenant.name, loginTenant.clientId);
    }
    // we only want to run this effect once, on load.
    // okapi.authnUrl tenant values are defined in index.html
  }, []);

  if (config.authnUrl) {
    // If only 1 tenant is defined in config, skip the tenant selection screen.
    if (tenants.length === 1) {
      const loginTenant = tenants[0];

      globalThis.location.replace(getLoginUrl(config, loginTenant.name, loginTenant.clientId));
    }

    return <PreLoginLanding onSelectTenant={storeCurrentTenant} config={config} branding={branding} tenantOptions={tenantOptions} />;
  }
};

AuthnLogin.propTypes = {
  config: PropTypes.shape({
    authnUrl: PropTypes.string.isRequired,
    tenantOptions: PropTypes.object.isRequired,
  }).isRequired,
  branding: PropTypes.shape({
    logo: PropTypes.string,
    altText: PropTypes.string,
  }),
};

export default AuthnLogin;
