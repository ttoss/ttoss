import * as React from 'react';

import { cn } from './cn';

const CONTROL =
  'oa:box-border oa:w-full oa:rounded-md oa:border oa:border-solid oa:border-input oa:bg-background oa:px-3 oa:text-sm oa:text-foreground oa:[font-family:inherit] oa:shadow-xs oa:outline-none oa:placeholder:text-muted-foreground oa:focus-visible:ring-2 oa:focus-visible:ring-ring oa:disabled:cursor-not-allowed oa:disabled:opacity-50 oa:aria-invalid:border-destructive oa:aria-invalid:ring-destructive/30';

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    // The caller passes `htmlFor`; a generic wrapper cannot show it statically.
    // eslint-disable-next-line jsx-a11y-x/label-has-associated-control
    <label
      className={cn(
        'oa:text-sm oa:font-medium oa:leading-none oa:text-foreground',
        className
      )}
      {...props}
    />
  );
};

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(CONTROL, 'oa:min-h-20 oa:py-2 oa:resize-y', className)}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(CONTROL, 'oa:h-9 oa:py-1 oa:cursor-pointer', className)}
      {...props}
    />
  );
});

Select.displayName = 'Select';

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'oa:m-0 oa:size-4 oa:shrink-0 oa:cursor-pointer oa:accent-primary',
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';

export const controlClassName = CONTROL;

export const Alert = ({
  tone = 'danger',
  title,
  children,
}: {
  tone?: 'danger' | 'success';
  title?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'oa:flex oa:flex-col oa:gap-1 oa:rounded-md oa:border oa:border-solid oa:px-4 oa:py-3 oa:text-sm',
        tone === 'danger'
          ? 'oa:border-red-200 oa:bg-red-50 oa:text-red-800'
          : 'oa:border-emerald-200 oa:bg-emerald-50 oa:text-emerald-800'
      )}
    >
      {title && <span className="oa:font-medium">{title}</span>}
      {children && <span className="oa:opacity-90">{children}</span>}
    </div>
  );
};
