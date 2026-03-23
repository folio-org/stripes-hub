import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import useInitSession from './useInitSession';
import {
  fetchDiscovery,
  fetchEntitlements,
  getCurrentTenant,
  getHeaders,
  getSession,
  setUnauthorizedPathToSession
} from '../loginServices';

jest.mock('../loginServices');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockConfig = {
  gatewayUrl: 'https://api.example.com',
  discoveryUrl: 'https://discovery.example.com',
};

const mockBranding = { logo: 'logo.png' };
const mockLoginUrl = '/login';

const mockSession = {
  isAuthenticated: true,
  user: { id: '123', name: 'Test User' },
  token: 'mock-token',
};

const mockEntitlement = {
  folio_stripes: { name: 'folio_stripes' },
  'folio_stripes-core': { name: 'folio_stripes-core' },
};

const mockDiscovery = {
  'folio_stripes-core': { name: 'folio_stripes-core', location: 'https://stripes.example.com' },
  app1: { name: 'app1', location: 'https://app1.example.com' },
};

describe('useInitSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    getCurrentTenant.mockReturnValue({ name: 'test-tenant' });
    getHeaders.mockReturnValue({ Authorization: 'Bearer token' });
  });

  it('should return loading and error states', () => {
    getSession.mockResolvedValue(null);
    setUnauthorizedPathToSession.mockImplementation(() => {});

    const { result } = renderHook(() => useInitSession(mockConfig, mockBranding, mockLoginUrl), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty('isLoadingSession');
    expect(result.current).toHaveProperty('isLoadingEntitlement');
    expect(result.current).toHaveProperty('isLoadingDiscovery');
    expect(result.current).toHaveProperty('isLoadingStripes');
  });

  it('should authenticate when no cached session exists', async () => {
    getSession.mockResolvedValue(null);
    setUnauthorizedPathToSession.mockImplementation(() => {});

    const { result } = renderHook(() => useInitSession(mockConfig, mockBranding, mockLoginUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(setUnauthorizedPathToSession).toHaveBeenCalled();
  });

  it('should handle session validation failure', async () => {
    getSession.mockResolvedValue(mockSession);

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve('Unauthorized'),
      })
    );

    const { result } = renderHook(() => useInitSession(mockConfig, mockBranding, mockLoginUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingSession).toBe(false);
    });

    expect(result.current.sessionError).toBeDefined();
  });

  it('should handle missing stripes core in discovery', async () => {
    getSession.mockResolvedValue(mockSession);
    fetchEntitlements.mockResolvedValue(mockEntitlement);
    fetchDiscovery.mockResolvedValue({
      app1: { name: 'app1', location: 'https://app1.example.com' },
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: '123' }),
      })
    );

    const { result } = renderHook(() => useInitSession(mockConfig, mockBranding, mockLoginUrl), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingStripes).toBe(false);
    });

    expect(result.current.stripesError).toBeDefined();
  });
});
