import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event'
import { IntlProvider } from 'react-intl';
import PreLoginLanding, { sortedTenantOptions } from './PreLoginLanding';
import * as loginServices from './loginServices';

jest.mock('./loginServices');

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const mockTenantOptions = {
  diku: { name: 'diku', clientId: 'diku-app', displayName: 'Diku' },
  supertenant: { name: 'supertenant', clientId: 'super-app', displayName: 'Supertenant' },
  alpha: { name: 'alpha', clientId: 'alpha-app', displayName: 'Alpha' },
};

const mockConfig = {
  authnUrl: 'http://authn.example.com',
};

const mockMessages = {
  'stripes-hub.PreLoginLanding.tenantLibrary': 'Select a Library',
  'stripes-hub.PreLoginLanding.tenantChoose': 'Choose a library',
  'stripes-hub.PreLoginLanding.button.continue': 'Continue',
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={mockMessages}>
      {component}
    </IntlProvider>
  );
};

describe('PreLoginLanding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.window = {
      location: {
        assign: jest.fn(),
      },
    };
  });

  it('renders with tenant select dropdown', () => {
    loginServices.getCurrentTenant.mockReturnValue(null);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={jest.fn()}
        tenantOptions={mockTenantOptions}
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders continue button disabled by default', () => {
    loginServices.getCurrentTenant.mockReturnValue(null);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={jest.fn()}
        tenantOptions={mockTenantOptions}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('enables button when tenant is selected', async () => {
    const user = userEvent.setup();
    loginServices.getCurrentTenant.mockReturnValue(null);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={jest.fn()}
        tenantOptions={mockTenantOptions}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox'), ['diku'])
    expect(button).not.toBeDisabled();
  });

  it('disables button when tenant is deselected', async () => {
    const user = userEvent.setup();
    loginServices.getCurrentTenant.mockReturnValue(null);
    const mockOnSelectTenant = jest.fn();

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={mockOnSelectTenant}
        tenantOptions={mockTenantOptions}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox'), ['diku'])
    expect(button).not.toBeDisabled();
    await user.selectOptions(screen.getByRole('combobox'), [''])
    expect(button).toBeDisabled();
    expect(mockOnSelectTenant).toHaveBeenCalledWith('', '');
  });

  it('calls onSelectTenant when tenant is selected', async () => {
    const user = userEvent.setup();
    const mockOnSelectTenant = jest.fn();
    loginServices.getCurrentTenant.mockReturnValue(null);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={mockOnSelectTenant}
        tenantOptions={mockTenantOptions}
      />
    );

    const button = screen.getByRole('button');
    await user.selectOptions(screen.getByRole('combobox'), ['diku'])
    expect(mockOnSelectTenant).toHaveBeenCalledWith('diku', 'diku-app');
    expect(button).not.toBeDisabled();
  });

  it('calls onSelectTenant with empty values when tenant is deselected', async () => {
    const user = userEvent.setup();
    const mockOnSelectTenant = jest.fn();
    loginServices.getCurrentTenant.mockReturnValue(null);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={mockOnSelectTenant}
        tenantOptions={mockTenantOptions}
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), [''])
    expect(mockOnSelectTenant).toHaveBeenCalledWith('', '');
  });

  it('redirects to login when button is clicked with selected tenant', async () => {
    const user = userEvent.setup();
    const mockOnSelectTenant = jest.fn();
    const redirectTo = 'http://login.example.com';

    loginServices.getCurrentTenant.mockReturnValue({
      name: 'diku',
      clientId: 'diku-app',
    });
    loginServices.getLoginUrl.mockReturnValue(redirectTo);

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={mockOnSelectTenant}
        tenantOptions={mockTenantOptions}
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), ['diku'])
    await user.click(screen.getByRole('button'));
    expect(globalThis.window.location.assign).toHaveBeenCalledWith(redirectTo);
  });

  it('does not redirect when getCurrentTenant returns no name', async () => {
    const user = userEvent.setup();
    const mockOnSelectTenant = jest.fn();
    loginServices.getCurrentTenant.mockReturnValue({
      clientId: 'diku-app',
    });

    renderWithIntl(
      <PreLoginLanding
        branding={mockBranding}
        config={mockConfig}
        onSelectTenant={mockOnSelectTenant}
        tenantOptions={mockTenantOptions}
      />
    );

    await user.selectOptions(screen.getByRole('combobox'), ['diku'])
    await user.click(screen.getByRole('button'));
    expect(globalThis.window.location.assign).not.toHaveBeenCalled();
  });
});

describe('sortedTenantOptions', () => {
  it('sorts tenants by displayName', () => {
    const options = sortedTenantOptions(mockTenantOptions);

    expect(options[0].label).toBe('Alpha');
    expect(options[1].label).toBe('Diku');
    expect(options[2].label).toBe('Supertenant');
  });

  it('falls back to sortableName when displayName is not available', () => {
    const tenants = {
      diku: { name: 'diku', clientId: 'diku-app', sortableName: 'Z-Diku' },
      alpha: { name: 'alpha', clientId: 'alpha-app', sortableName: 'A-Alpha' },
    };

    const options = sortedTenantOptions(tenants);

    expect(options[0].label).toBe('alpha');
    expect(options[1].label).toBe('diku');
  });

  it('falls back to name when displayName and sortableName are not available', () => {
    const tenants = {
      zebra: { name: 'zebra', clientId: 'zebra-app' },
      apple: { name: 'apple', clientId: 'apple-app' },
    };

    const options = sortedTenantOptions(tenants);

    expect(options[0].label).toBe('apple');
    expect(options[1].label).toBe('zebra');
  });

  it('maps tenant names to value field', () => {
    const options = sortedTenantOptions(mockTenantOptions);

    options.forEach((option) => {
      expect(['diku', 'supertenant', 'alpha']).toContain(option.value);
    });
  });
});
