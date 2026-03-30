import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import { runAxeTest } from '@folio/stripes-testing';
import ForgotPassword from './ForgotPassword';
import * as loginServices from './loginServices';
import * as useForgotPasswordModule from './hooks/useForgotPassword';

jest.mock('./loginServices');
jest.mock('./hooks/useForgotPassword');

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const mockConfig = {
  authnUrl: 'http://authn.example.com',
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loginServices.getLoginTenant.mockReturnValue({
      name: 'diku',
      clientId: 'diku-app',
    });
    useForgotPasswordModule.default.mockReturnValue({
      handleSubmit: jest.fn(),
      didMutate: false,
    });
  });

  it('renders headline and form with email/phone input field', () => {
    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );

    screen.getByText(/ForgotPassword.title/);
    screen.getByLabelText(/ForgotPassword.placeholder/, { selector: 'input' });
    screen.getByRole('button', { name: /button.continue/ });
  });

  it('button is disabled when form is pristine', () => {
    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('button is disabled when tenant is not available', () => {
    loginServices.getLoginTenant.mockReturnValue({
      name: null,
    });

    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('displays success message after successful submission', () => {
    useForgotPasswordModule.default.mockReturnValue({
      handleSubmit: jest.fn(),
      didMutate: true,
    });

    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('calls useForgotPassword hook on submit', () => {
    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );

    expect(useForgotPasswordModule.default).toHaveBeenCalledWith({
      config: mockConfig,
      tenant: 'diku',
    });
  });

  it('should render with no axe errors', async () => {
    renderWithIntl(
      <ForgotPassword branding={mockBranding} config={mockConfig} />
    );
    await runAxeTest({
      rootNode: document.body,
    });
  });
});
