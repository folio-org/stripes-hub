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
 * @param {*} pathName the current path name.
 * @returns the landing page component to render.
 */
const Router = (config, branding, pathName) => {
  const AuthnLoginComponent = () => <AuthnLogin config={config} branding={branding} />;
  const OidcLandingComponent = () => <OidcLanding config={config} branding={branding} />;
  const StripesHubComponent = () => <StripesHub config={config} branding={branding} />;
  const ForgotPasswordComponent = () => <ForgotPassword config={config} branding={branding} />
  const ForgotUsernameComponent = () => <ForgotUsername config={config} branding={branding} />

  let LandingComponent;

  switch (pathName) {
    case urlPaths.AUTHN_LOGIN:
      LandingComponent = AuthnLoginComponent;
      break;
    case urlPaths.FORGOT_PASSWORD:
      LandingComponent = ForgotPasswordComponent;
      break;
    case urlPaths.FORGOT_USERNAME:
      LandingComponent = ForgotUsernameComponent;
      break;
    case urlPaths.OIDC_LANDING:
      LandingComponent = OidcLandingComponent;
      break;
    default:
      LandingComponent = StripesHubComponent;
      break;
  }

  return LandingComponent;
};

export default Router;
