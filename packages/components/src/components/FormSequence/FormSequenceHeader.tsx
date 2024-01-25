import {
  FormSequenceHeaderLogo,
  type FormSequenceHeaderLogoProps,
} from './FormSequenceHeaderLogo';
import {
  FormSequenceHeaderTitled,
  type FormSequenceHeaderTitledProps,
} from './FormSequenceHeaderTitled';

export type FormSequenceHeaderProps =
  | FormSequenceHeaderLogoProps
  | FormSequenceHeaderTitledProps;

export const FormSequenceHeader = (props: FormSequenceHeaderProps) => {
  if (props.variant === 'logo') {
    return <FormSequenceHeaderLogo {...props} />;
  }
  if (props.variant === 'titled') {
    return <FormSequenceHeaderTitled {...props} />;
  }

  return null;
};
