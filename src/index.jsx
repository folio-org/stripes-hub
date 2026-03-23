import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import { loadTranslations } from './loadTranslations';
import createReactQueryClient from './createReactQueryClient';
import Router from './Router';

const root = ReactDOM.createRoot(document.getElementById('root'));
const config = FOLIO_CONFIG || {}; // eslint-disable-line no-undef
const branding = BRANDING_GLOBAL || {}; // eslint-disable-line no-undef

const pathName = globalThis.location.pathname;
const locale = config.locale || navigator.language || 'en-US';
const translations = loadTranslations(locale);

const reactQueryClient = createReactQueryClient();
const LandingComponent = Router(config, branding, pathName);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider locale={locale} messages={translations} >
        <LandingComponent />
      </IntlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
