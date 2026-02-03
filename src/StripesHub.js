import localforage from 'localforage';
import PropTypes from 'prop-types';
import useInitSession from './hooks/useInitSession';

function StripesHub({ stripes, config }) {
  /**
   * getCurrentTenant
   * Get the current tenant info from global config.
   *
   * @returns {object} tenant info object
   */
  const getCurrentTenant = () => {
    const tenants = Object.values(config.tenantOptions);

    // Selecting first for now until selection dropdown is added for multiple tenants
    return tenants[0];
  };

  /**
   * getOIDCRedirectUri
   * Construct OIDC redirect URI based on current location, tenant, and client ID.
   *
   * @param {string} tenant - the tenant name
   * @param {string} clientId - the client ID
   * @returns {string} encoded redirect URI
   */
  const getOIDCRedirectUri = (tenant, clientId) => {
    // we need to use `encodeURIComponent` to separate `redirect_uri` URL parameters from the rest of URL parameters that `redirect_uri` itself is part of
    return encodeURIComponent(`${globalThis.location.protocol}//${globalThis.location.host}/oidc-landing?tenant=${tenant}&client_id=${clientId}`);
  };

  /**
   * getLoginUrl
   * Construct login URL based on Okapi config and current tenant info.
   *
   * @returns {string} login URL
   */
  const getLoginUrl = () => {
    const loginTenant = getCurrentTenant();

    const redirectUri = getOIDCRedirectUri(loginTenant.name, loginTenant.clientId);
    return `${stripes.authnUrl}/realms/${loginTenant.name}/protocol/openid-connect/auth?client_id=${loginTenant.clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;
  };

  const { sessionData, isLoading } = useInitSession(stripes, config, getLoginUrl());

  return (
    <div data-testid="StripesHub">
      {isLoading && <h1>Initializing session...</h1>}
    </div>
  );
}

StripesHub.propTypes = {
  stripes: PropTypes.shape({
    url: PropTypes.string.isRequired,
    authnUrl: PropTypes.string.isRequired,
    discoveryUrl: PropTypes.string,
  }).isRequired,
  config: PropTypes.shape({
    tenantOptions: PropTypes.object.isRequired,
    preserveConsole: PropTypes.bool,
  }).isRequired,
};

export default StripesHub;
