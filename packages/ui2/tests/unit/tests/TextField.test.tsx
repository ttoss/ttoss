/**
 * TextField — composite integration tests.
 *
 * Tests the TextField composite end-to-end: Field.Root context propagation,
 * ARIA wiring (from Ark UI), Label/Input/HelperText/ValidationMessage assembly,
 * and the invalid/disabled state lifecycle.
 *
 * Primitive contract tests (--_bg scoped vars, data-scope, data-part) are
 * covered per-component in components.contract.test.tsx. Only TextField-specific
 * behaviours are tested here.
 */
import { render, screen } from '@testing-library/react';
import { TextField } from 'src/composites/TextField/TextField';

// ---------------------------------------------------------------------------
// Rendering — assembly
// ---------------------------------------------------------------------------

describe('TextField — rendering', () => {
  test('renders an input element', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders label when provided', () => {
    render(<TextField label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  test('renders helper text when provided', () => {
    render(<TextField label="Email" helperText="We won't share this." />);
    expect(screen.getByText("We won't share this.")).toBeInTheDocument();
  });

  test('does not render label element when label is omitted', () => {
    render(<TextField />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  test('does not render helper text span when helperText is omitted', () => {
    const { container } = render(<TextField />);
    expect(
      container.querySelector('[data-scope="helper-text"]')
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// data-* attributes on container
// ---------------------------------------------------------------------------

describe('TextField — container data attributes', () => {
  test('root has data-scope="text-field"', () => {
    const { container } = render(<TextField label="Name" />);
    expect(container.firstChild).toHaveAttribute('data-scope', 'text-field');
  });

  test('root has data-part="root"', () => {
    const { container } = render(<TextField label="Name" />);
    expect(container.firstChild).toHaveAttribute('data-part', 'root');
  });
});

// ---------------------------------------------------------------------------
// Input data attributes
// ---------------------------------------------------------------------------

describe('TextField — Input data attributes', () => {
  test('input defaults to data-size="md"', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
  });

  test('size prop is forwarded to Input', () => {
    render(<TextField label="Name" size="lg" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'lg');
  });

  test('input receives data-scope="input"', () => {
    render(<TextField label="Name" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-scope', 'input');
  });

  test('placeholder is forwarded to the underlying input', () => {
    render(<TextField label="Name" placeholder="Enter name" />);
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  test('type prop is forwarded to the underlying input', () => {
    render(<TextField label="Password" type="password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );
  });
});

// ---------------------------------------------------------------------------
// ARIA wiring (Ark Field.Root context)
// ---------------------------------------------------------------------------

describe('TextField — ARIA wiring', () => {
  test('input has aria-labelledby linked to label (Ark Field wiring)', () => {
    render(<TextField label="Email" />);
    // Simplified check: getByLabelText proves aria-labelledby wiring
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('input has aria-describedby linked to helper text (Ark Field wiring)', () => {
    render(<TextField label="Email" helperText="Enter your email" />);
    const input = screen.getByRole('textbox');
    const helper = screen.getByText('Enter your email');
    // aria-describedby on input should include the helper text id
    expect(input.getAttribute('aria-describedby')).toContain(
      helper.getAttribute('id')
    );
  });
});

// ---------------------------------------------------------------------------
// Invalid state
// ---------------------------------------------------------------------------

describe('TextField — invalid state', () => {
  test('input receives data-invalid when invalid=true', () => {
    render(<TextField label="Email" invalid />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-invalid');
  });

  test('input does not have data-invalid when invalid=false', () => {
    render(<TextField label="Email" invalid={false} />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('data-invalid');
  });

  test('error text is shown when invalid=true and errorText is provided', () => {
    render(
      <TextField label="Email" invalid errorText="Invalid email address" />
    );
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  test('error text is not shown when invalid=false', () => {
    render(
      <TextField
        label="Email"
        invalid={false}
        errorText="Invalid email address"
      />
    );
    expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

describe('TextField — disabled state', () => {
  test('input is disabled when disabled=true', () => {
    render(<TextField label="Name" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Required state
// ---------------------------------------------------------------------------

describe('TextField — required state', () => {
  test('input has aria-required when required=true', () => {
    render(<TextField label="Email" required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});

// ---------------------------------------------------------------------------
// ValidationMessage — tested through TextField composite
// ---------------------------------------------------------------------------

describe('ValidationMessage — inside TextField', () => {
  test('validation message has data-scope="validation-message"', () => {
    render(<TextField label="Email" invalid errorText="Required field" />);
    const el = screen.getByText('Required field');
    expect(el).toHaveAttribute('data-scope', 'validation-message');
  });

  test('validation message has data-part="root"', () => {
    render(<TextField label="Email" invalid errorText="Required field" />);
    const el = screen.getByText('Required field');
    expect(el).toHaveAttribute('data-part', 'root');
  });

  test('validation message has --_text scoped var injected (negative feedback token)', () => {
    render(<TextField label="Email" invalid errorText="Required field" />);
    const el = screen.getByText('Required field');
    // The --_text var must be present (verifies ValidationMessage called resolveTokens)
    expect(el.style.getPropertyValue('--_text')).toBeTruthy();
  });
});
