import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';

import PasswordSuccessfullyChanged from './PasswordSuccessfullyChanged';

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
  Button: ({ children, type, disabled, onClick }) => (
    <button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Headline: ({ children, tag: Tag = 'div', size, weight, faded }) => (
    <Tag data-size={size} data-weight={weight} data-faded={faded}>
      {children}
    </Tag>
  ),
  OrganizationLogo: () => <div data-testid="organization-logo" />,
}));

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const mockHistory = {
  push: jest.fn(),
};

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('PasswordSuccessfullyChanged', () => {
  let originalLocation;

  beforeEach(() => {
    originalLocation = globalThis.location;
    delete globalThis.location;
    globalThis.location = { href: '' };
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.location = originalLocation;
  });

  it('renders success confirmation message', () => {
    renderWithIntl(
      <PasswordSuccessfullyChanged
        branding={mockBranding}
        history={mockHistory}
      />
    );

    expect(screen.getByTestId('organization-logo')).toBeInTheDocument();
    screen.getByText(/stripes-hub.label.congratulations/);
    screen.getByText(/stripes-hub.label.changed.password/);
  });

  it('renders redirect button', () => {
    renderWithIntl(
      <PasswordSuccessfullyChanged
        branding={mockBranding}
        history={mockHistory}
      />
    );

    const button = screen.getByRole('button', { name: /stripes-hub.button.redirect.login/ });
    expect(button).toBeInTheDocument();
  });

  it('redirects to home when button is clicked', () => {
    renderWithIntl(
      <PasswordSuccessfullyChanged
        branding={mockBranding}
        history={mockHistory}
      />
    );

    const button = screen.getByRole('button', { name: /stripes-hub.button.redirect.login/ });
    button.click();

    expect(globalThis.location.href).toBe('/');
  });
});
