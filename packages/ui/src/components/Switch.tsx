import { Switch as SwitchUi, type SwitchProps } from 'theme-ui';

export type { SwitchProps };

export const Switch = (props: SwitchProps) => {
  return (
    <SwitchUi
      {...props}
      role="switch"
      aria-checked={props.checked || false}
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
        'input:focus ~ &': {
          outline: 'md',
          outlineColor: 'input.border.accent.default',
          outlineOffset: '0px',
        },
      }}
    />
  );
};
