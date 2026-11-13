import * as React from 'react';

import { cn } from './cn';

const VARIANTS = {
  default:
    'oa:bg-primary oa:text-primary-foreground oa:border-transparent oa:hover:bg-primary/90',
  outline:
    'oa:bg-background oa:text-foreground oa:border-border oa:hover:bg-accent',
  ghost:
    'oa:bg-transparent oa:text-foreground oa:border-transparent oa:hover:bg-accent',
  destructive:
    'oa:bg-destructive oa:text-white oa:border-transparent oa:hover:bg-destructive/90',
} as const;

const SIZES = {
  default: 'oa:h-9 oa:px-4',
  sm: 'oa:h-8 oa:px-3 oa:text-xs',
  icon: 'oa:size-8 oa:p-0',
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', type, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        className={cn(
          'oa:inline-flex oa:items-center oa:justify-center oa:gap-2 oa:whitespace-nowrap oa:rounded-md oa:border oa:border-solid oa:text-sm oa:font-medium oa:[font-family:inherit] oa:cursor-pointer oa:transition-colors oa:outline-none oa:focus-visible:ring-2 oa:focus-visible:ring-ring oa:disabled:pointer-events-none oa:disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
