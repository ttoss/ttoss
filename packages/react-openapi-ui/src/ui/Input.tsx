import * as React from 'react';

import { cn } from './cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'oa:box-border oa:flex oa:h-9 oa:w-full oa:rounded-md oa:border oa:border-solid oa:border-input oa:bg-background oa:px-3 oa:py-1 oa:text-sm oa:text-foreground oa:[font-family:inherit] oa:shadow-xs oa:outline-none oa:placeholder:text-muted-foreground oa:focus-visible:ring-2 oa:focus-visible:ring-ring oa:disabled:cursor-not-allowed oa:disabled:opacity-50 oa:aria-invalid:border-destructive oa:aria-invalid:ring-destructive/30',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
