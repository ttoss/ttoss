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
