import {
  getLoginTenant,
  hideEmail,
} from './loginServices';

jest.mock('localforage');

describe('loginServices', () => {
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
      expect(tenant.name).toBe('diku');
      expect(tenant.clientId).toBe('client-456');
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

    it('should return undefined values when no config or params', () => {
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
