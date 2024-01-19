import {
  FormSequenceFlowMessageImageText,
  FormSequenceFlowMessageImageTextProps,
} from './FormSequenceFlowMessageImageText';

export type FormSequenceFlowMessageProps =
  FormSequenceFlowMessageImageTextProps;

export const FormSequenceFlowMessage = (
  props: FormSequenceFlowMessageProps
) => {
  if (props.variant === 'image-text') {
    return <FormSequenceFlowMessageImageText {...props} />;
  }

  return null;
};
