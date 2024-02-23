import {
  MultistepFlowMessageImageText,
  MultistepFlowMessageImageTextProps,
} from './MultistepFlowMessageImageText';

export type MultistepFlowMessageProps = MultistepFlowMessageImageTextProps;

export const MultistepFlowMessage = (props: MultistepFlowMessageProps) => {
  if (props.variant === 'image-text') {
    return <MultistepFlowMessageImageText {...props} />;
  }

  return null;
};
