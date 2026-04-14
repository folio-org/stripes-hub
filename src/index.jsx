import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import { loadTranslations } from './loadTranslations';
import { isValidConfig } from './loginServices';
import createReactQueryClient from './createReactQueryClient';
import Router from './Router';
import ConfigError from './ConfigError';
import configuration from '../config.yaml';

const config = configuration.config || {};
const branding = configuration.branding || {};
const path = globalThis.location.pathname;
const locale = config.locale || navigator.language || 'en-US';

// Initialize the app asynchronously to allow translations to load
const initApp = async () => {
  const translations = await loadTranslations(locale);
  const reactQueryClient = createReactQueryClient();

  const root = ReactDOM.createRoot(document.getElementById('root'));
  const Component = isValidConfig(config) ?
    <Router branding={branding} config={config} path={path} />
    :
    <ConfigError branding={branding} config={config} />

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale={locale} messages={translations} >
          {Component}
        </IntlProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

initApp();
