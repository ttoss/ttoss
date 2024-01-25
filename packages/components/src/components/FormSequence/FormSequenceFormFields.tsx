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
import {
  FormSequenceFormFieldRadioImage,
  FormSequenceFormFieldRadioImageProps,
} from './FormSequenceFormFieldRadioImage';

export type FormSequenceFormFieldsProps =
  | FormSequenceFormFieldRadioProps
  | FormSequenceFormFieldInputProps
  | FormSequenceFormFieldCurrencyProps
  | FormSequenceFormFieldRadioImageProps;

export const FormSequenceFormFields = (props: FormSequenceFormFieldsProps) => {
  if (props.variant === 'radio') {
    return <FormSequenceFormFieldRadio {...props} />;
  }

  if (props.variant === 'input') {
    return <FormSequenceFormFieldInput {...props} />;
  }

  if (props.variant === 'currency') {
    return <FormSequenceFormFieldCurrency {...props} />;
  }

  if (props.variant === 'radio-image') {
    return <FormSequenceFormFieldRadioImage {...props} />;
  }

  return null;
};
