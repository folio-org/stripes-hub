import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';

import createReactQueryClient from './createReactQueryClient';
import StripesHub from './StripesHub';
import * as useInitSession from './hooks/useInitSession';

jest.mock('./hooks/useInitSession');

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

const branding = {
  logo: {
    src: 'http://logo',
    alt: 'logo-alt-text',
  },
  favicon: {
    src: 'http://favicon',
  },
};

const reactQueryClient = createReactQueryClient();

describe('StripesHub', () => {
  it('shows loading entitlement message', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: false,
      discoveryError: null,
      isLoadingEntitlement: true,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/StripesHub.loadingEntitlement/);
    });
  });

  it('shows entitlement error', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: null,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: { options: { json: { message: 'whoops' } } },
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/whoops/);
    });
  });

  it('shows loading discovery message', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: true,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/StripesHub.loadingDiscovery/);
    });
  });

  it('shows discovery error', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: null,
      discoveryError: { options: { json: { message: 'whoops' } } },
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/whoops/);
    });
  });

  it('shows loading session message', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: null,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: true,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/StripesHub.loadingSession/);
    });
  });

  it('shows session error', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: null,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: null,
      isLoadingSession: null,
      sessionError: { options: { json: { message: 'whoops' } } },
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/whoops/);
    });
  });

  it('shows loading stripes message', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: true,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: true,
      stripesError: null,
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/StripesHub.loadingStripes/);
    });
  });

  it('shows stripes error', async () => {
    useInitSession.default.mockReturnValue({
      isLoadingDiscovery: null,
      discoveryError: null,
      isLoadingEntitlement: null,
      entitlementError: null,
      isLoadingStripes: null,
      stripesError: { options: { json: { message: 'whoops' } } },
      isLoadingSession: null,
      sessionError: null,
    });

    render(
      <QueryClientProvider client={reactQueryClient}>
        <IntlProvider locale="en">
          <StripesHub branding={branding} config={config} />
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      screen.getByText(/whoops/);
    });
  });

});
