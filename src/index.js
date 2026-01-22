import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Switch,
  Route
} from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { CookiesProvider } from 'react-cookie';

import StripesHub from './StripesHub';
import OIDCLanding from './OIDCLanding';

const root = ReactDOM.createRoot(document.getElementById('root'));
// eslint-disable-next-line no-undef
const stripes = STRIPES_GLOBAL || {};
// eslint-disable-next-line no-undef
const config = CONFIG_GLOBAL || {};
const AppComponent = () => <StripesHub stripes={stripes} config={config} />;
const OIDCLandingComponent = () => <CookiesProvider><OIDCLanding stripes={stripes} config={config} /></CookiesProvider>;

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <IntlProvider>
        <Switch>
          <Route
            name="home"
            path="/"
            key="root"
            exact
            component={AppComponent}
          />
          <Route
            name="oidcLanding"
            exact
            path="/oidc-landing"
            component={OIDCLandingComponent}
            key="oidc-landing"
          />
        </Switch>
      </IntlProvider>
    </BrowserRouter>
  </React.StrictMode>
);
