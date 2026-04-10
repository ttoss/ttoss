/**
 * Button — component-specific tests.
 *
 * Universal contract invariants (--_bg scoped var, data-scope, consequence
 * override, style merge, attr protection) are covered by
 * components.contract.test.tsx via testComponentContract().
 *
 * Only Button-specific behaviour is tested here:
 *   - data-size (sm / md / lg) — Button is the only sized component
 *   - type="button" default — form safety, prevents accidental submission
 */
import { render, screen } from '@testing-library/react';
import { Button } from 'src/components/Button/Button';

describe('Button — data-size', () => {
  test('defaults to "md"', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'md');
  });

  test('size="sm"', () => {
    render(<Button size="sm">Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm');
  });

  test('size="lg"', () => {
    render(<Button size="lg">Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'lg');
  });
});

describe('Button — form type safety', () => {
  test('defaults to type="button" to prevent accidental form submission', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  test('type="submit" is forwarded', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
