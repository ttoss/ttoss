import { render, screen } from '@ttoss/test-utils/react';
import { ErrorBoundary } from 'src/index';

const Throws = (): never => {
  throw new Error('render failed');
};

let consoleError: jest.SpyInstance;

beforeEach(() => {
  // React logs every caught render error; keep the test output clean.
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

test('passes a render error to onError and shows the fallback', () => {
  const onError = jest.fn();

  render(
    <ErrorBoundary onError={onError}>
      <Throws />
    </ErrorBoundary>
  );

  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'render failed' }),
    expect.anything()
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
});

test('renders the fallback without onError', () => {
  render(
    <ErrorBoundary>
      <Throws />
    </ErrorBoundary>
  );

  expect(screen.getByRole('alert')).toBeInTheDocument();
});
