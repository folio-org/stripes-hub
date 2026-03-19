import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import {
  getLoginTenant,
  getUnauthorizedPathFromSession,
  removeUnauthorizedPathFromSession,
  requestUserWithPerms,
  setTokenExpiry,
  storeCurrentTenant,
} from './loginServices';

import useExchangeCode from './hooks/useExchangeCode';
import FatalError from './FatalError';
import StripesTemplate from './StripesTemplate';

/**
 * OidcLanding: un-authenticated route handler for /oidc-landing.
 *
 * * Read one-time-code from URL params
 * * make an API call to /authn/token to exchange the OTP for cookies
 * * call requestUserWithPerms to make an API call to .../_self,
 *   eventually dispatching session and Okapi-ready, resulting in a
 *   re-render of RoothWithIntl with prop isAuthenticated: true
 *
 * @see RootWithIntl
 */
const OidcLanding = ({ branding, config }) => {
  const atDefaultExpiration = Date.now() + (60 * 1000);
  const rtDefaultExpiration = Date.now() + (2 * 60 * 1000);

  /**
   * initSession
   * Callback for useExchangeCode to execute after exchanging the OTP
   * for token-expiration data and cookies
   * @param {object} tokenData shaped like { accessTokenExpiration, refreshTokenExpiration}
   */
  const initSession = (tokenData) => {
    const loginTenant = getLoginTenant();

    if (tokenData) {
      setTokenExpiry({
        atExpires: tokenData.accessTokenExpiration ? new Date(tokenData.accessTokenExpiration).getTime() : atDefaultExpiration,
        rtExpires: tokenData.refreshTokenExpiration ? new Date(tokenData.refreshTokenExpiration).getTime() : rtDefaultExpiration,
      })
        .then(() => {
          return storeCurrentTenant(loginTenant.name, loginTenant.clientId);
        })
        .then(() => {
          return requestUserWithPerms(config, loginTenant.name);
        }).then(() => {
          // upon successful session init, redirect to root for stripes-core to proceed with normal boot.
          const redirectPath = getUnauthorizedPathFromSession() || '/';
          removeUnauthorizedPathFromSession();

          globalThis.location.replace(redirectPath);
        });
    }
  };

  const { error, isLoading, tokenData } = useExchangeCode(config, initSession);

  if (error) {
    return <FatalError branding={branding} config={config} error={error} />;
  }

  return (
    <StripesTemplate branding={branding}>
      <div data-test-saml-success>
        <div>
          {isLoading && <h1><FormattedMessage id="stripes-hub.OidcLanding.validatingAuthenticationToken" /></h1>}
          {tokenData && <h1><FormattedMessage id="stripes-hub.OidcLanding.initializingSession" /></h1>}
        </div>
      </div>
    </StripesTemplate>
  );
};

OidcLanding.propTypes = {
  branding: PropTypes.shape({
    favicon: PropTypes.shape({
      src: PropTypes.string,
    }),
    logo: PropTypes.shape({
      alt: PropTypes.string,
      src: PropTypes.string,
    }),
  }),
  config: PropTypes.shape({
    authnUrl: PropTypes.string.isRequired,
    discoveryUrl: PropTypes.string,
    gatewayUrl: PropTypes.string.isRequired,
  }).isRequired
};

export default OidcLanding;
