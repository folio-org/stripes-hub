import { createRef } from 'react';
import { act, render, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import ResetPasswordControl from './ResetPasswordControl';

jest.mock('./ResetPassword', () => ({
  __esModule: true,
  default: () => <div data-testid="reset-password" />,
}));

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const mockConfig = {
  gatewayUrl: 'http://authn.example.com',
};

const mockLocation = {
  search: '?tenant=diku',
  pathname: '/reset/abcd',
};

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('ResetPasswordControl', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ status: 204 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('validates reset token on mount and sets isValidToken', async () => {
    const ref = createRef();

    renderWithIntl(
      <ResetPasswordControl
        ref={ref}
        config={mockConfig}
        branding={mockBranding}
        location={mockLocation}
      />
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(ref.current.state.isValidToken).toBe(true);
  });

  it('clears auth errors after successful submission', async () => {
    const ref = createRef();

    renderWithIntl(
      <ResetPasswordControl
        ref={ref}
        config={mockConfig}
        branding={mockBranding}
        location={mockLocation}
      />
    );

    await waitFor(() => expect(ref.current).not.toBeNull());

    act(() => {
      ref.current.setState({ submitIsFailed: true, authFailure: [{ code: 'existing' }] });
      ref.current.clearErrorsAfterSubmit(true);
    });

    expect(ref.current.state.submitIsFailed).toBe(false);
    expect(ref.current.state.authFailure).toEqual([]);
  });

  it('handleSubmit invokes makeCall with the provided password', async () => {
    const ref = createRef();

    renderWithIntl(
      <ResetPasswordControl
        ref={ref}
        config={mockConfig}
        branding={mockBranding}
        location={mockLocation}
      />
    );

    await waitFor(() => expect(ref.current).not.toBeNull());
    const makeCallMock = jest.spyOn(ref.current, 'makeCall').mockResolvedValue();

    await ref.current.handleSubmit({ newPassword: 'password123' });

    expect(makeCallMock).toHaveBeenCalledWith({ newPassword: 'password123' });
  });
});
