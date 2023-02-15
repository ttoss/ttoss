import { Button } from '../../src';
import { render, screen } from '@ttoss/test-utils';

const RightIcon = () => {
  return <span>Right icon</span>;
};

const LeftIcon = () => {
  return <span>Left icon</span>;
};

test('should render right icon', () => {
  render(<Button rightIcon={<RightIcon />}>Click me</Button>);
  expect(screen.getByText('Right icon')).toBeInTheDocument();
});

test('should render left icon', () => {
  render(<Button leftIcon={<LeftIcon />}>Click me</Button>);
  expect(screen.getByText('Left icon')).toBeInTheDocument();
});

test('should render left and right icon', () => {
  render(
    <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
      Click me
    </Button>
  );
  expect(screen.getByText('Left icon')).toBeInTheDocument();
  expect(screen.getByText('Right icon')).toBeInTheDocument();
});
