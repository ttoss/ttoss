import { Switch as SwitchUi, type SwitchProps } from 'theme-ui';

export const Switch = (props: SwitchProps) => {
  return (
    <SwitchUi
      {...props}
      sx={{
        backgroundColor: 'input.background.muted.default',
        'input:checked ~ &': {
          backgroundColor: 'input.background.secondary.default',
        },
        'input ~ & > div': {
          backgroundColor: 'input.background.primary.default',
        },
        'input:checked ~ & > div': {
          backgroundColor: 'input.background.accent.default',
        },
      }}
    />
  );
};
