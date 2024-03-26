import './i18n';

export { yupResolver } from '@hookform/resolvers/yup';
export * as yup from 'yup';

export { Form } from './Form';
export { FormField } from './FormField';
export { FormFieldCheckbox } from './FormFieldCheckbox';
export { FormFieldCreditCardNumber } from './FormFieldCreditCardNumber';
export { FormFieldNumericFormat } from './FormFieldNumericFormat';
export { FormFieldPatternFormat } from './FormFieldPatternFormat';
export { FormFieldCurrencyInput } from './FormFieldCurrencyInput';
export { FormFieldInput } from './FormFieldInput';
export { FormFieldPassword } from './FormFieldPassword';
export { FormFieldRadio } from './FormFieldRadio';
export { FormFieldSelect } from './FormFieldSelect';
export { FormFieldTextarea } from './FormFieldTextarea';
export { FormGroup, useFormGroup } from './FormGroup';
export { FormFieldCNPJ } from './Brazil/FormFieldCNPJ';
export { FormFieldPhone } from './Brazil/FormFieldPhone';
export { FormFieldCEP } from './Brazil/FormFieldCEP';

/**
 * Export everything from react-hook-form without using export *
 * https://github.com/evanw/esbuild/issues/1737
 */
export {
  useForm,
  useFormContext,
  useWatch,
  useFieldArray,
  useController,
  useFormState,
  Controller,
  FormProvider,
} from 'react-hook-form';

// Export types
export * from 'react-hook-form';
