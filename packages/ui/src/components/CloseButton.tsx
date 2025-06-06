import { Close as CloseUI, type CloseProps as ClosePropsUI } from 'theme-ui';

export type CloseButtonProps = ClosePropsUI & { ariaLabel?: string };

export const CloseButton = (props: CloseButtonProps) => {
  return (
    <CloseUI
      type="button"
      aria-label={props.ariaLabel}
      sx={{
        ...props.sx,
      }}
      {...props}
    />
  );
};
