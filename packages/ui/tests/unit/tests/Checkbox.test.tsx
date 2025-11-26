import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import * as React from 'react';

import { Checkbox } from '../../../src';

describe('Checkbox component', () => {
  test('renders checkbox', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  test('handles checked state', () => {
    render(<Checkbox defaultChecked />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox).toBeChecked();
  });

  test('handles indeterminate state', () => {
    render(<Checkbox indeterminate />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.indeterminate).toBe(true);

    fireEvent.click(checkbox);

    expect(checkbox.indeterminate).toBe(false);
  });

  test('forwards ref to checkbox element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox ref={ref} name="test-checkbox" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.name).toBe('test-checkbox');
  });

  test('forwards callback ref to checkbox element', () => {
    let refValue: HTMLInputElement | null = null;
    const callbackRef = (el: HTMLInputElement | null) => {
      refValue = el;
    };

    render(<Checkbox ref={callbackRef} name="callback-checkbox" />);

    expect(refValue).toBeInstanceOf(HTMLInputElement);
    expect(refValue?.name).toBe('callback-checkbox');
  });
});
