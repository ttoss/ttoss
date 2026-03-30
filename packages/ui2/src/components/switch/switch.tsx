import {
  Switch as ArkSwitch,
  type SwitchRootProps,
} from '@ark-ui/react/switch';
import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Props for the Switch component.
 *
 * Responsibility: Selection
 * Semantic tokens: input.muted.* (off), action.primary.* (on)
 */
export interface SwitchProps extends SwitchRootProps {
  /** Label text displayed next to the switch. */
  label?: string;
}

/**
 * Accessible switch/toggle component built on Ark UI.
 *
 * Responsibility: **Selection** — toggling between two states.
 *
 * @example
 * ```tsx
 * <Switch label="Dark mode" onCheckedChange={(d) => console.log(d.checked)} />
 * ```
 */
export const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <ArkSwitch.Root
        ref={ref}
        className={cn('ui2-switch', className)}
        {...props}
      >
        <ArkSwitch.Control className="ui2-switch__control">
          <ArkSwitch.Thumb className="ui2-switch__thumb" />
        </ArkSwitch.Control>
        {label && (
          <ArkSwitch.Label className="ui2-switch__label">
            {label}
          </ArkSwitch.Label>
        )}
        <ArkSwitch.HiddenInput />
      </ArkSwitch.Root>
    );
  }
);

Switch.displayName = 'Switch';
