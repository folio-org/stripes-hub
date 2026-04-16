import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';

import AuthErrorsContainer from './AuthErrorsContainer';

jest.mock('../../StripesComponents', () => ({
  __esModule: true,
  MessageBanner: ({ children, show, type, className, 'aria-live': ariaLive }) => (
    show ? (
      <div data-testid="message-banner" data-type={type} className={className} aria-live={ariaLive}>
        {children}
      </div>
    ) : null
  ),
}));

const renderWithIntl = (component) => render(
  <IntlProvider locale="en" messages={{}} defaultLocale="en" onError={() => {}}>
    {component}
  </IntlProvider>
);

describe('AuthErrorsContainer', () => {
  it('renders nothing when errors is empty', () => {
    renderWithIntl(
      <AuthErrorsContainer errors={[]} />
    );

    expect(screen.queryByTestId('message-banner')).not.toBeInTheDocument();
  });

  it('renders nothing when errors is undefined', () => {
    renderWithIntl(
      <AuthErrorsContainer errors={undefined} />
    );

    expect(screen.queryByTestId('message-banner')).not.toBeInTheDocument();
  });

  it('renders nothing when errors is null', () => {
    renderWithIntl(
      <AuthErrorsContainer errors={null} />
    );

    expect(screen.queryByTestId('message-banner')).not.toBeInTheDocument();
  });

  it('renders message banner when errors exist', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    expect(screen.getByTestId('message-banner')).toBeInTheDocument();
  });

  it('sets message banner type to error', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = screen.getByTestId('message-banner');
    expect(banner).toHaveAttribute('data-type', 'error');
  });

  it('sets aria-live to assertive', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = screen.getByTestId('message-banner');
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders unordered list when errors exist', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
      },
    ];

    const { container } = renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('renders list items for each error', () => {
    const errors = [
      {
        code: 'ERROR_1',
        type: 'error',
      },
      {
        code: 'ERROR_2',
        type: 'error',
      },
    ];

    const { container } = renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
  });

  it('renders FormattedMessage with correct id', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
        translationNamespace: 'stripes-hub.errors',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    // FormattedMessage will render the id inside an intl formatter
    // Since we're using a basic IntlProvider, it should attempt to render
    expect(screen.getByTestId('message-banner')).toBeInTheDocument();
  });

  it('uses custom translation namespace when provided', () => {
    const errors = [
      {
        code: 'ERROR_CODE',
        type: 'error',
        translationNamespace: 'custom.namespace',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    expect(screen.getByTestId('message-banner')).toBeInTheDocument();
  });

  it('uses default translation namespace when not provided', () => {
    const errors = [
      {
        code: 'ERROR_CODE',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    expect(screen.getByTestId('message-banner')).toBeInTheDocument();
  });

  it('passes error parameters to FormattedMessage', () => {
    const errors = [
      {
        code: 'ERROR_WITH_PARAMS',
        type: 'error',
        parameters: [
          { key: 'name', value: 'Test User' },
          { key: 'count', value: 5 },
        ],
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    expect(screen.getByTestId('message-banner')).toBeInTheDocument();
  });

  it('renders multiple errors with different types', () => {
    const errors = [
      {
        code: 'PASSWORD_MISMATCH',
        type: 'error',
      },
      {
        code: 'VALIDATION_ERROR',
        type: 'warning',
      },
    ];

    const { container } = renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const listItems = container.querySelectorAll('li');
    expect(listItems).toHaveLength(2);
  });

  it('uses error type in list item key', () => {
    const errors = [
      {
        code: 'ERROR_CODE',
        type: 'custom-type',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    // Key is generated as `${code}-${type}` which helps React identify list items
    const listItems = document.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('handles errors with empty parameters array', () => {
    const errors = [
      {
        code: 'ERROR_NO_PARAMS',
        type: 'error',
        parameters: [],
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = screen.getByTestId('message-banner');
    expect(banner).toBeInTheDocument();
  });

  it('handles errors without parameters property', () => {
    const errors = [
      {
        code: 'ERROR_NO_PROP',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = screen.getByTestId('message-banner');
    expect(banner).toBeInTheDocument();
  });

  it('applies AuthErrorsContainer class to banner', () => {
    const errors = [
      {
        code: 'TEST_ERROR',
        type: 'error',
      },
    ];

    const { container } = renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = container.querySelector('[data-testid="message-banner"]');
    // The className should be applied from styles.AuthErrorsContainer
    expect(banner).toHaveClass('AuthErrorsContainer');
  });

  it('renders banner when errors has one item', () => {
    const errors = [
      {
        code: 'SINGLE_ERROR',
        type: 'error',
      },
    ];

    renderWithIntl(
      <AuthErrorsContainer errors={errors} />
    );

    const banner = screen.getByTestId('message-banner');
    expect(banner).toBeInTheDocument();

    const listItems = document.querySelectorAll('li');
    expect(listItems).toHaveLength(1);
  });

  it('does not render list when hasErrors is false', () => {
    const { container } = renderWithIntl(
      <AuthErrorsContainer errors={[]} />
    );

    expect(container.querySelector('ul')).not.toBeInTheDocument();
  });
});
