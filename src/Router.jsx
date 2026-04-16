import PropTypes from 'prop-types';

import AuthnLogin from './AuthnLogin';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import ForgotPassword from './ForgotPassword';
import ForgotUsername from './ForgotUsername';
import ResetPasswordControl from './components/ResetPassword/ResetPasswordControl';
import { urlPaths } from './constants';

/**
 * Router component to determine which landing page to render based on the current path.
 *
 * @param {*} config the configuration object.
 * @param {*} branding the branding configuration object.
 * @param {*} location the location object from globalThis.
 * @returns the landing page component to render.
 */
const Router = ({ config, branding, location }) => {
  const props = { config, branding, location };

  // split path into parts and remove leading empty string
  const urlParts = location.pathname.split('/').slice(1); 
  const route = urlParts?.length > 0 ? urlParts[0] : '';

  switch (route) {
    case urlPaths.AUTHN_LOGIN:
      return <AuthnLogin {...props} />;
    case urlPaths.FORGOT_PASSWORD:
      return <ForgotPassword {...props} />;
    case urlPaths.FORGOT_USERNAME:
      return <ForgotUsername {...props} />;
    case urlPaths.RESET_PASSWORD:
      return <ResetPasswordControl {...props} />;
    case urlPaths.OIDC_LANDING:
      return <OidcLanding {...props} />;
    default:
      return <StripesHub {...props} />;
  }
};

Router.propTypes = {
  config: PropTypes.shape({
    authnUrl: PropTypes.string,
    tenantOptions: PropTypes.object,
  }).isRequired,
  branding: PropTypes.shape({
    logo: PropTypes.shape({
      src: PropTypes.string,
      alt: PropTypes.string,
    }),
    favicon: PropTypes.shape({
      src: PropTypes.string,
    }),
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
  }).isRequired,
};

export default Router;
