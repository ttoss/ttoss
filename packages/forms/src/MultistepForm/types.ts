export type MultistepFlowMessageVariant =
  | 'image-text'
  | 'heading-and-subheading';

export type MultistepFlowMessageBase = {
  variant: MultistepFlowMessageVariant;
};
