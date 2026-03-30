import {
  Checkbox as ArkCheckbox,
  type CheckboxRootProps,
} from '@ark-ui/react/checkbox';
import * as React from 'react';

import { cn } from '../../_shared/cn';
import { CheckIcon } from '../../_shared/icons';

/**
 * Props for the Checkbox component.
 *
 * Responsibility: Selection
 * Semantic tokens: input.primary.*, action.primary.* (checked state)
 */
export interface CheckboxProps extends CheckboxRootProps {
  /** Label text displayed next to the checkbox. */
  label?: string;
}

/**
 * Accessible checkbox component built on Ark UI.
 *
 * Responsibility: **Selection** — choosing one or more options.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" onCheckedChange={(d) => console.log(d.checked)} />
 * ```
 */
export const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <ArkCheckbox.Root
        ref={ref}
        className={cn('ui2-checkbox', className)}
        {...props}
      >
        <ArkCheckbox.Control className="ui2-checkbox__control">
          <ArkCheckbox.Indicator className="ui2-checkbox__indicator">
            <CheckIcon />
          </ArkCheckbox.Indicator>
        </ArkCheckbox.Control>
        {label && (
          <ArkCheckbox.Label className="ui2-checkbox__label">
            {label}
          </ArkCheckbox.Label>
        )}
        <ArkCheckbox.HiddenInput />
      </ArkCheckbox.Root>
    );
  }
);

Checkbox.displayName = 'Checkbox';
