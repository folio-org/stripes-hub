import PropTypes from 'prop-types';

import AuthnLogin from './AuthnLogin';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import ForgotPassword from './ForgotPassword';
import ForgotUsername from './ForgotUsername';
import { urlPaths } from './constants';

/**
 * Router component to determine which landing page to render based on the current path.
 * 
 * @param {*} config the configuration object.
 * @param {*} branding the branding configuration object.
 * @param {*} path the current path name.
 * @returns the landing page component to render.
 */
const Router = ({config, branding, path}) => {
  const props = { config, branding };

  switch (path) {
    case urlPaths.AUTHN_LOGIN:
      return <AuthnLogin {...props} />;
    case urlPaths.FORGOT_PASSWORD:
      return <ForgotPassword {...props} />;
    case urlPaths.FORGOT_USERNAME:
      return <ForgotUsername {...props} />;
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
  pathName: PropTypes.string.isRequired,
};

export default Router;
