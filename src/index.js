import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import { CookiesProvider } from 'react-cookie';

import createReactQueryClient from './createReactQueryClient';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

const root = ReactDOM.createRoot(document.getElementById('root'));
// eslint-disable-next-line no-undef
const stripes = STRIPES_GLOBAL || {};
// eslint-disable-next-line no-undef
const config = CONFIG_GLOBAL || {};
const StripesHubComponent = () => <StripesHub stripes={stripes} config={config} />;
const OidcLandingComponent = () => <CookiesProvider><OidcLanding stripes={stripes} config={config} /></CookiesProvider>;

const reactQueryClient = createReactQueryClient();

let LandingComponent = StripesHubComponent;

if (window.location.pathname === '/') {
  LandingComponent = StripesHubComponent;
} else if (window.location.pathname === '/oidc-landing') {
  LandingComponent = OidcLandingComponent;
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider>
        <LandingComponent />
      </IntlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
