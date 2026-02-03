import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import createReactQueryClient from './createReactQueryClient';
import StripesHub from './StripesHub';

test('renders', () => {
  const config = {
    gatewayUrl: 'http://url',
    authnUrl: 'http://authn',
    tenantOptions: {
      diku: {
        name: 'diku', clientId: 'diku-application'
      }
    },
    preserveConsole: true
  };

  const reactQueryClient = createReactQueryClient();

  render(
    <QueryClientProvider client={reactQueryClient}>
      <IntlProvider locale="en">
        <StripesHub config={config} />
      </IntlProvider>
    </QueryClientProvider>
  );

  const parentDiv = screen.getByTestId("StripesHub");
  expect(parentDiv).toBeInTheDocument();
});
