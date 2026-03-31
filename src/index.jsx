import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import { loadTranslations } from './loadTranslations';
import createReactQueryClient from './createReactQueryClient';
import Router from './Router';
import configuration from '../config.yaml';

const root = ReactDOM.createRoot(document.getElementById('root'));
const config = configuration?.config || FOLIO_CONFIG || {}; // eslint-disable-line no-undef
const branding = configuration?.branding || BRANDING_GLOBAL || {}; // eslint-disable-line no-undef

const path = globalThis.location.pathname;
const locale = config.locale || navigator.language || 'en-US';
const translations = loadTranslations(locale);

const reactQueryClient = createReactQueryClient();

root.render(
  <React.StrictMode>
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider locale={locale} messages={translations} >
        <Router config={config} branding={branding} path={path} />
      </IntlProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
