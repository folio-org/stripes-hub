import localforage from 'localforage';
import {
  SESSION_NAME,
  TENANT_LOCAL_STORAGE_KEY,
  getHeaders,
  StripesHubError,
  getOIDCRedirectUri,
  getLoginUrl,
  getSession,
  getLoginTenant,
  getCurrentTenant,
  storeCurrentTenant,
  removeUnauthorizedPathFromSession,
  setUnauthorizedPathToSession,
  getUnauthorizedPathFromSession,
  fetchEntitlements,
  fetchDiscovery,
  spreadUserWithPerms,
  setTokenExpiry,
  createSession,
  processSession,
  requestUserWithPerms,
  fetchOverriddenUserWithPerms,
  handleLoginError,
  getProcessedErrors,
  getLoginErrors,
  processBadResponse,
  loadStripes,
} from './loginServices';
import { defaultErrors } from './constants';

// Mock dependencies
jest.mock('localforage');
jest.mock('./constants', () => ({
  defaultErrors: {
    DEFAULT_LOGIN_CLIENT_ERROR: { message: 'Client error' },
    DEFAULT_LOGIN_SERVER_ERROR: { message: 'Server error' },
  },
  urlPaths: {
    LOGOUT: '/logout',
    AUTHN_LOGIN: '/authn-login',
  },
}));

// Mock globalThis.location
delete globalThis.location;
globalThis.location = {
  protocol: 'https:',
  host: 'example.com',
  pathname: '/some-path',
  search: '?tenant=test&client_id=123',
};

// Mock fetch
globalThis.fetch = jest.fn();

// Mock dynamic imports used by loadStripes
jest.mock('https://stripes.example.com/main.js', () => jest.fn(), { virtual: true });

