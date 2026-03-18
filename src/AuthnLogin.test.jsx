import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import AuthnLogin from './AuthnLogin';
import * as loginServices from './loginServices';

jest.mock('./loginServices');
jest.mock('./PreLoginLanding', () => {
  return function MockPreLoginLanding() {
    return <div>PreLoginLanding Component</div>;
  };
});

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
  favicon: {
    src: 'http://favicon.ico',
  },
};

describe('AuthnLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.location = {
      replace: jest.fn(),
    };
  });

  it('multiple tenants: render the select-tenant screen', () => {
    const config = {
      authnUrl: 'http://authn.example.com',
      tenantOptions: {
        diku: { name: 'diku', clientId: 'diku-app', displayName: 'Diku' },
        supertenant: { name: 'supertenant', clientId: 'super-app', displayName: 'Supertenant' },
      },
    };

    loginServices.storeCurrentTenant.mockImplementation();
    loginServices.getLoginUrl.mockReturnValue('http://login.example.com');

    const { container } = render(
      <AuthnLogin config={config} branding={mockBranding} />
    );

    expect(container).toBeInTheDocument();
    screen.getByText(/PreLoginLanding/);
  });

  it('one tenant: redirect to login', () => {
    const config = {
      authnUrl: 'http://authn.example.com',
      tenantOptions: {
        diku: { name: 'diku', clientId: 'diku-app' },
      },
    };

    loginServices.storeCurrentTenant.mockImplementation();
    loginServices.getLoginUrl.mockReturnValue('http://login.example.com/diku');

    render(<AuthnLogin config={config} branding={mockBranding} />);

    expect(loginServices.storeCurrentTenant).toHaveBeenCalledWith('diku', 'diku-app');
    expect(globalThis.location.replace).toHaveBeenCalledWith('http://login.example.com/diku');
  });
});
