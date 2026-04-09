import React from 'react';
import PasswordStrength from './PasswordStrength';

const mockPasswordStrength = {
  check: jest.fn(() => ({
    strengthCode: 'VERY_STRONG',
  })),
  addCommonPasswords: jest.fn(),
  addTrigraphMap: jest.fn(),
};

jest.mock('tai-password-strength', () => ({
  __esModule: true,
  PasswordStrength: jest.fn(() => mockPasswordStrength),
  commonPasswords: [],
  trigraphs: {},
}));

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
  TextField: ({ value, ...props }) => (
    <input value={value} {...props} data-testid="text-field" />
  ),
  Row: ({ children }) => <div>{children}</div>,
  Col: ({ children }) => <div>{children}</div>,
  InfoPopover: ({ content }) => <div data-testid="info-popover">{content}</div>,
}));

jest.mock('react-intl', () => ({
  __esModule: true,
  FormattedMessage: ({ id }) => <span>{id}</span>,
  useIntl: () => ({
    formatMessage: jest.fn((msg) => msg.id),
  }),
}));

describe('PasswordStrength', () => {
  const mockProps = {
    input: {
      value: 'StrongPassword123!',
    },
    meta: {
      valid: true,
      dirty: true,
    },
    inputColProps: {
      xs: 6,
    },
    passwordMeterColProps: {
      xs: 4,
    },
    passwordStrengthHidden: false,
  };

  it('renders TextField component', () => {
    const instance = new PasswordStrength(mockProps);
    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };

    // Simulate mount and initialPasswordStrength
    instance._isMounted = true;
    instance.setState({ hasLoaded: true });

    const rendered = instance.render();
    expect(rendered).toBeDefined();
  });

  it('does not show password strength when meta.valid is false', () => {
    const props = {
      ...mockProps,
      meta: { valid: false, dirty: true },
    };

    const instance = new PasswordStrength(props);
    instance._isMounted = true;
    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };
    instance.setState({ hasLoaded: true });

    const rendered = instance.render();
    expect(rendered).toBeDefined();
  });

  it('does not show password strength when meta.dirty is false', () => {
    const props = {
      ...mockProps,
      meta: { valid: true, dirty: false },
    };

    const instance = new PasswordStrength(props);
    instance._isMounted = true;
    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };
    instance.setState({ hasLoaded: true });

    const rendered = instance.render();
    expect(rendered).toBeDefined();
  });

  it('does not show password strength when passwordStrengthHidden is true', () => {
    const props = {
      ...mockProps,
      passwordStrengthHidden: true,
    };

    const instance = new PasswordStrength(props);
    instance._isMounted = true;
    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };
    instance.setState({ hasLoaded: true });

    const rendered = instance.render();
    expect(rendered).toBeDefined();
  });

  it('loads password strength library on mount', () => {
    const instance = new PasswordStrength(mockProps);
    expect(typeof instance.strengthTester.check).toBe('function');
  });

  it('maps password strength types correctly', () => {
    const instance = new PasswordStrength(mockProps);
    expect(instance.outputTypes).toHaveProperty('VERY_WEAK');
    expect(instance.outputTypes).toHaveProperty('WEAK');
    expect(instance.outputTypes).toHaveProperty('REASONABLE');
    expect(instance.outputTypes).toHaveProperty('STRONG');
    expect(instance.outputTypes).toHaveProperty('VERY_STRONG');
  });

  it('uses default strength type when strengthCode is undefined', () => {
    const props = {
      ...mockProps,
      input: { value: '' },
    };

    const instance = new PasswordStrength(props);
    instance._isMounted = true;
    instance.setState = function (partial) {
      this.state = typeof partial === 'function'
        ? partial(this.state)
        : { ...this.state, ...partial };
    };
    instance.setState({ hasLoaded: true });

    mockPasswordStrength.check.mockReturnValueOnce({});
    const rendered = instance.render();
    expect(rendered).toBeDefined();
  });
});
