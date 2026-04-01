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
  hideEmail,
  isValidConfig
} from './loginServices';
import { defaultErrors } from './constants';

jest.mock('localforage');

// Mock globalThis.location
delete globalThis.location;
globalThis.location = {
  protocol: 'https:',
  host: 'example.com',
  pathname: '/some-path',
  search: '?tenant=test&client_id=123',
};

globalThis.fetch = jest.fn();

// Mock dynamic imports used by loadStripes
jest.mock('https://stripes.example.com/main.js', () => jest.fn(), { virtual: true });

/** Factory for consistent mock fetch responses. */
const makeFetchResponse = ({ ok = true, jsonData = {}, status = 200, statusText = 'OK', headers = {} } = {}) => ({
  ok,
  status,
  statusText,
  json: jest.fn().mockResolvedValue(jsonData),
  headers: { get: jest.fn().mockReturnValue(null), ...headers },
});

describe('loginServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  const defaultConfig = { gatewayUrl: 'https://gateway.example.com' };

  describe('getHeaders', () => {
    it('returns headers with tenant and token', () => {
      const tenant = 'test-tenant';
      const token = 'test-token';
      const headers = getHeaders(tenant, token);
      expect(headers['X-Okapi-Tenant']).toBe(tenant);
      expect(headers['X-Okapi-Token']).toBe(token);
      expect(headers['Accept']).toBe('application/json');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('returns headers without token if not provided', () => {
      const headers = getHeaders('test-tenant');
      expect(headers).not.toHaveProperty('X-Okapi-Token');
    });
  });

  describe('getOIDCRedirectUri', () => {
    it('constructs OIDC redirect URI', () => {
      globalThis.location.protocol = 'https:';
      globalThis.location.host = 'example.com';

      const tenant = 'test-tenant';
      const clientId = 'client-123';
      const uri = getOIDCRedirectUri(tenant, clientId);
      expect(uri).toBe(encodeURIComponent(`https://example.com/oidc-landing?tenant=${tenant}&client_id=${clientId}`));
    });
  });

  describe('getLoginUrl', () => {
    it('constructs login URL', () => {
      const config = { authnUrl: 'https://auth.example.com' };
      const tenant = 'test-tenant';
      const clientId = 'client-123';
      const url = getLoginUrl(config, tenant, clientId);
      expect(url).toContain(`${config.authnUrl}/realms/${tenant}/protocol/openid-connect/auth`);
      expect(url).toContain(`client_id=${clientId}`);
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=openid');
    });
  });

  describe('getSession', () => {
    it('retrieves session from localforage', async () => {
      const mockSession = { user: 'test' };
      localforage.getItem.mockResolvedValue(mockSession);
      const session = await getSession();
      expect(localforage.getItem).toHaveBeenCalledWith(SESSION_NAME);
      expect(session).toEqual(mockSession);
    });
  });

  // this fails in CI but runs fine locally. what the ...?
  describe('getLoginTenant', () => {
    beforeEach(() => {
      globalThis.location = {
        search: '',
      };
    });

    it('should retrieve tenant and clientId from URL params', () => {
      globalThis.location.search = '?tenant=diku&client_id=client-123';

      const tenant = getLoginTenant({});
      expect(tenant.name).toBe('diku');
      expect(tenant.clientId).toBe('client-123');
    });

    it('should fallback to config tenantOptions when single option exists', () => {
      globalThis.location.search = '';
      const config = {
        tenantOptions: {
          key1: { name: 'diku', clientId: 'client-456' },
        },
      };

      const tenant = getLoginTenant(config);
      expect(tenant.name).toBe(config.tenantOptions.key1.name);
      expect(tenant.clientId).toBe(config.tenantOptions.key1.clientId);
    });

    it('should prefer URL params over config tenantOptions', () => {
      globalThis.location.search = '?tenant=supertenant&client_id=url-client';
      const config = {
        tenantOptions: {
          key1: { name: 'diku', clientId: 'config-client' },
        },
      };

      const tenant = getLoginTenant(config);
      expect(tenant.name).toBe('supertenant');
      expect(tenant.clientId).toBe('url-client');
    });

    it('should return null values when no config or params', () => {
      globalThis.location.search = '';
      const tenant = getLoginTenant({});
      expect(tenant.name).toBeNull();
      expect(tenant.clientId).toBeNull();
    });

    it('should not use config tenantOptions when multiple options exist', () => {
      globalThis.location.search = '';
      const config = {
        tenantOptions: {
          key1: { name: 'diku', clientId: 'client-1' },
          key2: { name: 'other', clientId: 'client-2' },
        },
      };

      const tenant = getLoginTenant(config);
      expect(tenant.name).toBeNull();
      expect(tenant.clientId).toBeNull();
    });
  });

  describe('getCurrentTenant', () => {
    it('retrieves tenant from localStorage', () => {
      const storedTenant = { name: 'test', clientId: '123' };
      localStorage.setItem(TENANT_LOCAL_STORAGE_KEY, JSON.stringify(storedTenant));
      const tenant = getCurrentTenant();
      expect(tenant).toEqual(storedTenant);
    });

    it('returns undefined if not found', () => {
      expect(getCurrentTenant()).toBeUndefined();
    });
  });

  describe('storeCurrentTenant', () => {
    it('stores tenant in localStorage', () => {
      const name = 'test';
      const clientId = '123';
      storeCurrentTenant(name, clientId);
      expect(localStorage.getItem(TENANT_LOCAL_STORAGE_KEY)).toBe(JSON.stringify({ name, clientId }));
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

      const result = await fetchEntitlements(defaultConfig, 'test-tenant');
      expect(result.mod1).toBeDefined();
      expect(result.mod1.applicationId).toBe(mockJson.applicationDescriptors[0].id);
    });

    it('throws on fetch error', async () => {
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 500, jsonData: {} }));

      await expect(fetchEntitlements(defaultConfig, 'test-tenant')).rejects.toThrow(StripesHubError);
    });
  });

  describe('fetchDiscovery', () => {
    it('fetches discovery data via default handler', async () => {
      const entitlement = { mod1: { name: 'folio_mod1', applicationId: 'app1' } };
      const mockJson = { discovery: [{ id: 'mod1', location: 'https://mod1.example.com' }] };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockJson }));

      const result = await fetchDiscovery(defaultConfig, 'test-tenant', entitlement);
      expect(result.mod1.location).toBe(mockJson.discovery[0].location);
      expect(result.mod1.module).toBe('@folio/mod1');
    });

    it('uses custom discovery URL when provided', async () => {
      const entitlement = { mod2: { name: 'folio_mod2', applicationId: 'app2' } };
      const mockJson = { discovery: [{ id: 'mod2', name: 'folio_mod2', location: 'https://mod2.example.com' }] };
      const tenant = 'test-tenant';
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ jsonData: mockJson }));

      const config = { ...defaultConfig, discoveryUrl: 'https://local.discovery' };
      const result = await fetchDiscovery(config, tenant, entitlement);

      expect(globalThis.fetch).toHaveBeenCalledWith(config.discoveryUrl, expect.objectContaining({
        headers: expect.objectContaining({ 'X-Okapi-Tenant': tenant }),
        mode: 'cors',
      }));

      expect(result.mod2.location).toBe(mockJson.discovery[0].location);
      expect(result.mod2.module).toBe('@folio/mod2');
    });

    it('throws when default discovery fetch fails', async () => {
      const entitlement = { mod1: { name: 'folio_mod1', applicationId: 'app1' } };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 500, jsonData: {} }));

      await expect(fetchDiscovery(defaultConfig, 'test-tenant', entitlement)).rejects.toThrow(StripesHubError);
    });

    it('throws when custom discovery fetch fails', async () => {
      const entitlement = {};
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, status: 500, jsonData: {} }));

      const config = { ...defaultConfig, discoveryUrl: 'https://local.discovery' };
      await expect(fetchDiscovery(config, 'test-tenant', entitlement)).rejects.toThrow(StripesHubError);
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
    it('spreads user with string permissions', () => {
      const data = {
        user: { id: '1', username: 'test', personal: { name: 'Test User' } },
        permissions: { permissions: ['perm1', 'perm2'] },
      };
      const result = spreadUserWithPerms(data);
      expect(result.user).toEqual({ id: data.user.id, username: data.user.username, name: data.user.personal.name });
      expect(result.perms).toEqual({ perm1: true, perm2: true });
    });

    it('handles permission objects with permissionName', () => {
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: [{ permissionName: 'perm1' }] },
      };
      const result = spreadUserWithPerms(data);
      expect(result.perms).toEqual({ [data.permissions.permissions[0].permissionName]: true });
    });

    it('returns empty perms when permissions list is empty', () => {
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: [] },
      };
      const result = spreadUserWithPerms(data);
      expect(result.perms).toEqual({});
    });
  });

  describe('setTokenExpiry', () => {
    it('sets token expiry in session', async () => {
      const sess = { user: 'test' };
      const tokenData = { atExpires: 1000, rtExpires: 2000 };
      localforage.getItem.mockResolvedValue(sess);
      localforage.setItem.mockResolvedValue();

      await setTokenExpiry(tokenData);
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        tokenExpiration: expect.objectContaining({
          atExpires: tokenData.atExpires,
          rtExpires: tokenData.rtExpires,
        }),
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
      const token = 'token';
      const tenant = 'test-tenant';
      localforage.setItem.mockResolvedValue();
      localforage.getItem.mockResolvedValue(null);

      await createSession(tenant, token, data);
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        token,
        isAuthenticated: true,
        user: expect.objectContaining({ id: data.user.id, username: data.user.username }),
        perms: { perm1: true },
        tenant,
      }));
    });

    it('uses originalTenantId when present in data', async () => {
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: [] },
        originalTenantId: 'member-tenant',
      };
      localforage.setItem.mockResolvedValue();
      localforage.getItem.mockResolvedValue(null);

      await createSession('central-tenant', 'token', data);
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        tenant: data.originalTenantId,
      }));
    });

    it('preserves existing tokenExpiration from storage', async () => {
      const existingExpiration = { atExpires: 5000, rtExpires: 10000 };
      const data = {
        user: { id: '1', username: 'test' },
        permissions: { permissions: [] },
      };
      localforage.setItem.mockResolvedValue();
      localforage.getItem.mockResolvedValue({ tokenExpiration: existingExpiration });

      await createSession('test-tenant', 'token', data);
      expect(localforage.setItem).toHaveBeenCalledWith(SESSION_NAME, expect.objectContaining({
        tokenExpiration: existingExpiration,
      }));
    });
  });

  describe('processSession', () => {
    it('processes successful response', async () => {
      const jsonData = { user: { id: '1' }, permissions: { permissions: [] } };
      const mockResp = makeFetchResponse({ jsonData });
      localforage.setItem.mockResolvedValue();
      localforage.getItem.mockResolvedValue(null);

      const result = await processSession('test-tenant', mockResp);
      expect(result).toEqual(jsonData);
    });

    it('handles error response', async () => {
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });
      localforage.removeItem.mockResolvedValue();

      const result = await processSession('test-tenant', mockResp);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });
  });

  describe('requestUserWithPerms', () => {
    it('requests user with perms on success', async () => {
      const jsonData = { user: { id: '1' }, permissions: { permissions: [] } };
      const mockResp = makeFetchResponse({ jsonData });
      globalThis.fetch.mockResolvedValue(mockResp);
      localforage.setItem.mockResolvedValue();
      localforage.getItem.mockResolvedValue(null);

      const result = await requestUserWithPerms(defaultConfig, 'test-tenant', 'token');
      expect(result).toEqual(jsonData);
    });

    it('throws error when request fails', async () => {
      const mockError = { message: 'oh no' };
      globalThis.fetch.mockResolvedValue(makeFetchResponse({ ok: false, jsonData: mockError }));

      await expect(requestUserWithPerms(defaultConfig, 'test-tenant', 'token')).rejects.toEqual(mockError);
    });
  });

  describe('fetchOverriddenUserWithPerms', () => {
    it('fetches overridden user with perms', async () => {
      const mockResp = makeFetchResponse();
      globalThis.fetch.mockResolvedValue(mockResp);

      const serverUrl = defaultConfig.gatewayUrl;
      const tenant = 'test-tenant';
      const token = 'token';
      const result = await fetchOverriddenUserWithPerms(serverUrl, tenant, token);
      expect(result).toEqual(mockResp);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${serverUrl}/users-keycloak/_self`),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Okapi-Tenant': tenant, 'X-Okapi-Token': token }),
        }),
      );
    });
  });

  describe('handleLoginError', () => {
    it('clears session and returns processed errors', async () => {
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });
      localforage.removeItem.mockResolvedValue();

      const result = await handleLoginError(mockResp);
      expect(localforage.removeItem).toHaveBeenCalledWith(SESSION_NAME);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });
  });

  describe('getProcessedErrors', () => {
    it('returns client error for 400', () => {
      const clientError = defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR;
      const errors = getProcessedErrors({}, 400, clientError);
      expect(errors).toEqual([clientError]);
    });

    it('returns parsed errors for 422', () => {
      const payload = { errors: ['validation error'] };
      const errors = getProcessedErrors(payload, 422, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual(payload.errors);
    });

    it('returns server error for 500', () => {
      const errors = getProcessedErrors({}, 500, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_SERVER_ERROR]);
    });

    it('returns server error for 404', () => {
      const errors = getProcessedErrors({}, 404, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_SERVER_ERROR]);
    });

    it('returns client error for unknown status', () => {
      const errors = getProcessedErrors({}, 999, defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR);
      expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });
  });

  describe('getLoginErrors', () => {
    it('parses errors from object', () => {
      const payload = { errors: ['error1'] };
      const errors = getLoginErrors(payload);
      expect(errors).toEqual(payload.errors);
    });

    it('parses errors from JSON string', () => {
      const payload = { errors: ['error1'] };
      const errors = getLoginErrors(JSON.stringify(payload));
      expect(errors).toEqual(payload.errors);
    });

    it('returns default error when payload is invalid JSON', () => {
      const errors = getLoginErrors('not-json');
      expect(errors).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
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

      const result = await processBadResponse(mockResp);
      expect(result).toEqual([defaultErrors.DEFAULT_LOGIN_CLIENT_ERROR]);
    });

    it('passes through custom default error', async () => {
      const customError = { code: 'custom', type: 'error' };
      const mockResp = makeFetchResponse({ ok: false, status: 400, jsonData: {} });

      const result = await processBadResponse(mockResp, customError);
      expect(result).toEqual([customError]);
    });
  });

  describe('hideEmail', () => {
    it('should hide email address correctly', () => {
      const result = hideEmail('address@server.domain');
      expect(result).toBe('ad*****@s*****.******');
    });

    it('should handle short email addresses', () => {
      const result = hideEmail('a@b.c');
      expect(result).toBe('a@b.*');
      expect(result).toContain('@');
    });

    it('should preserve @ symbol', () => {
      const result = hideEmail('test@example.com');
      expect(result).toBe('te**@e******.***');
    });

    it('should handle emails with subdomains', () => {
      const result = hideEmail('user@mail.example.co.uk');
      expect(result).toContain('us**@m***.*******.**.**');
    });
  });
});

describe('isValidConfig', () => {
  const validConfig = {
    gatewayUrl: 'https://folio-etesting-snapshot-kong.ci.folio.org',
    authnUrl: 'https://folio-etesting-snapshot-keycloak.ci.folio.org',
    tenantOptions: {
      foo: { name: 'foo', clientId: 'foo-application' }
    },
  }
  describe('accept valid configs', () => {
    it('one tenant', () => {
      expect(isValidConfig(validConfig)).toBe(true);
    });

    it('multiple tenants', () => {
      const config = {
        ...validConfig,
        bar: { name: 'bar', clientId: 'bar-application' }
      };
      expect(isValidConfig(config)).toBe(true);
    });
  });

  describe('rejects invalid configs', () => {
    it('missing gatewayUrl', () => {
      const config = { ...validConfig };
      delete config.gatewayUrl;
      expect(isValidConfig(config)).toBe(false);
    });

    it('missing authnUrl', () => {
      const config = { ...validConfig };
      delete config.authnUrl;
      expect(isValidConfig(config)).toBe(false);
    });

    it('missing tenantOptions', () => {
      const config = { ...validConfig };
      delete config.tenantOptions;
      expect(isValidConfig(config)).toBe(false);
    });

    it('tenantOptions is empty', () => {
      const config = { ...validConfig };
      config.tenantOptions = {};
      expect(isValidConfig(config)).toBe(false);
    });

    it('tenantOptions entry\'s name do not match its key', () => {
      const config = { ...validConfig };
      config.tenantOptions = { foo: { name: "bar", clientId: "bar-application" } };
      expect(isValidConfig(config)).toBe(false);
    });

    it('tenantOptions entry is missing clientId', () => {
      const config = { ...validConfig };
      config.tenantOptions = { foo: { name: "foo" } };
      expect(isValidConfig(config)).toBe(false);
    });
  });
});
