import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import createReactQueryClient from './createReactQueryClient';
import AuthnLogin from './AuthnLogin';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import { urlPaths } from './constants';

const root = ReactDOM.createRoot(document.getElementById('root'));
const config = FOLIO_CONFIG || {}; // eslint-disable-line no-undef
const branding = BRANDING_GLOBAL || {}; // eslint-disable-line no-undef
const AuthnLoginComponent = () => <AuthnLogin config={config} branding={branding} />;
const OidcLandingComponent = () => <OidcLanding config={config} />;
const StripesHubComponent = () => <StripesHub config={config} branding={branding} />;

const reactQueryClient = createReactQueryClient();
const pathName = globalThis.location.pathname;
let LandingComponent = StripesHubComponent;

switch (pathName) {
  case urlPaths.AUTHN_LOGIN:
    LandingComponent = AuthnLoginComponent;
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
      <IntlProvider locale={navigator.language || 'en-US'}>
        <LandingComponent />
      </IntlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
