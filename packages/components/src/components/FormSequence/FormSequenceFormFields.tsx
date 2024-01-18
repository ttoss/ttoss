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
  | FormSequenceFormFieldInputProps;

export const FormSequenceFormFields = (props: FormSequenceFormFieldsProps) => {
  if (props.type === 'radio') {
    return <FormSequenceFormFieldRadio {...props} />;
  }

  if (props.type === 'input') {
    return <FormSequenceFormFieldInput {...props} />;
  }

  return null;
};
