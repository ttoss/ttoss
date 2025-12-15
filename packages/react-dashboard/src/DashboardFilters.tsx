import { Flex } from '@ttoss/ui';
import * as React from 'react';

import { useDashboard } from './DashboardProvider';
import type { DateRange } from './Filters/DateRangeFilter';
import { DateRangeFilter } from './Filters/DateRangeFilter';
import { SelectFilter } from './Filters/SelectFilter';
import { TextFilter } from './Filters/TextFilter';

export type DashboardFilterValue =
  | string
  | number
  | boolean
  | { from: Date; to: Date };

export enum DashboardFilterType {
  TEXT = 'text',
  SELECT = 'select',
  DATE_RANGE = 'date-range',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export type DashboardFilter = {
  key: string;
  type: DashboardFilterType;
  label: string;
  placeholder?: string;
  value: DashboardFilterValue;
  onChange?: (value: DashboardFilterValue) => void;
  options?: { label: string; value: string | number | boolean }[];
  presets?: { label: string; getValue: () => DateRange }[];
};

export const DashboardFilters = () => {
  const { filters, updateFilter } = useDashboard();

  const onChangeHandlers = React.useMemo(() => {
    const handlers = new Map<string, (value: DashboardFilterValue) => void>();
    for (const filter of filters) {
      handlers.set(filter.key, (value: DashboardFilterValue) => {
        updateFilter(filter.key, value);
      });
    }
    return handlers;
  }, [filters, updateFilter]);

  return (
    <Flex
      sx={{
        gap: '2',
        flexDirection: 'row',
        '@media (max-width: 768px)': {
          flexWrap: 'wrap',
        },
      }}
    >
      {filters.map((filter) => {
        const onChange = onChangeHandlers.get(filter.key);
        if (!onChange) {
          return null;
        }

        switch (filter.type) {
          case DashboardFilterType.TEXT:
            return (
              <TextFilter
                key={filter.key}
                name={filter.key}
                label={filter.label}
                value={filter.value}
                placeholder={filter.placeholder}
                onChange={onChange}
              />
            );
          case DashboardFilterType.SELECT:
            return (
              <SelectFilter
                key={filter.key}
                name={filter.key}
                label={filter.label}
                value={filter.value}
                options={filter.options ?? []}
                onChange={(value) => {
                  onChange(value as string | number | boolean);
                }}
              />
            );
          case DashboardFilterType.DATE_RANGE:
            return (
              <DateRangeFilter
                label={filter.label}
                key={filter.key}
                value={filter.value as DateRange | undefined}
                presets={filter.presets}
                onChange={(range) => {
                  onChange(range as DashboardFilterValue);
                }}
              />
            );
          default:
            return null;
        }
      })}
    </Flex>
  );
};
