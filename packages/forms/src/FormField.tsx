import { FormFieldCheckbox } from './FormFieldCheckbox';
import { FormFieldInput } from './FormFieldInput';
import { FormFieldRadio } from './FormFieldRadio';
import { FormFieldSelect } from './FormFieldSelect';

/**
 * DEPRECATED: Use `FormFieldInput` instead.
 */
const FormField = () => {
  // to be implemented
  return null;
};

FormField.Input = FormFieldInput;
FormField.Radio = FormFieldRadio;
FormField.Select = FormFieldSelect;
FormField.Checkbox = FormFieldCheckbox;

export { FormField };
