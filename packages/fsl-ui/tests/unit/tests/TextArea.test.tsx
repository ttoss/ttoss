/**
 * TextArea — multiline Input composite.
 *
 * Verifies it renders a <textarea> wired to its label, accepts input, and
 * surfaces the invalid State on the control when the field is invalid.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  TextArea,
  TextAreaControl,
  TextAreaError,
  TextAreaLabel,
} from 'src/index';

describe('TextArea', () => {
  test('renders a labelled textarea', () => {
    render(
      <TextArea>
        <TextAreaLabel>Notes</TextAreaLabel>
        <TextAreaControl />
      </TextArea>
    );
    const control = screen.getByRole('textbox', { name: 'Notes' });
    expect(control.tagName.toLowerCase()).toBe('textarea');
    expect(control.style.resize).toBe('vertical');
  });

  test('accepts multiline input', async () => {
    const user = userEvent.setup();
    render(
      <TextArea>
        <TextAreaLabel>Notes</TextAreaLabel>
        <TextAreaControl />
      </TextArea>
    );
    const control = screen.getByRole('textbox', { name: 'Notes' });
    await user.type(control, 'line one');
    expect(control).toHaveValue('line one');
  });

  test('surfaces the invalid State on the control', () => {
    render(
      <TextArea isInvalid>
        <TextAreaLabel>Notes</TextAreaLabel>
        <TextAreaControl />
        <TextAreaError>Required</TextAreaError>
      </TextArea>
    );
    const control = screen.getByRole('textbox', { name: 'Notes' });
    expect(control.style.borderColor).toBe(
      vars.colors.input.primary.border?.invalid
    );
  });

  test('sub-parts throw when rendered outside a TextArea', () => {
    // Presence-scope guard: a detached label is a programming error.
    expect(() => {
      return render(<TextAreaLabel>x</TextAreaLabel>);
    }).toThrow(/must be rendered inside <TextArea>/);
  });
});
