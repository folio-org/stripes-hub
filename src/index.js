import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import createReactQueryClient from './createReactQueryClient';
import AuthnLogin from './AuthnLogin';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import ForgotPassword from './ForgotPassword';
import ForgotUsername from './ForgotUsername';
import { urlPaths } from './constants';
import rawTranslations from './translations/stripes-hub/en_US.json';

const root = ReactDOM.createRoot(document.getElementById('root'));
const config = FOLIO_CONFIG || {}; // eslint-disable-line no-undef
const branding = BRANDING_GLOBAL || {}; // eslint-disable-line no-undef
const AuthnLoginComponent = () => <AuthnLogin config={config} branding={branding} />;
const OidcLandingComponent = () => <OidcLanding config={config} branding={branding} />;
const StripesHubComponent = () => <StripesHub config={config} branding={branding} />;
const ForgotPasswordComponent = () => <ForgotPassword config={config} branding={branding} />
const ForgotUsernameComponent = () => <ForgotUsername config={config} branding={branding} />

const reactQueryClient = createReactQueryClient();
const pathName = globalThis.location.pathname;
let LandingComponent;
const translations = Object.keys(rawTranslations).reduce((acc, key) => {
  acc[`stripes-hub.${key}`] = rawTranslations[key];
  return acc;
}, {});

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

root.render(
  <React.StrictMode>
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider locale={config.locale || navigator.language || 'en-US'} messages={translations} >
        <LandingComponent />
      </IntlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
