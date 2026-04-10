import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';

import PasswordNotChanged from './PasswordNotChanged';
import {
  changePasswordErrorCodes,
  defaultErrorCodes,
} from '../../constants';

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
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

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('PasswordNotChanged', () => {
  it('renders organization logo and error message', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[]}
      />
    );

    expect(screen.getByTestId('organization-logo')).toBeInTheDocument();
    screen.getByText(/stripes-hub.errors.default/);
  });

  it('displays invalid link error when error code is invalid', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[{ code: changePasswordErrorCodes.INVALID_ERROR_CODE }]}
      />
    );

    screen.getByText(new RegExp(`stripes-hub.errors.${changePasswordErrorCodes.INVALID_ERROR_CODE}`));
  });

  it('displays expired link error when error code is expired', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[{ code: changePasswordErrorCodes.EXPIRED_ERROR_CODE }]}
      />
    );

    screen.getByText(new RegExp(`stripes-hub.errors.${changePasswordErrorCodes.EXPIRED_ERROR_CODE}`));
  });

  it('displays expired link error when error code is used', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[{ code: changePasswordErrorCodes.USED_ERROR_CODE }]}
      />
    );

    screen.getByText(new RegExp(`stripes-hub.errors.${changePasswordErrorCodes.EXPIRED_ERROR_CODE}`));
  });

  it('prioritizes outdated link error over invalid link error', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[
          { code: changePasswordErrorCodes.INVALID_ERROR_CODE },
          { code: changePasswordErrorCodes.EXPIRED_ERROR_CODE },
        ]}
      />
    );

    screen.getByText(new RegExp(`stripes-hub.errors.${changePasswordErrorCodes.EXPIRED_ERROR_CODE}`));
  });

  it('displays default error when no recognized error code is present', () => {
    renderWithIntl(
      <PasswordNotChanged
        branding={mockBranding}
        errors={[{ code: 'unknown.error' }]}
      />
    );

    screen.getByText(new RegExp(`stripes-hub.errors.${defaultErrorCodes.DEFAULT_SERVER_ERROR}`));
  });
});
