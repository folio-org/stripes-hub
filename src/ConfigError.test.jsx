import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event'
import { IntlProvider } from 'react-intl';
import { runAxeTest } from '@folio/stripes-testing';

import ConfigError from './ConfigError';

const branding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Some alt'
  }
};

const config = {
  gatewayUrl: 'http://gateway.example.com',
};

const error = {
  message: 'Test error message',
  options: {
    id: 'stripes-hub.FatalError.some-fatal-error',
    url: 'http://example.com',
  },
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('ConfigError', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
    globalThis.location = {
      assign: jest.fn(),
      reload: jest.fn(),
      origin: 'http://localhost',
    };
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  it('renders headline ', () => {
    renderWithIntl(
      <ConfigError branding={branding} config={config} />
    );

    screen.getByText('stripes-hub.ConfigError.headline')
  });

  it('logs error to console', () => {
    renderWithIntl(
      <ConfigError branding={branding} config={config} />
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('should render with no axe errors', async () => {
    renderWithIntl(
      <ConfigError branding={branding} config={config} />
    );
    await runAxeTest({
      rootNode: document.body,
    });
  });
});
