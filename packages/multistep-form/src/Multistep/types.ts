export type MultistepFormFieldsVariant =
  | 'radio'
  | 'input'
  | 'currency'
  | 'radio-image';

export type MultistepFormFieldsBase = {
  variant: MultistepFormFieldsVariant;
  fieldName: string;
};

export type MultistepFlowMessageVariant =
  | 'image-text'
  | 'heading-and-subheading';

export type MultistepFlowMessageBase = {
  variant: MultistepFlowMessageVariant;
};

type MultistepHeaderVariant = 'logo' | 'titled';

export type BaseMultistepHeaderProps = {
  variant: MultistepHeaderVariant;
};
