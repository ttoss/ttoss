export type FormSequenceFormFieldsVariant =
  | 'radio'
  | 'input'
  | 'currency'
  | 'radio-image';

export type FormSequenceFormFieldsBase = {
  variant: FormSequenceFormFieldsVariant;
  fieldName: string;
};

export type FormSequenceFlowMessageVariant =
  | 'image-text'
  | 'heading-and-subheading';

export type FormSequenceFlowMessageBase = {
  variant: FormSequenceFlowMessageVariant;
};

type FormSequenceHeaderVariant = 'logo' | 'titled';

export type BaseFormSequenceHeaderProps = {
  variant: FormSequenceHeaderVariant;
};
