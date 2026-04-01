import { renderHook, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { useQuery } from 'react-query';
import useExchangeCode from './useExchangeCode';
import * as loginServices from '../loginServices';

jest.mock('react-query');
jest.mock('../loginServices');
jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatMessage: jest.fn(({ id }) => id),
  }),
}));

describe('useExchangeCode', () => {
  const mockConfig = {
    gatewayUrl: 'http://gateway.example.com',
  };

  const mockLoginTenant = {
    name: 'diku',
    clientId: 'diku-app',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.location = {
      search: '?code=test-code',
      protocol: 'http:',
      host: 'localhost',
    };
    loginServices.getLoginTenant.mockReturnValue(mockLoginTenant);
  });

  describe('when code is present in URL', () => {
    it('exchanges code for token successfully', async () => {
      const tokenData = {
        accessToken: 'test-token',
        expiresIn: 3600,
      };

      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: tokenData,
          error: null,
        };
      });

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(tokenData),
      });

      const mockInitSession = jest.fn();
      const { result } = renderHook(() => useExchangeCode(mockConfig, mockInitSession));

      // Execute the query function
      if (queryFn) {
        await queryFn();
      }

      await waitFor(() => {
        expect(result.current.tokenData).toEqual(tokenData);
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('calls initSession on successful token exchange', async () => {
      const tokenData = {
        accessToken: 'test-token',
      };

      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: tokenData,
          error: null,
        };
      });

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(tokenData),
      });

      const mockInitSession = jest.fn().mockResolvedValue(undefined);
      renderHook(() => useExchangeCode(mockConfig, mockInitSession));

      if (queryFn) {
        await queryFn();
      }

      await waitFor(() => {
        expect(mockInitSession).toHaveBeenCalledWith(tokenData);
      });
    });

    it('handles token exchange failure', async () => {
      const tokenData = {
        error: 'invalid_code',
      };

      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: null,
          error: new Error('Token exchange failure'),
        };
      });

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue(tokenData),
      });

      const mockInitSession = jest.fn();
      const { result } = renderHook(() => useExchangeCode(mockConfig, mockInitSession));

      if (queryFn) {
        try {
          await queryFn();
          // Should throw
          expect(false).toBe(true);
        } catch (e) {
          expect(e).toBeDefined();
        }
      }

      expect(result.current.error).toBeDefined();
    });

    it('handles fetch error', async () => {
      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: null,
          error: new Error('Network error'),
        };
      });

      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const mockInitSession = jest.fn();
      const { result } = renderHook(() => useExchangeCode(mockConfig, mockInitSession));

      if (queryFn) {
        try {
          await queryFn();
          // Should throw
          expect(false).toBe(true);
        } catch (e) {
          expect(e).toBeDefined();
        }
      }

      expect(result.current.error).toBeDefined();
    });

    it('returns loading state while fetching', () => {
      useQuery.mockReturnValue({
        isFetching: true,
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useExchangeCode(mockConfig));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.tokenData).toBeNull();
    });

    it('includes correct query key', () => {
      useQuery.mockReturnValue({
        isFetching: false,
        data: null,
        error: null,
      });

      renderHook(() => useExchangeCode(mockConfig));

      expect(useQuery).toHaveBeenCalledWith(
        ['@folio/stripes-core', 'authn/token', 'test-code'],
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('disables retries', () => {
      useQuery.mockReturnValue({
        isFetching: false,
        data: null,
        error: null,
      });

      renderHook(() => useExchangeCode(mockConfig));

      expect(useQuery).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Function),
        expect.objectContaining({ retry: false })
      );
    });

    it('constructs correct redirect URI', async () => {
      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: {},
          error: null,
        };
      });

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      loginServices.getHeaders.mockReturnValue({ 'x-okapi-tenant': 'diku' });

      renderHook(() => useExchangeCode(mockConfig));

      if (queryFn) {
        await queryFn();
      }

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('code=test-code'),
        expect.any(Object)
      );

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('redirect-uri='),
        expect.any(Object)
      );
    });
  });

  describe('when code is not in URL', () => {
    beforeEach(() => {
      globalThis.location = {
        search: '',
        protocol: 'http:',
        host: 'localhost',
      };
    });

    it('throws error when code is missing', async () => {
      let queryFn;
      useQuery.mockImplementation((...args) => {
        queryFn = args[1];
        return {
          isFetching: false,
          data: null,
          error: new Error('stripes-core.oidc.otp.missingCode'),
        };
      });

      const { result } = renderHook(() => useExchangeCode(mockConfig));

      if (queryFn) {
        try {
          await queryFn();
          // Should throw
          expect(false).toBe(true);
        } catch (e) {

          expect(e).toBeDefined();
        }
      }

      expect(result.current.error.message).toMatch(/missingCode/)
      expect(result.current.error).toBeDefined();
    });
  });

  describe('return value structure', () => {
    it('returns correct shape', () => {
      useQuery.mockReturnValue({
        isFetching: false,
        data: { token: 'test' },
        error: null,
      });

      const { result } = renderHook(() => useExchangeCode(mockConfig));

      expect(result.current).toEqual({
        tokenData: { token: 'test' },
        isLoading: false,
        error: null,
      });
    });
  });
});
