import type * as React from 'react';

import type {
  PlanCardButtonProps,
  PlanCardMetadata,
  PlanCardPrice,
} from '../planCard/PlanCard';
import type { PlanCardVariant } from '../planCard/PlanCardVariants';

/**
 * A single option inside a PlansPanel filter.
 */
export interface PlansPanelFilterOption {
  /** Display label shown in the SegmentedControl. */
  label: string;
  /** Value used for filtering plans. */
  value: string;
}

/**
 * Defines one filter dimension rendered as a SegmentedControl above the plans grid.
 */
export interface PlansPanelFilter {
  /** Unique identifier for this filter dimension. */
  id: string;
  /** Optional label rendered above the SegmentedControl. */
  label?: string;
  /** List of selectable options. */
  options: PlansPanelFilterOption[];
  /** Initial value used in uncontrolled mode. */
  defaultValue?: string;
}

/**
 * A plan displayed inside the PlansPanel.
 */
export interface PlansPanelPlan {
  /** Unique plan identifier. */
  id: string;
  /**
   * Maps each filter id to the value this plan belongs to.
   * Plans are only shown when all active filter values match.
   */
  filterValues?: Record<string, string>;
  /** Plan title (e.g. "Basic", "Pro"). */
  title: string;
  /** Optional subtitle displayed below the title. */
  subtitle?: string;
  /** Pricing information. */
  price: PlanCardPrice;
  /** Feature list items. */
  features?: unknown[];
  /** Optional metadata sections. */
  metadata?: PlanCardMetadata;
  /** Props forwarded to the CTA button. onClick is merged with onSelectPlan. */
  buttonProps?: PlanCardButtonProps;
  /** Visual variant for the PlanCard. Active plans override this with "secondary". */
  variant?: PlanCardVariant;
  /** Optional content rendered at the top of the PlanCard. */
  topTag?: React.ReactNode;
}

/**
 * Props for the PlansPanel component.
 */
export interface PlansPanelProps {
  /**
   * Filter dimensions rendered as SegmentedControl rows above the plan grid.
   * Each dimension independently narrows the visible set of plans.
   */
  filters?: PlansPanelFilter[];
  /** All available plans. Only plans matching every active filter value are shown. */
  plans: PlansPanelPlan[];
  /** ID of the currently active/subscribed plan. That card is highlighted. */
  activePlanId?: string;
  /**
   * Called when the user clicks the CTA button of a plan.
   * @param planId - The id of the selected plan.
   */
  onSelectPlan?: (planId: string) => void;
  /**
   * Controlled filter values (record of filterId → selected value).
   * When provided the component operates in controlled mode and internal
   * state is not used.
   */
  filterValues?: Record<string, string>;
  /**
   * Called when a filter value changes in controlled mode.
   * @param id - The filter id that changed.
   * @param value - The new selected value.
   */
  onFilterChange?: (id: string, value: string) => void;
}
