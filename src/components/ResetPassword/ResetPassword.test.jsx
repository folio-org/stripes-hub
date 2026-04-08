import React from 'react';
import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';

import ResetPassword from './ResetPassword';

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
  TextField: ({ input, type, id, autoComplete }) => (
    <input
      {...input}
      type={type}
      id={id}
      autoComplete={autoComplete}
      data-testid="text-field"
    />
  ),
  Button: ({ children, type, disabled, onClick }) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Row: ({ children }) => <div>{children}</div>,
  Col: ({ children }) => <div>{children}</div>,
  Headline: ({ children }) => <div>{children}</div>,
  OrganizationLogo: () => <div data-testid="organization-logo" />,
}));

jest.mock('./PasswordStrength', () => ({
  __esModule: true,
  default: ({ input, type, id, autoComplete }) => (
    <input
      {...input}
      type={type}
      id={id}
      autoComplete={autoComplete}
      data-testid="new-password-input"
    />
  ),
}));

jest.mock('./AuthErrorsContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="auth-errors" />,
}));

jest.mock('./FieldLabel', () => ({
  __esModule: true,
  default: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('./PasswordRequirementsList', () => ({
  __esModule: true,
  default: () => <div data-testid="password-requirements" />,
}));

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const mockConfig = {};

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('ResetPassword', () => {
  it('renders password fields and disables submit when form is pristine', () => {
    renderWithIntl(
      <ResetPassword
        config={mockConfig}
        branding={mockBranding}
        onSubmit={jest.fn()}
        clearAuthErrors={jest.fn()}
        onPasswordInputFocus={jest.fn()}
        setAuthErrors={jest.fn()}
        errors={[]}
      />
    );

    screen.getByLabelText(/stripes-hub.createResetPassword.newPassword/);
    screen.getByLabelText(/stripes-hub.createResetPassword.confirmPassword/);
    expect(screen.getByRole('button', { name: /stripes-hub.setPassword/ })).toBeDisabled();
  });

  it('toggles password visibility state when togglePasswordMask is called', () => {
    const instance = new ResetPassword({
      config: mockConfig,
      branding: mockBranding,
      onSubmit: jest.fn(),
      clearAuthErrors: jest.fn(),
      onPasswordInputFocus: jest.fn(),
      setAuthErrors: jest.fn(),
      errors: [],
    });

    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };

    expect(instance.state.passwordMasked).toBe(true);
    instance.togglePasswordMask();
    expect(instance.state.passwordMasked).toBe(false);
    instance.togglePasswordMask();
    expect(instance.state.passwordMasked).toBe(true);
  });

  it('calls setAuthErrors when confirm password does not match new password', () => {
    const mockSetAuthErrors = jest.fn();
    const mockClearAuthErrors = jest.fn();

    const instance = new ResetPassword({
      config: mockConfig,
      branding: mockBranding,
      onSubmit: jest.fn(),
      clearAuthErrors: mockClearAuthErrors,
      onPasswordInputFocus: jest.fn(),
      setAuthErrors: mockSetAuthErrors,
      errors: [],
    });

    instance.confirmPasswordFieldValidation('mismatch', {
      newPassword: 'password123',
      confirmPassword: 'mismatch',
    });

    expect(mockSetAuthErrors).toHaveBeenCalledWith([
      {
        code: 'password.match.error',
        translationNamespace: 'stripes-hub.errors',
      },
    ]);
    expect(mockClearAuthErrors).not.toHaveBeenCalled();
  });

  it('calls clearAuthErrors when confirm password matches new password', () => {
    const mockSetAuthErrors = jest.fn();
    const mockClearAuthErrors = jest.fn();

    const instance = new ResetPassword({
      config: mockConfig,
      branding: mockBranding,
      onSubmit: jest.fn(),
      clearAuthErrors: mockClearAuthErrors,
      onPasswordInputFocus: jest.fn(),
      setAuthErrors: mockSetAuthErrors,
      errors: [],
    });

    instance.confirmPasswordFieldValidation('password123', {
      newPassword: 'password123',
      confirmPassword: 'password123',
    });

    expect(mockClearAuthErrors).toHaveBeenCalledTimes(1);
    expect(mockSetAuthErrors).not.toHaveBeenCalled();
  });
});
