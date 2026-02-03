import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import createReactQueryClient from './createReactQueryClient';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';

/** key for storing tenant info in local storage */
const TENANT_LOCAL_STORAGE_KEY = 'tenant';

const root = ReactDOM.createRoot(document.getElementById('root'));
// eslint-disable-next-line no-undef
const config = FOLIO_CONFIG || {};
const StripesHubComponent = () => <StripesHub config={config} />;
const OidcLandingComponent = () => <OidcLanding config={config} />;

const reactQueryClient = createReactQueryClient();

let LandingComponent = StripesHubComponent;

if (globalThis.location.pathname === '/') {
  LandingComponent = StripesHubComponent;
} else if (globalThis.location.pathname === '/oidc-landing') {
  LandingComponent = OidcLandingComponent;
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
