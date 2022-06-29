import { type ButtonProps, Button as ButtonUi } from 'theme-ui';

export type { ButtonProps };

export const Button = (props: ButtonProps) => {
  return (
    <ButtonUi
      {...props}
      sx={{ cursor: 'pointer', fontFamily: 'body', ...props.sx }}
    />
  );
};
