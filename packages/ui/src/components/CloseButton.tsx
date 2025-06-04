import { Close as CloseUI, type CloseProps as ClosePropsUI } from 'theme-ui';

export type CloseButtonProps = ClosePropsUI;

export const CloseButton = (props: CloseButtonProps) => {
  return (
    <CloseUI
      type="button"
      sx={{
        ...props.sx,
      }}
      {...props}
    />
  );
};
