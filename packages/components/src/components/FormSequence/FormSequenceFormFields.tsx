import {
  FormSequenceFormFieldCurrency,
  FormSequenceFormFieldCurrencyProps,
} from './FormSequenceFormFieldCurrency';
import {
  FormSequenceFormFieldInput,
  FormSequenceFormFieldInputProps,
} from './FormSequenceFormFieldInput';
import {
  FormSequenceFormFieldRadio,
  FormSequenceFormFieldRadioProps,
} from './FormSequenceFormFieldRadio';

export type FormSequenceFormFieldsProps =
  | FormSequenceFormFieldRadioProps
  | FormSequenceFormFieldInputProps
  | FormSequenceFormFieldCurrencyProps;

export const FormSequenceFormFields = (props: FormSequenceFormFieldsProps) => {
  if (props.type === 'radio') {
    return <FormSequenceFormFieldRadio {...props} />;
  }

  if (props.type === 'input') {
    return <FormSequenceFormFieldInput {...props} />;
  }

  if (props.type === 'currency') {
    return <FormSequenceFormFieldCurrency {...props} />;
  }

  return null;
};
