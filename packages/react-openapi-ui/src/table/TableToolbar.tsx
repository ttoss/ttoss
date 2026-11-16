import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import { humanizeKey, statusTone } from '../core/table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { RefreshIcon, SearchIcon } from '../ui/icons';
import { Input } from '../ui/Input';
import { messages } from './messages';

export const TableToolbar = ({
  search,
  statusFilter,
  fetching,
  onRefresh,
  actions,
}: {
  search?: { value: string; onChange: (value: string) => void };
  statusFilter?: {
    field: string;
    options: string[];
    value: string | null;
    onChange: (value: string | null) => void;
  };
  fetching: boolean;
  onRefresh: () => void;
  actions?: React.ReactNode;
}) => {
  const { intl } = useI18n();

  const chip = ({
    value,
    label,
    tone,
  }: {
    value: string | null;
    label: string;
    tone: Parameters<typeof Badge>[0]['tone'];
  }) => {
    const active = statusFilter?.value === value;
    return (
      <button
        key={value ?? '__all__'}
        type="button"
        aria-pressed={active}
        onClick={() => {
          statusFilter?.onChange(value);
        }}
        className={cn(
          'oa:cursor-pointer oa:rounded-full oa:border-0 oa:bg-transparent oa:p-0 oa:transition-opacity oa:outline-none oa:focus-visible:ring-2 oa:focus-visible:ring-ring',
          active
            ? 'oa:opacity-100 oa:ring-1 oa:ring-foreground/40'
            : 'oa:opacity-60 oa:hover:opacity-100'
        )}
      >
        <Badge tone={tone}>{label}</Badge>
      </button>
    );
  };

  return (
    <div className="oa:flex oa:flex-col oa:gap-3 oa:sm:flex-row oa:sm:items-center oa:sm:justify-between">
      <div className="oa:flex oa:flex-1 oa:flex-col oa:gap-3 oa:sm:flex-row oa:sm:items-center">
        {search && (
          <div className="oa:relative oa:w-full oa:sm:max-w-xs">
            <SearchIcon className="oa:pointer-events-none oa:absolute oa:left-2.5 oa:top-1/2 oa:size-4 oa:-translate-y-1/2 oa:text-muted-foreground" />
            <Input
              type="search"
              value={search.value}
              aria-label={intl.formatMessage(messages.searchLabel)}
              placeholder={intl.formatMessage(messages.searchPlaceholder)}
              onChange={(event) => {
                search.onChange(event.target.value);
              }}
              className="oa:pl-8"
            />
          </div>
        )}
        {statusFilter && (
          <div
            role="group"
            aria-label={intl.formatMessage(messages.statusFilterLabel, {
              field: humanizeKey(statusFilter.field),
            })}
            className="oa:flex oa:flex-wrap oa:items-center oa:gap-1.5"
          >
            {chip({
              value: null,
              label: intl.formatMessage(messages.allStatuses),
              tone: 'neutral',
            })}
            {statusFilter.options.map((option) => {
              return chip({
                value: option,
                label: humanizeKey(option),
                tone: statusTone(option),
              });
            })}
          </div>
        )}
      </div>
      <div className="oa:flex oa:items-center oa:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={fetching}
        >
          <RefreshIcon spinning={fetching} />
          {intl.formatMessage(messages.refresh)}
        </Button>
        {actions}
      </div>
    </div>
  );
};
