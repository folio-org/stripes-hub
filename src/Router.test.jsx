import Router from './Router';
import AuthnLogin from './AuthnLogin';
import StripesHub from './StripesHub';
import OidcLanding from './OidcLanding';
import ForgotPassword from './ForgotPassword';
import ForgotUsername from './ForgotUsername';
import { urlPaths } from './constants';

jest.mock('./AuthnLogin');
jest.mock('./StripesHub');
jest.mock('./OidcLanding');
jest.mock('./ForgotPassword');
jest.mock('./ForgotUsername');

describe('Router', () => {
  const mockConfig = { test: 'config' };
  const mockBranding = { test: 'branding' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AuthnLogin component for AUTHN_LOGIN path', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: `/${urlPaths.AUTHN_LOGIN}` } });
    expect(component).toBeDefined();
    expect(component.type).toBe(AuthnLogin);
  });

  it('should render ForgotPassword component for FORGOT_PASSWORD path', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: `/${urlPaths.FORGOT_PASSWORD}` } });
    expect(component).toBeDefined();
    expect(component.type).toBe(ForgotPassword);
  });

  it('should render ForgotUsername component for FORGOT_USERNAME path', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: `/${urlPaths.FORGOT_USERNAME}` } });
    expect(component).toBeDefined();
    expect(component.type).toBe(ForgotUsername);
  });

  it('should render OidcLanding component for OIDC_LANDING path', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: `/${urlPaths.OIDC_LANDING}` } });
    expect(component).toBeDefined();
    expect(component.type).toBe(OidcLanding);
  });

  it('should render StripesHub component for default/unknown path', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: '/unknown-path' } });
    expect(component).toBeDefined();
    expect(component.type).toBe(StripesHub);
  });

  it('should pass config and branding to rendered component', () => {
    const component = Router({ config: mockConfig, branding: mockBranding, location: { pathname: `/${urlPaths.AUTHN_LOGIN}` } });
    expect(component.props.config).toEqual(mockConfig);
    expect(component.props.branding).toEqual(mockBranding);
  });
});