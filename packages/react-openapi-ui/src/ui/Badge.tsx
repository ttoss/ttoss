import type * as React from 'react';

import type { StatusTone } from '../core/table';
import { cn } from './cn';

const TONES: Record<StatusTone, string> = {
  neutral: 'oa:bg-muted oa:text-muted-foreground oa:border-border',
  success: 'oa:bg-emerald-50 oa:text-emerald-700 oa:border-emerald-200',
  danger: 'oa:bg-red-50 oa:text-red-700 oa:border-red-200',
  warning: 'oa:bg-amber-50 oa:text-amber-800 oa:border-amber-200',
  info: 'oa:bg-sky-50 oa:text-sky-700 oa:border-sky-200',
};

export const Badge = ({
  tone = 'neutral',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: StatusTone }) => {
  return (
    <span
      className={cn(
        'oa:inline-flex oa:items-center oa:rounded-full oa:border oa:border-solid oa:px-2 oa:py-0.5 oa:text-xs oa:font-medium oa:whitespace-nowrap',
        TONES[tone],
        className
      )}
      {...props}
    />
  );
};
