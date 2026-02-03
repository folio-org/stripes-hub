import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import { CookiesProvider } from 'react-cookie';

import createReactQueryClient from './createReactQueryClient';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import ForgotPassword from './ForgotPassword';
import ForgotUsername from './ForgotUsername';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

const root = ReactDOM.createRoot(document.getElementById('root'));

const stripes = STRIPES_GLOBAL || {}; // eslint-disable-line no-undef
const config = CONFIG_GLOBAL || {}; // eslint-disable-line no-undef
const branding = BRANDING_GLOBAL || {}; // eslint-disable-line no-undef

const StripesHubComponent = () => <StripesHub stripes={stripes} config={config} branding={branding} />;
const OidcLandingComponent = () => <CookiesProvider><OidcLanding stripes={stripes} config={config} /></CookiesProvider>;
const ForgotPasswordComponent = () => <ForgotPassword stripes={stripes} config={config} branding={branding} />
const ForgotUsernameComponent = () => <ForgotUsername stripes={stripes} config={config} branding={branding} />

const reactQueryClient = createReactQueryClient();

const routes = [
  { pathname: '/forgot-password', component: ForgotPasswordComponent },
  { pathname: '/forgot-username', component: ForgotUsernameComponent },
  { pathname: '/oidc-landing', component: OidcLandingComponent },
  { pathname: '/', component: StripesHubComponent },
];

let LandingComponent = routes.find(i => i.pathname === globalThis.location.pathname)?.component;
if (!LandingComponent) {
  LandingComponent = StripesHubComponent;
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