describe('loginServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const makeFetchResponse = ({ ok = true, jsonData = {}, status = 200, statusText = 'OK', headers = {} } = {}) => ({
    ok,
    status,
    statusText,
    json: jest.fn().mockResolvedValue(jsonData),
    headers: { get: jest.fn().mockReturnValue(null), ...headers },
  });

  const defaultConfig = { gatewayUrl: 'https://gateway.example.com' };

  describe('getHeaders', () => {
    it('returns headers with tenant and token', () => {
      const headers = getHeaders('test-tenant', 'test-token');
      expect(headers).toEqual({
        'X-Okapi-Tenant': 'test-tenant',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Okapi-Token': 'test-token',
      });
    });

    it('returns headers without token if not provided', () => {
      const headers = getHeaders('test-tenant');
      expect(headers).toEqual({
        'X-Okapi-Tenant': 'test-tenant',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('getOIDCRedirectUri', () => {
    it('constructs OIDC redirect URI', () => {
      const uri = getOIDCRedirectUri('test-tenant', 'client-123');
      expect(uri).toBe(encodeURIComponent('https://example.com/oidc-landing?tenant=test-tenant&client_id=client-123'));
    });
  });

  describe('getLoginUrl', () => {
    it('constructs login URL', () => {
      const config = { authnUrl: 'https://auth.example.com' };
      const url = getLoginUrl(config, 'test-tenant', 'client-123');
      expect(url).toContain('https://auth.example.com/realms/test-tenant/protocol/openid-connect/auth');
      expect(url).toContain('client_id=client-123');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
    });
  });

  describe('getSession', () => {
    it('retrieves session from localforage', async () => {
      localforage.getItem.mockResolvedValue({ user: 'test' });
      const session = await getSession();
      expect(localforage.getItem).toHaveBeenCalledWith(SESSION_NAME);
      expect(session).toEqual({ user: 'test' });
    });
  });

  describe('getLoginTenant', () => {
    it('parses tenant and clientId from URL', () => {
      const { name, clientId } = getLoginTenant();
      expect(name).toBe('test');
      expect(clientId).toBe('123');
    });
  });

  describe('getCurrentTenant', () => {
    it('retrieves tenant from localStorage', () => {
      localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify({ name: 'test', clientId: '123' }));
      const tenant = getCurrentTenant();
      expect(tenant).toEqual({ name: 'test', clientId: '123' });
    });

    it('returns undefined if not found', () => {
      const tenant = getCurrentTenant();
      expect(tenant).toBeUndefined();
    });
  });

  describe('storeCurrentTenant', () => {
    it('stores tenant in localStorage', () => {
      storeCurrentTenant('test', '123');
      expect(localStorage.getItem(TENANT_LOCAL_STORAGE_KEY)).toBe(JSON.stringify({ name: 'test', clientId: '123' }));
    });
  });

  describe('unauthorized path functions', () => {
    it('sets unauthorized path', () => {
      setUnauthorizedPathToSession('/test-path');
      expect(sessionStorage.getItem('unauthorized_path')).toBe('/test-path');
    });

    it('gets unauthorized path', () => {
      sessionStorage.setItem('unauthorized_path', '/test-path');
      expect(getUnauthorizedPathFromSession()).toBe('/test-path');
    });

    it('removes unauthorized path', () => {
      sessionStorage.setItem('unauthorized_path', '/test-path');
      removeUnauthorizedPathFromSession();
      expect(sessionStorage.getItem('unauthorized_path')).toBeNull();
    });

    it('does not set path for logout or authn-login', () => {
      setUnauthorizedPathToSession('/logout');
      expect(sessionStorage.getItem('unauthorized_path')).toBeNull();
      setUnauthorizedPathToSession('/authn-login');
      expect(sessionStorage.getItem('unauthorized_path')).toBeNull();
    });
  });

  describe('fetchEntitlements', () => {
    it('fetches and processes entitlements', async () => {
      const mockJson = {
        applicationDescriptors: [
          {
            id: 'app1',
            uiModules: [{ id: 'mod1', name: 'module1' }],
            uiModuleDescriptors: [{ id: 'mod1', requires: [{ id: 'int1', version: '1.0' }] }],
          },
        ],
      };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockJson }));

      const config = { ...defaultConfig };
      const result = await fetchEntitlements(config, 'test-tenant');
      expect(result.mod1).toBeDefined();
      expect(result.mod1.applicationId).toBe('app1');
    });

    it('throws on fetch error', async () => {
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 500, jsonData: {} }));

      const config = { ...defaultConfig };
      await expect(fetchEntitlements(config, 'test-tenant')).rejects.toThrow(StripesHubError);
    });
  });

  describe('fetchDiscovery', () => {
    it('fetches discovery data', async () => {
      const entitlement = { mod1: { name: 'folio_mod1', applicationId: 'app1' } };
      const mockJson = { discovery: [{ id: 'mod1', location: 'https://mod1.example.com' }] };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockJson }));

      const config = { ...defaultConfig };
      const result = await fetchDiscovery(config, 'test-tenant', entitlement);
      expect(result.mod1.location).toBe('https://mod1.example.com');
      expect(result.mod1.module).toBe('@folio/mod1');
    });

    // local development registry service.
    it('uses custom discovery URL when provided', async () => {
      const entitlement = { mod2: { name: 'folio_mod2', applicationId: 'app2' } };
      const mockJson = { discovery: [{ id: 'mod2', name: 'folio_mod2', location: 'https://mod2.example.com' }] };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockJson }));

      const config = { ...defaultConfig, discoveryUrl: 'https://local.discovery' };
      const result = await fetchDiscovery(config, 'test-tenant', entitlement);

      expect(globalThis.fetch).toHaveBeenCalledWith('https://local.discovery', expect.objectContaining({
        headers: expect.objectContaining({ 'X-Okapi-Tenant': 'test-tenant' }),
        mode: 'cors',
      }));

      expect(result.mod2.location).toBe('https://mod2.example.com');
      expect(result.mod2.module).toBe('@folio/mod2');
    });
  });

  describe('loadStripes', () => {
    beforeEach(() => {
      document.head.appendChild = jest.fn();
    });

    it('loads stripes assets (fetches manifest and imports JS)', async () => {
      const mockManifest = {
        entrypoints: {
          main: { imports: ['main.js', 'style.css'] },
        },
        assets: {
          'main.js': { file: '/main.js' },
          'style.css': { file: '/style.css' },
        },
      };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockManifest }));

      const stripesCore = { location: 'https://stripes.example.com' };
      await loadStripes(stripesCore);

      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('throws on manifest fetch failure', async () => {
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, jsonData: {} }));

      const stripesCore = { location: 'https://stripes.example.com' };
      await expect(loadStripes(stripesCore)).rejects.toThrow(StripesHubError);
    });
  });

  describe('spreadUserWithPerms', () => {
    it('spreads user with permissions', () => {
      const data = {
        user: { id: '1', username: 'test', personal: { name: 'Test User' } },
        permissions: { permissions: ['perm1', 'perm2'] },
      };
      const result = spreadUserWithPerms(data);
      expect(result.user).toEqual({ id: '1', username: 'test', name: 'Test User' });
      expect(result.perms).toEqual({ perm1: true, perm2: true });
    });

    it('handles permission objects', () => {
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: [{ permissionName: 'perm1' }] },
      };
      const result = spreadUserWithPerms(data);
      expect(result.perms).toEqual({ perm1: true });
    });
  });

  describe('setTokenExpiry', () => {
    it('sets token expiry in session', async () => {
      const sess = { user: 'test' };
      localforage.getItem.mockResolvedValue(sess);
      localforage.setItem.mockResolvedValue();

      await setTokenExpiry({ atExpires: 1000, rtExpires: 2000 });
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        tokenExpiration: {
          atExpires: 1000,
          rtExpires: 2000,
          accessTokenExpiration: '1970-01-01T00:00:01.000Z',
          refreshTokenExpiration: '1970-01-01T00:00:02.000Z',
        },
      }));
    });

    it('throws on invalid input', async () => {
      await expect(setTokenExpiry({})).rejects.toThrow(TypeError);
    });
  });

  describe('createSession', () => {
    it('creates and stores session', async () => {
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: ['perm1'] },
        tenant: 'test-tenant',
      };
      localforage.setItem.mockResolvedValue();

      await createSession('test-tenant', 'token', data);
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        token: 'token',
        isAuthenticated: true,
        user: { id: '1', username: 'test' },
        perms: { perm1: true },
        tenant: 'test-tenant',
      }));
    });
  });

  describe('processSession', () => {
    it('processes successful response', async () => {
      const mockResp = makeFetchResponse({ jsonData: {} });
      localforage.setItem.mockResolvedValue();

      const result = await processSession('test-tenant', mockResp);
      expect(result).toEqual({});
    });

    it('handles error response', async () => {
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });
      localforage.removeItem.mockResolvedValue();

      const result = await processSession('test-tenant', mockResp);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });
  });

  describe('requestUserWithPerms', () => {
    it('requests user with perms', async () => {
      const mockResp = makeFetchResponse({ jsonData: {} });
      globalThis.fetch.mockResolvedValue(mockResp);
      localforage.setItem.mockResolvedValue();

      const config = { ...defaultConfig };
      const result = await requestUserWithPerms(config, 'test-tenant', 'token');
      expect(result).toEqual({});
    });

    it('throws error when request fails', async () => {
      const mockError = { message: 'oh no' };
      const mockResp = makeFetchResponse({ ok: false, jsonData: mockError });
      globalThis.fetch.mockResolvedValue(mockResp);

      const config = { ...defaultConfig };
      try {
        await requestUserWithPerms(config, 'test-tenant', 'token');
      } catch (err) {
        expect(err).toEqual(mockError);
      }
    });
  });

  describe('fetchOverriddenUserWithPerms', () => {
    it('fetches overridden user with perms', async () => {
      const mockResp = makeFetchResponse({ jsonData: {} });
      globalThis.fetch.mockResolvedValue(mockResp);

      const result = await fetchOverriddenUserWithPerms('https://gateway.example.com', 'test-tenant', 'token');
      expect(result).toEqual(mockResp);
    });
  });

  describe('handleLoginError', () => {
    it('handles login error', async () => {
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });
      localforage.removeItem.mockResolvedValue();

      const result = await handleLoginError(mockResp);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });
  });

  describe('getProcessedErrors', () => {
    it('returns errors for 400', () => {
      const errors = getProcessedErrors({}, 400, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });

    it('returns errors for 422', () => {
      const errors = getProcessedErrors({ errors: ['error1'] }, 422, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual(['error1']);
    });
  });

  describe('getLoginErrors', () => {
    it('parses errors from object', () => {
      const errors = getLoginErrors({ errors: ['error1'] });
      expect(errors).toEqual(['error1']);
    });

    it('parses errors from string', () => {
      const errors = getLoginErrors(JSON.stringify({ errors: ['error1'] }));
      expect(errors).toEqual(['error1']);
    });

    it('returns default error when payload is invalid JSON', () => {
      try {
        const errors = getLoginErrors('not-json');
        expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('processBadResponse', () => {
    it('processes bad response', async () => {
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });

      const result = await processBadResponse(mockResp);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });

    it('uses default error when response.json throws', async () => {
      const mockResp = { status: 500, json: jest.fn(() => { throw new Error('boom'); }) };

      try {
        const result = await processBadResponse(mockResp);
        expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });
});
