import { MultistepForm } from '../../src';
import { render, screen } from '@ttoss/test-utils';

test('should render titled header', () => {
  const props = {
    header: {
      variant: 'titled' as const,
      title: 'title',
      leftIcon: 'arrowLeft',
      rightIcon: 'arrowRight',
      leftIconClick: jest.fn(),
      rightIconClick: jest.fn(),
    },
    onSubmit: jest.fn(),
  };
  render(<MultistepForm {...props} />);
  expect(screen.getByText('title')).toBeInTheDocument();
});

test('should render logo header', () => {
  const src = 'https://placehold.co/115';
  const props = {
    header: {
      variant: 'logo' as const,
      src,
      onClose: jest.fn(),
    },
    onSubmit: jest.fn(),
  };
  render(<MultistepForm {...props} />);
  const img = screen.getByRole('img');
  expect(img).toBeInTheDocument();
  expect(img).toHaveAttribute('src', src);
});

test('should render footer', () => {
  const props = {
    header: {
      variant: 'titled' as const,
      title: 'title',
      leftIcon: 'arrowLeft',
      rightIcon: 'arrowRight',
      leftIconClick: jest.fn(),
      rightIconClick: jest.fn(),
    },
    footer: 'footer',
    onSubmit: jest.fn(),
  };
  render(<MultistepForm {...props} />);
  expect(screen.getByText('footer')).toBeInTheDocument();
});
