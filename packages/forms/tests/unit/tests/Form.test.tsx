import { I18nProvider } from '@ttoss/react-i18n';
import { render, screen } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import { FormFieldCEP, FormFieldCNPJ, FormFieldPhone } from 'src/Brazil';
import {
  Form,
  FormFieldCheckbox,
  FormFieldCreditCardNumber,
  FormFieldCurrencyInput,
  FormFieldInput,
  FormFieldNumericFormat,
  FormFieldPassword,
  FormFieldPatternFormat,
  FormFieldRadio,
  FormFieldRadioCard,
  FormFieldRadioCardIcony,
  FormFieldSelect,
  FormFieldSwitch,
  FormFieldTextarea,
  useForm,
} from 'src/index';

describe('Form disabled state - All FormField components', () => {
  test('should disable all FormField components when useForm has disabled set to true', () => {
    const onSubmit = jest.fn();

    const RenderFormWithAllFields = () => {
      const formMethods = useForm({
        disabled: true,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="input" label="Input" />
          <FormFieldTextarea name="textarea" label="Textarea" />
          <FormFieldPassword name="password" label="Password" />
          <FormFieldSelect
            name="select"
            label="Select"
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]}
          />
          <FormFieldCheckbox name="checkbox" label="Checkbox" />
          <FormFieldSwitch name="switch" label="Switch" />
          <FormFieldRadio
            name="radio"
            label="Radio"
            options={[
              { value: 'radio1', label: 'Radio 1' },
              { value: 'radio2', label: 'Radio 2' },
            ]}
          />
          <FormFieldRadioCard
            name="radioCard"
            label="Radio Card"
            options={[
              { value: 'card1', label: 'Card 1' },
              { value: 'card2', label: 'Card 2' },
            ]}
          />
          <FormFieldRadioCardIcony
            name="radioCardIcony"
            label="Radio Card Icony"
            options={[
              { value: 'icony1', label: 'Icony 1' },
              { value: 'icony2', label: 'Icony 2' },
            ]}
          />
          <FormFieldNumericFormat name="numeric" label="Numeric" />
          <FormFieldPatternFormat
            name="pattern"
            label="Pattern"
            format="##-##-##"
          />
          <FormFieldCurrencyInput name="currency" label="Currency" prefix="$" />
          <FormFieldCreditCardNumber
            name="creditCard"
            label="Credit Card"
            format="#### #### #### ####"
          />
          <FormFieldCEP name="cep" label="CEP" />
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <FormFieldPhone name="phone" label="Phone" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(
      <I18nProvider>
        <RenderFormWithAllFields />
      </I18nProvider>
    );

    // Verify all fields are disabled
    expect(screen.getByLabelText('Input')).toBeDisabled();
    expect(screen.getByLabelText('Textarea')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();

    // Select component - react-select doesn't use standard disabled attribute
    // We'll skip testing Select's disabled state in this comprehensive test

    expect(screen.getByLabelText('Checkbox')).toBeDisabled();
    expect(screen.getByLabelText('Switch')).toBeDisabled();

    // Radio buttons - each option has the same label but different values
    const radioInputs = screen.getAllByRole('radio');
    for (const radio of radioInputs) {
      expect(radio).toBeDisabled();
    }

    expect(screen.getByLabelText('Numeric')).toBeDisabled();
    expect(screen.getByLabelText('Pattern')).toBeDisabled();
    expect(screen.getByLabelText('Currency')).toBeDisabled();
    expect(screen.getByLabelText('Credit Card')).toBeDisabled();
    expect(screen.getByLabelText('CEP')).toBeDisabled();
    expect(screen.getByLabelText('CNPJ')).toBeDisabled();
    expect(screen.getByLabelText('Phone')).toBeDisabled();
  });

  test('should enable all FormField components when useForm has disabled set to false', () => {
    const onSubmit = jest.fn();

    const RenderFormWithAllFieldsEnabled = () => {
      const formMethods = useForm({
        disabled: false,
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="input" label="Input" />
          <FormFieldTextarea name="textarea" label="Textarea" />
          <FormFieldPassword name="password" label="Password" />
          <FormFieldSelect
            name="select"
            label="Select"
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ]}
          />
          <FormFieldCheckbox name="checkbox" label="Checkbox" />
          <FormFieldSwitch name="switch" label="Switch" />
          <FormFieldRadio
            name="radio"
            label="Radio"
            options={[
              { value: 'radio1', label: 'Radio 1' },
              { value: 'radio2', label: 'Radio 2' },
            ]}
          />
          <FormFieldRadioCard
            name="radioCard"
            label="Radio Card"
            options={[
              { value: 'card1', label: 'Card 1' },
              { value: 'card2', label: 'Card 2' },
            ]}
          />
          <FormFieldRadioCardIcony
            name="radioCardIcony"
            label="Radio Card Icony"
            options={[
              { value: 'icony1', label: 'Icony 1' },
              { value: 'icony2', label: 'Icony 2' },
            ]}
          />
          <FormFieldNumericFormat name="numeric" label="Numeric" />
          <FormFieldPatternFormat
            name="pattern"
            label="Pattern"
            format="##-##-##"
          />
          <FormFieldCurrencyInput name="currency" label="Currency" prefix="$" />
          <FormFieldCreditCardNumber
            name="creditCard"
            label="Credit Card"
            format="#### #### #### ####"
          />
          <FormFieldCEP name="cep" label="CEP" />
          <FormFieldCNPJ name="cnpj" label="CNPJ" />
          <FormFieldPhone name="phone" label="Phone" />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(
      <I18nProvider>
        <RenderFormWithAllFieldsEnabled />
      </I18nProvider>
    );

    // Verify all fields are enabled
    expect(screen.getByLabelText('Input')).not.toBeDisabled();
    expect(screen.getByLabelText('Textarea')).not.toBeDisabled();
    expect(screen.getByLabelText('Password')).not.toBeDisabled();

    // Select component uses react-select which has a different structure
    const selectInput = screen.getByRole('combobox');
    expect(selectInput).not.toBeDisabled();

    expect(screen.getByLabelText('Checkbox')).not.toBeDisabled();
    expect(screen.getByLabelText('Switch')).not.toBeDisabled();

    const radioInputs = screen.getAllByRole('radio');
    for (const radio of radioInputs) {
      expect(radio).not.toBeDisabled();
    }

    expect(screen.getByLabelText('Numeric')).not.toBeDisabled();
    expect(screen.getByLabelText('Pattern')).not.toBeDisabled();
    expect(screen.getByLabelText('Currency')).not.toBeDisabled();
    expect(screen.getByLabelText('Credit Card')).not.toBeDisabled();
    expect(screen.getByLabelText('CEP')).not.toBeDisabled();
    expect(screen.getByLabelText('CNPJ')).not.toBeDisabled();
    expect(screen.getByLabelText('Phone')).not.toBeDisabled();
  });

  test('should allow individual fields to override form disabled state', () => {
    const onSubmit = jest.fn();

    const RenderMixedForm = () => {
      const formMethods = useForm({
        disabled: true, // Form is disabled
      });

      return (
        <Form {...formMethods} onSubmit={onSubmit}>
          <FormFieldInput name="disabled1" label="Disabled Input" />
          <FormFieldInput
            name="enabled1"
            label="Enabled Input"
            disabled={false}
          />
          <FormFieldCheckbox name="disabled2" label="Disabled Checkbox" />
          <FormFieldCheckbox
            name="enabled2"
            label="Enabled Checkbox"
            disabled={false}
          />
          <Button type="submit">Submit</Button>
        </Form>
      );
    };

    render(<RenderMixedForm />);

    // Disabled fields should remain disabled
    expect(screen.getByLabelText('Disabled Input')).toBeDisabled();
    expect(screen.getByLabelText('Disabled Checkbox')).toBeDisabled();

    // Explicitly enabled fields should be enabled even though form is disabled
    expect(screen.getByLabelText('Enabled Input')).not.toBeDisabled();
    expect(screen.getByLabelText('Enabled Checkbox')).not.toBeDisabled();
  });
});
