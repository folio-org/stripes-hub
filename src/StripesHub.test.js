import { render, screen } from '@testing-library/react';
import StripesHub from './StripesHub';

test('renders', () => {
  const stripes = {
        url: 'http://url',
        authnUrl: 'http://authn',
      };
      const config = {
        tenantOptions: {
          diku: {
            name: 'diku', clientId: 'diku-application'
          }
        },
        preserveConsole: true
      }

  render(<StripesHub stripes={stripes} config={config} />);

  const parentDiv = screen.getByTestId("StripesHub");
  expect(parentDiv).toBeInTheDocument();
});
