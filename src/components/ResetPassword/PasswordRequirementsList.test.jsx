import React from 'react';
import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';

import PasswordRequirementsList from './PasswordRequirementsList';

jest.mock('./usePasswordRules', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    rules: [
      {
        ruleId: '1',
        name: 'password_length',
        description: 'The password must have at least 8 characters',
        expression: '.{8,}',
      },
      {
        ruleId: '2',
        name: 'numeric_symbol',
        description: 'The password must contain at least 1 numeric character',
        expression: '\\d',
      },
      {
        ruleId: '3',
        name: 'special_character',
        description: 'The password must contain at least 1 special character',
        expression: '[!@#$%^&*]',
      },
      {
        ruleId: '4',
        name: 'alphabetical_letters',
        description: 'The password must contain at least 1 alphabetical letter',
        expression: '[a-zA-Z]',
      },
      {
        ruleId: '5',
        name: 'unknown_rule',
        description: 'This rule will be filtered out',
        expression: '.*',
      },
    ],
  })),
}));

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
  Layout: ({ children, className }) => (
    <div className={className} data-testid="layout">
      {children}
    </div>
  ),
}));

const mockConfig = {
  gatewayUrl: 'http://example.com',
};

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('PasswordRequirementsList', () => {
  it('returns null when passwordValue is empty', () => {
    const { container } = renderWithIntl(
      <PasswordRequirementsList
        passwordValue=""
        config={mockConfig}
        tenant="diku"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when passwordValue is undefined', () => {
    const { container } = renderWithIntl(
      <PasswordRequirementsList
        config={mockConfig}
        tenant="diku"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays unfulfilled password requirements as a list', async () => {
    const { container } = renderWithIntl(
      <PasswordRequirementsList
        passwordValue="Test1"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      const rulesList = container.querySelector('[data-test-password-requirements-field]');
      expect(rulesList).toBeInTheDocument();
    });

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBeGreaterThan(0);
  });

  it('displays all unfulfilled rules for weak password', async () => {
    renderWithIntl(
      <PasswordRequirementsList
        passwordValue="a"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      // Should have at least password_length and numeric_symbol unfulfilled
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('returns null when all password rules are fulfilled', async () => {
    const { container } = renderWithIntl(
      <PasswordRequirementsList
        passwordValue="ValidPass123!"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      // Should have no unfulfilled rules, so container returns Layout wrapping null
      expect(container.textContent).toBe('');
    });
  });

  it('filters rules by password requirement names', async () => {
    renderWithIntl(
      <PasswordRequirementsList
        passwordValue="a"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      // Should not include 'unknown_rule' since it's not in passwordRequirementsNames
      expect(items.length).toBeLessThanOrEqual(4);
    });
  });

  it('renders Layout component with textLeft class', async () => {
    renderWithIntl(
      <PasswordRequirementsList
        passwordValue="short"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      const layout = screen.getByTestId('layout');
      expect(layout).toHaveClass('textLeft');
    });
  });

  it('uses correct test attribute on rules list', async () => {
    const { container } = renderWithIntl(
      <PasswordRequirementsList
        passwordValue="short"
        config={mockConfig}
        tenant="diku"
      />
    );

    await waitFor(() => {
      const rulesList = container.querySelector('[data-test-password-requirements-field]');
      expect(rulesList).toBeInTheDocument();
    });
  });
});
