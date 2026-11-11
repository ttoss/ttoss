import type * as React from 'react';

import { cn } from './cn';

export const Table = ({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => {
  return (
    <div className="oa:relative oa:w-full oa:overflow-x-auto oa:rounded-md oa:border oa:border-solid oa:border-border oa:bg-background">
      <table
        className={cn(
          'oa:w-full oa:border-collapse oa:caption-bottom oa:text-sm',
          className
        )}
        {...props}
      />
    </div>
  );
};

export const TableHeader = (
  props: React.HTMLAttributes<HTMLTableSectionElement>
) => {
  return <thead className="oa:bg-muted/50" {...props} />;
};

export const TableBody = (
  props: React.HTMLAttributes<HTMLTableSectionElement>
) => {
  return <tbody {...props} />;
};

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr
      className={cn(
        'oa:border-0 oa:border-b oa:border-solid oa:border-border oa:transition-colors oa:last:border-b-0',
        className
      )}
      {...props}
    />
  );
};

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th
      className={cn(
        'oa:h-10 oa:px-3 oa:text-left oa:align-middle oa:font-medium oa:text-muted-foreground oa:whitespace-nowrap',
        className
      )}
      {...props}
    />
  );
};

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      className={cn('oa:px-3 oa:py-2.5 oa:align-middle', className)}
      {...props}
    />
  );
};

export const Skeleton = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn('oa:animate-pulse oa:rounded-md oa:bg-muted', className)}
    />
  );
};
