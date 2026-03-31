import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event'
import { runAxeTest } from '@folio/stripes-testing';
import { IntlProvider } from 'react-intl';
import ForgotUsername from './ForgotUsername';
import * as loginServices from './loginServices';
import * as useForgotUsernameModule from './hooks/useForgotUsername';

jest.mock('./loginServices');
jest.mock('./hooks/useForgotUsername');

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

describe('ForgotUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loginServices.getLoginTenant.mockReturnValue({
      name: 'diku',
      clientId: 'diku-app',
    });
    useForgotUsernameModule.default.mockReturnValue({
      handleSubmit: jest.fn(),
      didMutate: false,
      isError: false,
    });
  });

  it('renders headline and form with email/phone input field', () => {
    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    screen.getByText(/ForgotUsername.title/);
    screen.getByLabelText(/ForgotUsername.placeholder/, { selector: 'input' });
    screen.getByRole('button', { name: /button.continue/ });
  });

  it('button is disabled when form is pristine', () => {
    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('button is disabled when tenant is not available', () => {
    loginServices.getLoginTenant.mockReturnValue({
      name: null,
    });

    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
  });

  it('displays success message after successful submission', () => {
    useForgotUsernameModule.default.mockReturnValue({
      handleSubmit: jest.fn(),
      didMutate: true,
      isError: false,
    });

    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('displays error message given invalid input', async () => {
    const user = userEvent.setup()

    useForgotUsernameModule.default.mockReturnValue({
      handleSubmit: jest.fn(),
      didMutate: false,
      isError: true,
    });

    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    const input = screen.getByRole('textbox')
    await user.type(input, 'not an email or phone number')
    await user.click(screen.getByRole('button', { name: /button.continue/ }))

    await waitFor(() => {
      screen.getByText(/ForgotUsername.error/);
    });
  });

  it('calls useForgotUsername hook on submit', () => {
    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );

    expect(useForgotUsernameModule.default).toHaveBeenCalledWith({
      config: mockConfig,
      tenant: 'diku',
    });
  });

  it('should render with no axe errors', async () => {
    renderWithIntl(
      <ForgotUsername branding={mockBranding} config={mockConfig} />
    );
    await runAxeTest({
      rootNode: document.body,
    });
  });

});
