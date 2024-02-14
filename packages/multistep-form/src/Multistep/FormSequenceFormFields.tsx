import {
  MultistepFormFieldCurrency,
  MultistepFormFieldCurrencyProps,
} from './MultistepFormFieldCurrency';
import {
  MultistepFormFieldInput,
  MultistepFormFieldInputProps,
} from './MultistepFormFieldInput';
import {
  MultistepFormFieldRadio,
  MultistepFormFieldRadioProps,
} from './MultistepFormFieldRadio';
import {
  MultistepFormFieldRadioImage,
  MultistepFormFieldRadioImageProps,
} from './MultistepFormFieldRadioImage';

export type MultistepFormFieldsProps =
  | MultistepFormFieldRadioProps
  | MultistepFormFieldInputProps
  | MultistepFormFieldCurrencyProps
  | MultistepFormFieldRadioImageProps;

export const MultistepFormFields = (props: MultistepFormFieldsProps) => {
  if (props.variant === 'radio') {
    return <MultistepFormFieldRadio {...props} />;
  }

  if (props.variant === 'input') {
    return <MultistepFormFieldInput {...props} />;
  }

  if (props.variant === 'currency') {
    return <MultistepFormFieldCurrency {...props} />;
  }

  if (props.variant === 'radio-image') {
    return <MultistepFormFieldRadioImage {...props} />;
  }

  return null;
};
