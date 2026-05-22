import {
  useState,
  useEffect,
} from 'react';

import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import { loadTranslations } from './loadTranslations';
import { isValidConfig } from './loginServices';
import createReactQueryClient from './createReactQueryClient';
import Router from './Router';
import ConfigError from './ConfigError';
import configuration from '../config.yaml';

const App = () => {
  const config = configuration.config || {};
  const branding = configuration.branding || {};
  const location = globalThis.location;
  const locale = config.locale || navigator.language || 'en-US';
  
  const reactQueryClient = createReactQueryClient();
  const Component = isValidConfig(config) ?
    <Router branding={branding} config={config} location={location} />
    :
    <ConfigError branding={branding} config={config} />

  const [translations, setTranslations] = useState({});

  useEffect(() => {
    loadTranslations(locale).then((msgs) => setTranslations(msgs));
  }, [locale]);

  return (
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider locale={locale} messages={translations} >
        {Component}
      </IntlProvider>
    </QueryClientProvider>
  );
};

export default App;
