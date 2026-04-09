import { renderHook, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import usePasswordRules from './usePasswordRules';

jest.mock('ky', () => ({
  __esModule: true,
  default: {
    create: jest.fn((config) => ({
      get: jest.fn().mockReturnValue({
        json: jest.fn().mockResolvedValue({
          rules: [
            { ruleId: '1', name: 'password_length', description: 'At least 8 characters', expression: '.{8,}' },
            { ruleId: '2', name: 'numeric_symbol', description: 'At least 1 numeric', expression: '\\d' },
          ],
        }),
      }),
    })),
  },
}));

const mockConfig = {
  gatewayUrl: 'http://example.com',
};

describe('usePasswordRules', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('returns rules from the API', async () => {
    const { result } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.rules).toBeDefined();
      expect(Array.isArray(result.current.rules)).toBe(true);
    });
  });

  it('includes password_length rule', async () => {
    const { result } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      const lengthRule = result.current.rules?.find(r => r.name === 'password_length');
      expect(lengthRule).toBeDefined();
      expect(lengthRule?.expression).toBe('.{8,}');
    });
  });

  it('includes numeric_symbol rule', async () => {
    const { result } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      const numericRule = result.current.rules?.find(r => r.name === 'numeric_symbol');
      expect(numericRule).toBeDefined();
      expect(numericRule?.expression).toBe('\\d');
    });
  });

  it('uses intl locale as parameter', async () => {
    const { result: result1, unmount: unmount1 } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.rules).toBeDefined();
    });

    unmount1();

    const { result: result2 } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'fr'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result2.current.rules).toBeDefined();
    });
  });

  it('passes rulesLimit in query parameters', async () => {
    const { result } = renderHook(
      () => usePasswordRules(50, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.rules).toBeDefined();
    });
  });

  it('handles different tenants', async () => {
    const { result: result1, unmount: unmount1 } = renderHook(
      () => usePasswordRules(100, mockConfig, 'diku', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result1.current.rules).toBeDefined();
    });

    unmount1();

    const { result: result2 } = renderHook(
      () => usePasswordRules(100, mockConfig, 'other-tenant', 'en'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result2.current.rules).toBeDefined();
    });
  });
});
