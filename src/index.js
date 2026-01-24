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
import OIDCLanding from './oidcLanding';

const root = ReactDOM.createRoot(document.getElementById('root'));
// eslint-disable-next-line no-undef
const stripes = STRIPES_GLOBAL || {};
// eslint-disable-next-line no-undef
const config = CONFIG_GLOBAL || {};
const StripesHubComponent = () => <StripesHub stripes={stripes} config={config} />;
const OIDCLandingComponent = () => <OIDCLanding stripes={stripes} config={config} />;

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
            component={StripesHubComponent}
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
