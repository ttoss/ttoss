export type FormSequenceFormFieldsVariant = 'radio' | 'input' | 'currency';

export type FormSequenceFormFieldsBase = {
  type: FormSequenceFormFieldsVariant;
  fieldName: string;
};

export type FormSequenceFlowMessageVariant =
  | 'image-text'
  | 'heading-and-subheading';

export type FormSequenceFlowMessageBase = {
  variant: FormSequenceFlowMessageVariant;
};
