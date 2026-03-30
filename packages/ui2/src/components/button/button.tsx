import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Props for the Button component.
 *
 * Responsibility: Action
 * Semantic tokens: action.{role}.{dimension}.{state}
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant mapped to semantic token roles.
   * - solid: action.primary (default)
   * - outline: action.secondary
   * - ghost: action.secondary (transparent bg)
   * - danger: action.negative
   * @default 'solid'
   */
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
  /**
   * Size of the button.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Accessible button component.
 *
 * Responsibility: **Action** — triggers actions or commands.
 *
 * @example
 * ```tsx
 * <Button variant="solid" size="md" onClick={handleSave}>
 *   Save
 * </Button>
 * ```
 *
 * @example
 * ```tsx
 * <Button variant="outline" size="sm">
 *   Cancel
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'solid', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('ui2-button', className)}
        data-variant={variant}
        data-size={size}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
