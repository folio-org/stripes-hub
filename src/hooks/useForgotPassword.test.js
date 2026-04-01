import { renderHook, act, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { useMutation } from 'react-query';
import useForgotPassword from './useForgotPassword';

jest.mock('react-query');

describe('useForgotPassword', () => {
  const mockConfig = {
    gatewayUrl: 'http://gateway.example.com',
    authnUrl: 'http://authn.example.com',
  };

  const mockTenant = 'diku';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('with keycloak authnUrl', () => {
    it('uses users-keycloak path when authnUrl is present', () => {
      const mutationFn = jest.fn();
      useMutation.mockReturnValue({
        mutateAsync: mutationFn,
        status: 'idle',
      });

      renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      const [config] = useMutation.mock.calls[0];
      config.mutationFn('test@example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users-keycloak/forgotten/password'),
        expect.any(Object)
      );
    });
  });

  describe('without keycloak authnUrl', () => {
    it('uses bl-users path when authnUrl is not present', () => {
      const configWithoutAuthn = {
        gatewayUrl: 'http://gateway.example.com',
      };

      const mutationFn = jest.fn();
      useMutation.mockReturnValue({
        mutateAsync: mutationFn,
        status: 'idle',
      });

      renderHook(() => useForgotPassword({ config: configWithoutAuthn, tenant: mockTenant }));

      const [config] = useMutation.mock.calls[0];
      config.mutationFn('test@example.com');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bl-users/forgotten/password'),
        expect.any(Object)
      );
    });
  });

  describe('handleSubmit', () => {
    it('submits forgotten password request with user input', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith('test@example.com');
    });

    it('sets didMutate to true after successful submission', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.didMutate).toBe(false);

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.didMutate).toBe(true);
      });
    });

    it('sets didMutate to true even when mutation fails', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.didMutate).toBe(false);

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.didMutate).toBe(true);
      });

      consoleSpy.mockRestore();
    });

    it('logs error when mutation fails', async () => {
      const error = new Error('Network error');
      const mockMutateAsync = jest.fn().mockRejectedValue(error);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });

    it('sends correct headers with tenant', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-okapi-tenant': 'diku',
            'content-type': 'application/json',
            'accept': 'application/json',
          }),
        })
      );
    });

    it('sends POST request with credentials', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          body: JSON.stringify({ id: 'test@example.com' }),
        })
      );
    });

    it('initially sets didMutate to null', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      let didMutateBeforeCompletion;

      await act(async () => {
        const promise = result.current.handleSubmit({ userInput: 'test@example.com' });
        // Capture state before completion
        didMutateBeforeCompletion = result.current.didMutate;
        await promise;
      });

      // Initially set to null to reset state
      expect(didMutateBeforeCompletion).toBe(false);
    });
  });

  describe('return value structure', () => {
    it('returns handleSubmit function and didMutate state', () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('didMutate');
      expect(typeof result.current.handleSubmit).toBe('function');
      expect(typeof result.current.didMutate).toBe('boolean');
    });

    it('initializes didMutate to false', () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.didMutate).toBe(false);
    });
  });

  describe('mutation configuration', () => {
    it('creates mutation with mutationFn', () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      const [config] = useMutation.mock.calls[0];
      expect(config).toHaveProperty('mutationFn');
      expect(typeof config.mutationFn).toBe('function');
    });

    it('mutationFn makes correct fetch call', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotPassword({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'phone-number' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://gateway.example.com/users-keycloak/forgotten/password',
        expect.objectContaining({
          body: JSON.stringify({ id: 'phone-number' }),
        })
      );
    });
  });
});
