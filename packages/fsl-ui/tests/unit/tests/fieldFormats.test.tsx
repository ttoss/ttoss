/**
 * Field formats (forms item H, ADR-026) — the registry, the mask engine, and
 * the TextField integration.
 *
 * The engine's hard cases are deletion-over-a-literal (the classic
 * masked-input trap: remasking re-inserts the literal and the field is
 * stuck) and caret stability when the mask inserts a literal to the caret's
 * left — both are pinned here, because they are exactly the behaviours a
 * refactor would lose silently.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  fieldFormatCaret,
  fieldFormatInputProps,
  nextFieldFormatValue,
} from 'src/components/Field/formats';
import {
  applyFieldFormat,
  FIELD_FORMATS,
  Form,
  FormSubmit,
  TextField,
} from 'src/index';

describe('the registry', () => {
  test('every format resolves a keyboard (the half that silently drifts)', () => {
    for (const format of FIELD_FORMATS) {
      expect(['numeric', 'tel']).toContain(
        fieldFormatInputProps(format).inputMode
      );
    }
  });

  test.each([
    ['br.cep', '01310100', '01310-100'],
    ['br.cpf', '12345678901', '123.456.789-01'],
    ['br.cnpj', '12345678000195', '12.345.678/0001-95'],
    ['br.phone', '1123456789', '(11) 2345-6789'],
    ['br.phone', '11912345678', '(11) 91234-5678'],
  ] as const)('%s masks %s → %s', (format, digits, masked) => {
    expect(applyFieldFormat(format, digits)).toBe(masked);
  });

  test('paste accepts any punctuation and overflow digits are dropped', () => {
    expect(applyFieldFormat('br.cpf', '123.456.789-01999')).toBe(
      '123.456.789-01'
    );
    expect(applyFieldFormat('br.cep', ' 01310—100 ')).toBe('01310-100');
  });

  test('the phone mask switches as the eleventh digit arrives', () => {
    expect(applyFieldFormat('br.phone', '1191234567')).toBe('(11) 9123-4567');
    expect(applyFieldFormat('br.phone', '11912345678')).toBe('(11) 91234-5678');
  });
});

describe('the engine hard cases', () => {
  test('backspacing over a literal deletes the digit before it', () => {
    // User had "01310-1", caret after the "-1", backspaces the "1" → "01310-",
    // then backspaces again: only the literal "-" is removed, digits intact —
    // without the rule, remasking re-inserts "-" and the field is stuck.
    const { value, caret } = nextFieldFormatValue({
      format: 'br.cep',
      raw: '01310',
      rawCaret: 5,
      previous: '01310-',
    });
    expect(value).toBe('0131');
    expect(caret).toBe(4);
  });

  test('the caret counts digits, not characters', () => {
    // Six digits typed into a CPF: "123.456" — caret sits after the 6th digit
    // (index 7, past the literal the mask inserted to its left).
    expect(
      fieldFormatCaret({ masked: '123.456', raw: '123456', rawCaret: 6 })
    ).toBe(7);
    // Caret at the very start stays at 0.
    expect(
      fieldFormatCaret({ masked: '123.456', raw: '123456', rawCaret: 0 })
    ).toBe(0);
  });
});

describe('TextField integration', () => {
  test('typing masks as it goes, and the submitted value is the masked one', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).get('cep');
    });

    render(
      <Form onSubmit={onSubmit}>
        <TextField label="CEP" name="cep" format="br.cep" />
        <FormSubmit>Save</FormSubmit>
      </Form>
    );

    const input = screen.getByRole('textbox', { name: 'CEP' });
    await user.type(input, '01310100');
    expect(input).toHaveValue('01310-100');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveReturnedWith('01310-100');
  });

  test('the format resolves the keyboard and the autofill token on the control', () => {
    render(<TextField label="CEP" name="cep" format="br.cep" />);

    const input = screen.getByRole('textbox', { name: 'CEP' });
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'postal-code');
  });

  test('a defaultValue arrives already masked', () => {
    render(
      <TextField
        label="CPF"
        name="cpf"
        format="br.cpf"
        defaultValue="12345678901"
      />
    );

    expect(screen.getByRole('textbox', { name: 'CPF' })).toHaveValue(
      '123.456.789-01'
    );
  });

  test('a controlled value is masked on render and reported masked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <TextField
        label="Phone"
        name="phone"
        format="br.phone"
        value="11912345678"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Phone' });
    expect(input).toHaveValue('(11) 91234-5678');

    await user.type(input, '9', {
      initialSelectionStart: 15,
      initialSelectionEnd: 15,
    });
    // Full at 11 digits — the extra digit is dropped and reported masked.
    expect(onChange).toHaveBeenLastCalledWith('(11) 91234-5678');
  });

  test('validation stays the caller. A CPF checksum is not shipped (ADR-001)', async () => {
    const user = userEvent.setup();

    render(
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <TextField
          label="CPF"
          name="cpf"
          format="br.cpf"
          validate={(value) => {
            return value.length === 14 ? null : 'CPF incompleto.';
          }}
        />
        <FormSubmit>Save</FormSubmit>
      </Form>
    );

    await user.type(screen.getByRole('textbox', { name: 'CPF' }), '123');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      document.querySelector(
        '[data-scope="text-field"][data-part="validationMessage"]'
      )
    ).toHaveTextContent('CPF incompleto.');
  });
});
