/**
 * ColorField — Input-entity colour-entry control.
 *
 * Verifies the swatch + hex inputs share one value, derive accessible names
 * from `label`, propagate changes, and the swatch coerces to a valid hex while
 * the text field preserves the authored string.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { ColorField } from 'src/index';

describe('ColorField', () => {
  test('renders a swatch and hex input named from the label', () => {
    render(
      <ColorField label="brand 500" value="#0469e3" onChange={() => {}} />
    );
    const swatch = screen.getByLabelText('brand 500 color') as HTMLInputElement;
    const hex = screen.getByLabelText('brand 500 hex') as HTMLInputElement;
    expect(swatch.type).toBe('color');
    expect(swatch.value).toBe('#0469e3');
    expect(hex.value).toBe('#0469e3');
  });

  test('the swatch coerces a non-hex value; the text field keeps it verbatim', () => {
    render(
      <ColorField
        label="brand 500"
        value="{core.colors.brand.500}"
        onChange={() => {}}
      />
    );
    // Swatch cannot show a ref → safe fallback.
    expect(
      (screen.getByLabelText('brand 500 color') as HTMLInputElement).value
    ).toBe('#000000');
    // Text field preserves the authored ref (never clobbered).
    expect(
      (screen.getByLabelText('brand 500 hex') as HTMLInputElement).value
    ).toBe('{core.colors.brand.500}');
  });

  test('both inputs propagate changes through onChange', () => {
    const onChange = jest.fn();
    render(
      <ColorField label="brand 500" value="#000000" onChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText('brand 500 hex'), {
      target: { value: '#abcdef' },
    });
    expect(onChange).toHaveBeenCalledWith('#abcdef');
    fireEvent.change(screen.getByLabelText('brand 500 color'), {
      target: { value: '#123456' },
    });
    expect(onChange).toHaveBeenCalledWith('#123456');
  });

  test('applies the id to the hex text input', () => {
    render(
      <ColorField
        label="brand 500"
        value="#000000"
        onChange={() => {}}
        id="brand-500"
      />
    );
    expect(screen.getByLabelText('brand 500 hex')).toHaveAttribute(
      'id',
      'brand-500'
    );
  });
});
