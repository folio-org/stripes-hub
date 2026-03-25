import { render, screen } from '@folio/jest-config-stripes/testing-library/react';
import userEvent from '@folio/jest-config-stripes/testing-library/user-event'
import {
  AuthErrorsContainer,
  Button,
  Col,
  FieldLabel,
  Headline,
  OrganizationLogo,
  Row,
  Select,
  TextField,
} from './StripesComponents';

describe('StripesComponents', () => {
  describe('AuthErrorsContainer', () => {
    it('renders nothing when errors array is empty', () => {
      const { container } = render(<AuthErrorsContainer errors={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders error container with errors', () => {
      const errors = ['Error 1', 'Error 2'];
      render(<AuthErrorsContainer errors={errors} />);

      screen.getByText(/Error 1/);
    });

    it('displays warning icon', () => {
      const errors = ['Test error'];
      render(<AuthErrorsContainer errors={errors} />);

      screen.getByText(/⚠️/);
    });
  });

  describe('Button', () => {
    it('renders button element', () => {
      render(<Button>Click me</Button>);

      screen.getByRole('button');
    });

    it('renders button with children', () => {
      render(<Button>Test Button</Button>);

      screen.getByText('Test Button');
    });

    it('handles click events', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('can be disabled', () => {
      render(<Button disabled>Disabled</Button>);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('sets button type', () => {
      render(<Button type="submit">Submit</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('applies css classes to inner span', () => {
      const { container } = render(
        <Button css={{ inner: 'test-class' }}>Button</Button>
      );

      const span = container.querySelector('span.test-class');
      expect(span).toBeInTheDocument();
    });
  });

  describe('Col', () => {
    it('renders div element', () => {
      const { container } = render(<Col>Content</Col>);

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <Col>
          <div>Test Content</div>
        </Col>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('FieldLabel', () => {
    it('renders label element', () => {
      render(<FieldLabel htmlFor="test-input">Label</FieldLabel>);

      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('sets htmlFor attribute', () => {
      render(<FieldLabel htmlFor="test-input">Label</FieldLabel>);

      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    it('renders children', () => {
      render(
        <FieldLabel htmlFor="test-input">
          <span>Custom Label</span>
        </FieldLabel>
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });
  });

  describe('Headline', () => {
    it('renders h1 element', () => {
      render(<Headline>Headline</Headline>);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<Headline>Test Headline</Headline>);

      expect(screen.getByText('Test Headline')).toBeInTheDocument();
    });
  });

  describe('OrganizationLogo', () => {
    it('renders img element', () => {
      const branding = {
        logo: {
          src: 'http://logo.png',
          alt: 'Organization Logo',
        },
      };

      render(<OrganizationLogo branding={branding} />);

      const img = screen.getByAltText('Organization Logo');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'http://logo.png');
    });

    it('sets width property', () => {
      const branding = {
        logo: {
          src: 'http://logo.png',
          alt: 'Logo',
        },
      };

      render(<OrganizationLogo branding={branding} />);

      const img = screen.getByAltText('Logo');
      expect(img).toHaveAttribute('width', '300px');
    });
  });

  describe('Row', () => {
    it('renders div element', () => {
      const { container } = render(<Row>Content</Row>);

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <Row>
          <div>Test Content</div>
        </Row>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Select', () => {
    it('renders select element', () => {
      render(<Select dataOptions={[]} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders options from dataOptions', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      const { container } = render(<Select dataOptions={options} />);

      const optionElements = container.querySelectorAll('option');
      expect(optionElements[0]).toHaveTextContent('Option 1');
      expect(optionElements[1]).toHaveTextContent('Option 2');
    });

    it('sets option values correctly', () => {
      const options = [
        { value: 'val1', label: 'Label 1' },
        { value: 'val2', label: 'Label 2' },
      ];

      const { container } = render(<Select dataOptions={options} />);

      const optionElements = container.querySelectorAll('option');
      expect(optionElements[0]).toHaveAttribute('value', 'val1');
      expect(optionElements[1]).toHaveAttribute('value', 'val2');
    });

    it('disables options with disabled flag', () => {
      const options = [
        { value: 'opt1', label: 'Enabled', disabled: false },
        { value: 'opt2', label: 'Disabled', disabled: true },
      ];

      const { container } = render(<Select dataOptions={options} />);

      const optionElements = container.querySelectorAll('option');
      expect(optionElements[1]).toBeDisabled();
    });

    it('handles onChange events', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn();
      const options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];

      render(<Select dataOptions={options} onChange={handleChange} />);
      await user.selectOptions(screen.getByRole('combobox'), ['b'])

      expect(handleChange).toHaveBeenCalled();
    });

    it('uses option id for key when available', () => {
      const options = [
        { id: 'custom-id', value: 'val1', label: 'Label' },
      ];

      const { container } = render(<Select dataOptions={options} />);

      expect(container.querySelector('option')).toBeInTheDocument();
    });

    it('generates key from index when id not available', () => {
      const options = [
        { value: 'val1', label: 'Label 1' },
        { value: 'val2', label: 'Label 2' },
      ];

      const { container } = render(<Select dataOptions={options} />);

      const optionElements = container.querySelectorAll('option');
      expect(optionElements).toHaveLength(2);
    });
  });

  describe('TextField', () => {
    it('renders input element', () => {
      const props = {
        input: {
          type: 'text',
          value: '',
          onChange: jest.fn(),
        },
      };

      render(<TextField {...props} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies form control class', () => {
      const props = {
        input: {
          type: 'text',
          value: '',
          onChange: jest.fn(),
        },
      };

      const { container } = render(<TextField {...props} />);

      expect(container.querySelector('.formControl')).toBeInTheDocument();
    });

    it('passes input props to input element', () => {
      const props = {
        input: {
          type: 'email',
          value: 'test@example.com',
          placeholder: 'Enter email',
          onChange: jest.fn(),
        },
      };

      render(<TextField {...props} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
      expect(input).toHaveAttribute('placeholder', 'Enter email');
      expect(input).toHaveValue('test@example.com');
    });
  });
});
