import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import { IntlProvider } from 'react-intl';
import { runAxeTest } from '@folio/stripes-testing';

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

  it('should render with no axe errors', async () => {
    renderWithIntl(
      <ForgotDidMutate branding={mockBranding} />
    );
    await runAxeTest({
      rootNode: document.body,
    });
  });
});
