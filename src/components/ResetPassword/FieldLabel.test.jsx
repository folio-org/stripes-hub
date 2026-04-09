import React from 'react';
import { render, screen } from '@folio/jest-config-stripes/testing-library/react';

import FieldLabel from './FieldLabel';

describe('FieldLabel', () => {
  it('renders a label element', () => {
    render(
      <FieldLabel htmlFor="test-input">Password</FieldLabel>
    );

    const label = screen.getByText('Password');
    expect(label.tagName).toBe('LABEL');
  });

  it('sets the htmlFor attribute correctly', () => {
    render(
      <FieldLabel htmlFor="new-password">New Password</FieldLabel>
    );

    const label = screen.getByText('New Password');
    expect(label).toHaveAttribute('for', 'new-password');
  });

  it('renders children text content', () => {
    render(
      <FieldLabel htmlFor="confirm-password">
        Confirm Password
      </FieldLabel>
    );

    expect(screen.getByText('Confirm Password')).toBeInTheDocument();
  });

  it('renders with multiple children', () => {
    render(
      <FieldLabel htmlFor="field-1">
        <span>Required</span>
        <span>*</span>
      </FieldLabel>
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('applies label class from styles', () => {
    const { container } = render(
      <FieldLabel htmlFor="test-input">Label</FieldLabel>
    );

    const label = container.querySelector('label');
    expect(label).toHaveClass('label');
  });

  it('requires htmlFor prop', () => {
    const { container } = render(
      <FieldLabel htmlFor="">Empty Label</FieldLabel>
    );

    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', '');
  });

  it('associates label with input using htmlFor', () => {
    render(
      <>
        <FieldLabel htmlFor="password-input">Enter Password</FieldLabel>
        <input id="password-input" type="password" />
      </>
    );

    const label = screen.getByText('Enter Password');
    expect(label).toHaveAttribute('for', 'password-input');
  });

  it('renders different text content', () => {
    const { rerender } = render(
      <FieldLabel htmlFor="field">First Label</FieldLabel>
    );

    expect(screen.getByText('First Label')).toBeInTheDocument();

    rerender(
      <FieldLabel htmlFor="field">Second Label</FieldLabel>
    );

    expect(screen.getByText('Second Label')).toBeInTheDocument();
    expect(screen.queryByText('First Label')).not.toBeInTheDocument();
  });
});
