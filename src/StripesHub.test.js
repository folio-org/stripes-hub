import { render, screen } from '@testing-library/react';
import StripesHub from './StripesHub';

test('renders', () => {
  render(<StripesHub />);
  const parentDiv = screen.getByTestId("StripesHub");
  expect(parentDiv).toBeInTheDocument();
});
