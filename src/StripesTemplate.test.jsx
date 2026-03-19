import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import StripesTemplate from './StripesTemplate';

const mockBranding = {
  logo: {
    src: 'http://logo.png',
    alt: 'Logo Alt Text',
  },
};

describe('StripesTemplate', () => {
  it('renders with branding logo', () => {
    render(
      <StripesTemplate branding={mockBranding}>
        <div>Test Content</div>
      </StripesTemplate>
    );

    const logo = screen.getByAltText('Logo Alt Text');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'http://logo.png');
  });

  it('renders children content', () => {
    render(
      <StripesTemplate branding={mockBranding}>
        <div>Test Content</div>
      </StripesTemplate>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders main element with proper structure', () => {
    const { container } = render(
      <StripesTemplate branding={mockBranding}>
        <div>Content</div>
      </StripesTemplate>
    );

    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle('width: 100%');
  });

  it('renders multiple children', () => {
    render(
      <StripesTemplate branding={mockBranding}>
        <div>First Child</div>
        <div>Second Child</div>
      </StripesTemplate>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });
});
