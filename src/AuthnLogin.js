import React, { useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import PreLoginLanding from './PreLoginLanding';

import {
  getLoginUrl,
  storeCurrentTenant,
} from './loginServices';

const AuthnLogin = ({config, branding}) => {
  const { tenantOptions } = config;
  const tenants = Object.values(tenantOptions);

  useLayoutEffect(() => {
    // If only 1 tenant is defined in config, set as current tenant.
    if (tenants.length === 1) {
      const loginTenant = tenants[0];
      storeCurrentTenant(loginTenant.name, loginTenant.clientId);
    }
    // we only want to run this effect once, on load.
    // config tenant values are defined in index.html
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
