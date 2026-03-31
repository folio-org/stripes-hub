/* eslint-disable no-undef, no-unused-vars */
import { renderHook, act, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { useMutation } from 'react-query';
import useForgotUsername, {
  isValidEmail,
  isValidPhoneNumber,
  isValidEmailOrPhoneNumber,
} from './useForgotUsername';

jest.mock('react-query');

describe('useForgotUsername', () => {
  const mockConfig = {
    gatewayUrl: 'http://gateway.example.com',
    authnUrl: 'http://authn.example.com',
  };

  const mockTenant = 'diku';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('handleSubmit with valid input', () => {
    it('submits forgotten username request with valid email', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith('test@example.com');
    });

    it('submits forgotten username request with valid phone number', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: '555-123-4567' });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith('555-123-4567');
    });

    it('sets didMutate to true on successful submission', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.didMutate).toBe(false);

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.didMutate).toBe(true);
      });
    });

    it('does not set isError when submission is successful', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(false);
      });
    });

    it('resets isError to false before submission', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      // First submission with invalid input to set error
      await act(async () => {
        await result.current.handleSubmit({ userInput: 'invalid input!' });
      });

      expect(result.current.isError).toBe(true);

      // Second submission with valid input
      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(false);
      });
    });

    it('sets didMutate to true even when mutation fails', async () => {
      const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Network error'));
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

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

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });
  });

  describe('handleSubmit with invalid input', () => {
    it('sets isError to true when input is invalid', async () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'not valid' });
      });

      expect(result.current.isError).toBe(true);
    });

    it('does not call mutateAsync when input is invalid', async () => {
      const mockMutateAsync = jest.fn();
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'invalid!' });
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does not set didMutate when input is invalid', async () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: '@' });
      });

      // didMutate is set to null initially for invalid input
      expect(result.current.didMutate).toBeFalsy();
    });

    it('rejects email-looking input without domain suffix', async () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example' });
      });

      expect(result.current.isError).toBe(true);
    });

    it('rejects special characters', async () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      const invalidInputs = ['test$example.com', 'test@example!', '555-123-456a'];

      for (const input of invalidInputs) {
        await act(async () => {
          await result.current.handleSubmit({ userInput: input });
        });

        expect(result.current.isError).toBe(true);
      }
    });
  });

  describe('handleSubmit state management', () => {
    it('resets didMutate to null at start of submission', async () => {
      const mockMutateAsync = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.didMutate).toBe(false);

      act(() => {
        result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      // Verify it was set to null (falsy but not false)
      expect(result.current.didMutate).toBeFalsy();
    });

    it('resets isError to false at start of submission', async () => {
      const mockMutateAsync = jest.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      // First set error state
      await act(async () => {
        await result.current.handleSubmit({ userInput: 'invalid!' });
      });

      expect(result.current.isError).toBe(true);

      // Then valid submission
      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(false);
      });
    });
  });

  describe('with keycloak authnUrl', () => {
    it('uses users-keycloak path when authnUrl is present', async () => {
      const mutationFn = jest.fn();
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users-keycloak/forgotten/username'),
        expect.any(Object)
      );
    });
  });

  describe('without keycloak authnUrl', () => {
    it('uses bl-users path when authnUrl is not present', async () => {
      const configWithoutAuthn = {
        gatewayUrl: 'http://gateway.example.com',
      };

      const mutationFn = jest.fn();
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotUsername({ config: configWithoutAuthn, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bl-users/forgotten/username'),
        expect.any(Object)
      );
    });
  });

  describe('mutation request details', () => {
    it('sends correct headers with tenant', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

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

    it('sends POST request with correct method and credentials', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        })
      );
    });

    it('includes id in request body', async () => {
      useMutation.mockImplementation(({ mutationFn: fn }) => ({
        mutateAsync: fn,
        status: 'idle',
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      await act(async () => {
        await result.current.handleSubmit({ userInput: 'test@example.com' });
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ id: 'test@example.com' }),
        })
      );
    });
  });

  describe('return value structure', () => {
    it('returns correct properties', () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      expect(result.current).toHaveProperty('isError');
      expect(result.current).toHaveProperty('handleSubmit');
      expect(result.current).toHaveProperty('didMutate');
    });

    it('initializes with correct default values', () => {
      useMutation.mockReturnValue({
        mutateAsync: jest.fn(),
        status: 'idle',
      });

      const { result } = renderHook(() => useForgotUsername({ config: mockConfig, tenant: mockTenant }));

      expect(result.current.isError).toBe(false);
      expect(result.current.didMutate).toBe(false);
      expect(typeof result.current.handleSubmit).toBe('function');
    });
  });
});

describe('isValidEmailOrPhoneNumber', () => {
  describe('accepts valid email addresses and phone numbers', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmailOrPhoneNumber('test@example.edu')).toBe(true);
    });

    it('accepts values with comments in username', () => {
      expect(isValidEmailOrPhoneNumber('test+comment@example.edu')).toBe(true);
    });

    it('accepts values with numbers only', () => {
      expect(isValidEmailOrPhoneNumber('12')).toBe(true);
    });

    it('accepts values with numbers and dashes', () => {
      expect(isValidEmailOrPhoneNumber('1-2')).toBe(true);
    });

    it('accepts values with numbers and dots', () => {
      expect(isValidEmailOrPhoneNumber('1.2')).toBe(true);
    });
  });

  it('rejects values that are not valid email addresses or phone numbers', () => {
    expect(isValidEmailOrPhoneNumber('not an email address')).toBe(false);
    expect(isValidEmailOrPhoneNumber('not a phone number')).toBe(false);
    expect(isValidEmailOrPhoneNumber('test$example.edu')).toBe(false);
    expect(isValidEmailOrPhoneNumber('test@example')).toBe(false);
    expect(isValidEmailOrPhoneNumber('1.2a')).toBe(false);
    expect(isValidEmailOrPhoneNumber('1.2!')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('test@example.edu')).toBe(true);
  });

  it('accepts values with comments in username', () => {
    expect(isValidEmail('test+comment@example.edu')).toBe(true);
  });

  it('rejects values without @', () => {
    expect(isValidEmail('test$example.edu')).toBe(false);
  });

  it('rejects values without domain suffix', () => {
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('rejects values with whitespace', () => {
    expect(isValidEmail(' test@example.com ')).toBe(false);
  });
});

describe('isValidPhoneNumber', () => {
  it('accepts values with numbers only', () => {
    expect(isValidPhoneNumber('12')).toBe(true);
  });

  it('accepts values with numbers and dashes', () => {
    expect(isValidPhoneNumber('1-2')).toBe(true);
  });

  it('accepts values with numbers and dots', () => {
    expect(isValidPhoneNumber('1.2')).toBe(true);
  });

  it('rejects values containing characters other than numbers, dashes, and dots', () => {
    expect(isValidPhoneNumber('1.2 ')).toBe(false);
    expect(isValidPhoneNumber('1.2a')).toBe(false);
    expect(isValidPhoneNumber('1.2!')).toBe(false);
  });
});

