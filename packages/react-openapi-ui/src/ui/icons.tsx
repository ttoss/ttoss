import type * as React from 'react';

const Svg = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'oa:size-4'}
    >
      {children}
    </svg>
  );
};

export const ChevronLeftIcon = () => {
  return (
    <Svg>
      <path d="m15 18-6-6 6-6" />
    </Svg>
  );
};

export const ChevronRightIcon = () => {
  return (
    <Svg>
      <path d="m9 18 6-6-6-6" />
    </Svg>
  );
};

export const SearchIcon = ({ className }: { className?: string }) => {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </Svg>
  );
};

export const RefreshIcon = ({ spinning }: { spinning?: boolean }) => {
  return (
    <Svg className={spinning ? 'oa:size-4 oa:animate-spin' : 'oa:size-4'}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </Svg>
  );
};

export const SortIcon = ({
  direction,
}: {
  direction: 'asc' | 'desc' | null;
}) => {
  return (
    <Svg className="oa:size-3.5 oa:shrink-0">
      {direction === 'asc' && <path d="m18 15-6-6-6 6" />}
      {direction === 'desc' && <path d="m6 9 6 6 6-6" />}
      {direction === null && (
        <>
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </>
      )}
    </Svg>
  );
};
