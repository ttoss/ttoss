import { Flex, SegmentedControl, Stack, Text } from '@ttoss/ui';
import * as React from 'react';

import { PlanCard } from '../planCard/PlanCard';
import type { PlansPanelProps } from './PlansPanel.types';

/**
 * PlansPanel renders a grid of PlanCard components with optional multi-dimensional
 * SegmentedControl filters above them.
 *
 * Each filter dimension independently narrows the visible set of plan cards.
 * The component supports both uncontrolled mode (internal state from `defaultValue`)
 * and controlled mode (via `filterValues` + `onFilterChange`).
 *
 * @example
 * ```tsx
 * // Uncontrolled — component manages filter state internally
 * <PlansPanel
 *   filters={[
 *     {
 *       id: 'interval',
 *       label: 'Billing Frequency',
 *       options: [
 *         { label: 'Monthly', value: 'monthly' },
 *         { label: 'Yearly',  value: 'yearly' },
 *       ],
 *       defaultValue: 'monthly',
 *     },
 *   ]}
 *   plans={plans}
 *   activePlanId="plan_basic_monthly"
 *   onSelectPlan={(planId) => console.log(planId)}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Controlled — consumer owns filter state
 * <PlansPanel
 *   filters={filters}
 *   filterValues={{ interval: 'yearly' }}
 *   onFilterChange={(id, value) =>
 *     setFilterValues((prev) => ({ ...prev, [id]: value }))
 *   }
 *   plans={plans}
 *   onSelectPlan={(planId) => checkout(planId)}
 * />
 * ```
 */
export const PlansPanel = ({
  filters = [],
  plans,
  activePlanId,
  onSelectPlan,
  filterValues: controlledFilterValues,
  onFilterChange,
}: PlansPanelProps) => {
  const [internalFilterValues, setInternalFilterValues] = React.useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const filter of filters) {
      if (filter.defaultValue !== undefined) {
        initial[filter.id] = filter.defaultValue;
      }
    }
    return initial;
  });

  const isControlled = controlledFilterValues !== undefined;
  const activeFilterValues = isControlled
    ? controlledFilterValues
    : internalFilterValues;

  const handleFilterChange = (id: string, value: string | number) => {
    const strValue = String(value);
    if (isControlled) {
      onFilterChange?.(id, strValue);
    } else {
      setInternalFilterValues((prev) => {
        return { ...prev, [id]: strValue };
      });
    }
  };

  const visiblePlans = plans.filter((plan) => {
    if (!plan.filterValues || Object.keys(plan.filterValues).length === 0) {
      return true;
    }
    return Object.entries(activeFilterValues).every(
      ([filterId, filterValue]) => {
        if (!plan.filterValues || !(filterId in plan.filterValues)) {
          return true;
        }
        return plan.filterValues[filterId] === filterValue;
      }
    );
  });

  return (
    <Stack sx={{ gap: '6', width: 'full', alignItems: 'center' }}>
      {filters.length > 0 && (
        <Stack sx={{ gap: '4', alignItems: 'center' }}>
          {filters.map((filter) => {
            return (
              <Stack key={filter.id} sx={{ gap: '2', alignItems: 'center' }}>
                {filter.label && (
                  <Text
                    sx={{
                      fontWeight: 'semibold',
                      color: 'display.text.primary.default',
                    }}
                  >
                    {filter.label}
                  </Text>
                )}
                <SegmentedControl
                  options={filter.options}
                  value={
                    isControlled
                      ? (controlledFilterValues![filter.id] ??
                        filter.defaultValue)
                      : activeFilterValues[filter.id]
                  }
                  defaultValue={isControlled ? undefined : filter.defaultValue}
                  onChange={(value) => {
                    return handleFilterChange(filter.id, value);
                  }}
                />
              </Stack>
            );
          })}
        </Stack>
      )}

      <Flex
        sx={{
          flexWrap: 'wrap',
          gap: '4',
          width: 'full',
          justifyContent: 'center',
        }}
      >
        {visiblePlans.map((plan) => {
          const isActive = plan.id === activePlanId;
          const effectiveVariant = isActive
            ? 'secondary'
            : (plan.variant ?? 'primary');

          return (
            <PlanCard
              key={plan.id}
              title={plan.title}
              subtitle={plan.subtitle}
              price={plan.price}
              features={plan.features}
              metadata={plan.metadata}
              variant={effectiveVariant}
              topTag={plan.topTag}
              buttonProps={{
                ...plan.buttonProps,
                onClick: (e) => {
                  onSelectPlan?.(plan.id);
                  plan.buttonProps?.onClick?.(e);
                },
              }}
            />
          );
        })}
      </Flex>
    </Stack>
  );
};
