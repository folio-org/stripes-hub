import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import { runAxeTest } from '@folio/stripes-testing';
import OidcLanding from './OidcLanding';
import * as loginServices from './loginServices';
import * as useExchangeCodeModule from './hooks/useExchangeCode';

jest.mock('./loginServices');
jest.mock('./hooks/useExchangeCode');
jest.mock('./FatalError', () => () => 'FatalError');

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
  favicon: {
    src: 'http://favicon.ico',
  },
};

const mockConfig = {
  authnUrl: 'http://authn.example.com',
  gatewayUrl: 'http://gateway.example.com',
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('OidcLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.location = {
      replace: jest.fn(),
    };
  });

  it('renders loading message when isLoading is true', () => {
    useExchangeCodeModule.default.mockReturnValue({
      error: null,
      isLoading: true,
      tokenData: null,
    });

    renderWithIntl(<OidcLanding branding={mockBranding} config={mockConfig} />);
    screen.getByText(/OidcLanding.validatingAuthenticationToken/);
  });

  it('renders initializing session message when tokenData is present', () => {
    useExchangeCodeModule.default.mockReturnValue({
      error: null,
      isLoading: false,
      tokenData: {
        accessTokenExpiration: new Date().toISOString(),
        refreshTokenExpiration: new Date().toISOString(),
      },
    });

    loginServices.getLoginTenant.mockReturnValue({
      name: 'diku',
      clientId: 'diku-app',
    });

    loginServices.setTokenExpiry.mockResolvedValue(undefined);
    loginServices.storeCurrentTenant.mockResolvedValue(undefined);
    loginServices.requestUserWithPerms.mockResolvedValue(undefined);
    loginServices.getUnauthorizedPathFromSession.mockReturnValue('/');
    loginServices.removeUnauthorizedPathFromSession.mockImplementation();

    renderWithIntl(<OidcLanding branding={mockBranding} config={mockConfig} />);

    screen.getByText(/OidcLanding.initializingSession/);
  });

  it('renders FatalError when error is present', () => {
    const mockError = {
      message: 'Authentication failed',
      options: {},
    };

    useExchangeCodeModule.default.mockReturnValue({
      error: mockError,
      isLoading: false,
      tokenData: null,
    });

    renderWithIntl(<OidcLanding branding={mockBranding} config={mockConfig} />);
    screen.getByText(/FatalError/);
  });

  it('initializes session with token data', async () => {
    const tokenData = {
      accessTokenExpiration: new Date().toISOString(),
      refreshTokenExpiration: new Date().toISOString(),
    };

    useExchangeCodeModule.default.mockImplementation((config, initSession) => {
      setTimeout(() => {
        initSession(tokenData);
      }, 0);
      return {
        error: null,
        isLoading: false,
        tokenData,
      };
    });

    loginServices.getLoginTenant.mockReturnValue({
      name: 'diku',
      clientId: 'diku-app',
    });

    loginServices.setTokenExpiry.mockResolvedValue(undefined);
    loginServices.storeCurrentTenant.mockResolvedValue(undefined);
    loginServices.requestUserWithPerms.mockResolvedValue(undefined);
    loginServices.getUnauthorizedPathFromSession.mockReturnValue('/dashboard');
    loginServices.removeUnauthorizedPathFromSession.mockImplementation();

    renderWithIntl(<OidcLanding branding={mockBranding} config={mockConfig} />);

    await waitFor(() => {
      expect(loginServices.setTokenExpiry).toHaveBeenCalled();
      expect(loginServices.storeCurrentTenant).toHaveBeenCalledWith('diku', 'diku-app');
      expect(loginServices.requestUserWithPerms).toHaveBeenCalled();
    });
  });

  it('should render with no axe errors', async () => {
    renderWithIntl(
      <OidcLanding branding={mockBranding} config={mockConfig} />
    );
    await runAxeTest({
      rootNode: document.body,
    });
  });
});
