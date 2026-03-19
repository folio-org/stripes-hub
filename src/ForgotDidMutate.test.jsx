import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import ForgotDidMutate from './ForgotDidMutate';

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo',
  },
};

const renderWithIntl = (component) => {
  return render(
    <IntlProvider locale="en" messages={{}}>
      {component}
    </IntlProvider>
  );
};

describe('ForgotDidMutate', () => {
  it('renders instructions', () => {
    renderWithIntl(<ForgotDidMutate branding={mockBranding} />);
    screen.getByText(/ForgotDidMutate.checkYourEmail/);
    screen.getByText(/ForgotDidMutate.sent/);
    screen.getByText(/ForgotDidMutate.missing/);
  });
});
