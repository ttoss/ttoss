import { Portal } from '@ark-ui/react/portal';
import {
  Tooltip as ArkTooltip,
  type TooltipRootProps,
} from '@ark-ui/react/tooltip';
import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Props for the Tooltip component.
 *
 * Responsibility: Overlay
 * Semantic tokens: content.primary.* (inverted)
 */
export interface TooltipProps extends TooltipRootProps {
  /** The tooltip content text. */
  content: string;
  /** The trigger element. */
  children: React.ReactElement;
  /** Additional CSS class for the tooltip content. */
  className?: string;
}

/**
 * Accessible tooltip component built on Ark UI.
 *
 * Responsibility: **Overlay** — temporary layered UI for contextual information.
 *
 * @example
 * ```tsx
 * <Tooltip content="More information">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, className, ...props }, ref) => {
    return (
      <ArkTooltip.Root openDelay={300} closeDelay={100} {...props}>
        <ArkTooltip.Trigger asChild>{children}</ArkTooltip.Trigger>
        <Portal>
          <ArkTooltip.Positioner className="ui2-tooltip__positioner">
            <ArkTooltip.Content
              ref={ref}
              className={cn('ui2-tooltip__content', className)}
            >
              {content}
            </ArkTooltip.Content>
          </ArkTooltip.Positioner>
        </Portal>
      </ArkTooltip.Root>
    );
  }
);
Tooltip.displayName = 'Tooltip';
