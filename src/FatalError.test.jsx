import { render, screen, waitFor } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event'
import { IntlProvider } from 'react-intl';
import FatalError from './FatalError';

const mockBranding = {
  altText: 'Branding Alt',
  logo: 'http://logo.png',
};

const mockConfig = {
  gatewayUrl: 'http://gateway.example.com',
};

const mockError = {
  message: 'Test error message',
  options: {
    id: 'stripes-hub.FatalError.some-fatal-error',
    url: 'http://example.com',
  },
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('FatalError', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
    globalThis.location = {
      assign: jest.fn(),
      reload: jest.fn(),
      origin: 'http://localhost',
    };
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  it('renders headline and "try again"/"reload" buttons', () => {
    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={mockError} />
    );

    screen.getByText('stripes-hub.FatalError.headline')

    screen.getByRole('button', { name: /FatalError.tryAgain/ });
    screen.getByRole('button', { name: /FatalError.logout/ });
  });

  it('calls location.reload when try again button is clicked', async () => {
    const user = userEvent.setup()
    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={mockError} />
    );

    await user.click(screen.getByRole('button', { name: /FatalError.tryAgain/ }))
    expect(globalThis.location.reload).toHaveBeenCalled();
  });

  it('calls logout and redirects when logout button is clicked', async () => {
    const user = userEvent.setup()
    globalThis.fetch.mockResolvedValueOnce({ ok: true });

    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={mockError} />
    );

    await user.click(screen.getByRole('button', { name: /FatalError.logout/ }))
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://gateway.example.com/logout',
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      expect(globalThis.location.assign).toHaveBeenCalledWith('http://localhost');
    });
  });

  it('handles API response like "{ errors: [ { message, parameters: [ { value } ] } ] }"', () => {
    const errorWithJson = {
      message: 'Error',
      options: {
        json: {
          errors: [
            {
              message: 'API error message',
              parameters: [{ value: 'sub-detail' }],
            },
          ],
        },
      },
    };

    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={errorWithJson} />
    );

    expect(screen.getByText('API error message')).toBeInTheDocument();
    expect(screen.getByText('sub-detail')).toBeInTheDocument();
  });

  it('handles API response like "{ message }"', () => {
    const errorWithMessage = {
      message: 'Error',
      options: {
        json: {
          message: 'JSON message only',
        },
      },
    };

    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={errorWithMessage} />
    );

    expect(screen.getByText('JSON message only')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    renderWithIntl(
      <FatalError branding={mockBranding} config={mockConfig} error={mockError} />
    );

    expect(console.error).toHaveBeenCalledWith({ error: mockError });
  });
});
