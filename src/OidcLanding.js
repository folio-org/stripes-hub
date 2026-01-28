import { useIntl } from 'react-intl';

import {
  getLoginTenant,
  requestUserWithPerms,
  setTokenExpiry,
  storeLogoutTenant,
} from './loginServices';

import useExchangeCode from './components/useExchangeCode';

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
const OidcLanding = ({ stripes }) => {
  const intl = useIntl();

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
          return storeLogoutTenant(loginTenant.name);
        })
        .then(() => {
          return requestUserWithPerms(stripes, loginTenant.name);
        }).then(() => {
          // upon successful session init, redirect to root for stripes-core to proceed with normal boot.
          globalThis.location.replace('/');
        });
    }
  };

  const { tokenData, isLoading } = useExchangeCode(stripes, initSession);

  return (
    <div data-test-saml-success>
      <div>
        {isLoading && intl.formatMessage({ id: 'stripes-core.oidc.validatingAuthenticationToken' })}
        {tokenData && intl.formatMessage({ id: 'stripes-core.oidc.initializingSession' })}
      </div>
    </div>
  );
};

export default OidcLanding;
