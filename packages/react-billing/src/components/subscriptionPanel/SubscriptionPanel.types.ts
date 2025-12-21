import type { IconType } from '@ttoss/react-icons';
import type { ButtonProps } from '@ttoss/ui';

import type { SubscriptionPanelVariant } from './SubscriptionPanel.styles';

/**
 * Subscription status indicating the current state of the subscription.
 */
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

/**
 * Base metric properties shared by all metric types.
 */
export interface BaseMetric {
  /**
   * Label displayed above the metric value.
   */
  label: string;
  /**
   * Optional tooltip text or action handler for additional context.
   * When a string is provided, it displays a simple tooltip.
   * When a function is provided, it's called when the tooltip icon is clicked (e.g., to open help articles).
   */
  tooltip?: string | (() => void);
  /**
   * Icon to display alongside the metric.
   */
  icon?: IconType;
  /**
   * Optional click handler to make the metric card interactive.
   */
  onClick?: () => void;
  /**
   * Optional help article action handler.
   */
  helpArticleAction?: () => void;
}

/**
 * Date-based metric for displaying dates like expiration or renewal.
 */
export interface DateMetric extends BaseMetric {
  type: 'date';
  /**
   * The date value to display.
   */
  date: string;
  /**
   * Optional message showing remaining days.
   */
  remainingDaysMessage?: string;
  /**
   * Whether to show a warning indicator.
   */
  isWarning?: boolean;
}

/**
 * Percentage-based metric with progress bar.
 */
export interface PercentageMetric extends BaseMetric {
  type: 'percentage';
  /**
   * Current value.
   */
  current: number;
  /**
   * Maximum value. Use null for unlimited.
   */
  max: number | null;
  /**
   * Custom formatter for displaying values.
   */
  formatValue?: (value: number) => string;
  /**
   * Percentage threshold at which to show an alert.
   */
  showAlertThreshold?: number;
}

/**
 * Number-based metric for displaying counts.
 */
export interface NumberMetric extends BaseMetric {
  type: 'number';
  /**
   * Current value.
   */
  current: number;
  /**
   * Maximum value. Use null for unlimited.
   */
  max: number | null;
  /**
   * Custom formatter for displaying values.
   */
  formatValue?: (value: number) => string;
  /**
   * Optional footer text below the metric.
   */
  footerText?: string;
}

/**
 * Union type for all metric types.
 */
export type MetricType = DateMetric | PercentageMetric | NumberMetric;

/**
 * Status badge configuration.
 */
export interface SubscriptionPanelStatusBadgeProps {
  /**
   * The subscription status.
   */
  status: SubscriptionStatus;
  /**
   * Billing interval (e.g., "Mensal", "Anual").
   */
  interval?: string;
  /**
   * Whether the subscription has a pending cancellation.
   */
  hasCancellation?: boolean;
  /**
   * Whether the subscription has a scheduled update.
   */
  hasScheduledUpdate?: boolean;
}

/**
 * Feature tag displayed in the card header.
 */
export interface SubscriptionPanelFeatureTag {
  /**
   * Label text for the feature.
   */
  label: string;
  /**
   * Optional icon for the feature.
   */
  icon?: IconType;
}

/**
 * Action button configuration.
 */
export interface SubscriptionPanelAction extends Omit<ButtonProps, 'children'> {
  /**
   * Button label text.
   */
  label: string;
  /**
   * Click handler for the action.
   */
  onClick: () => void;
  /**
   * Optional icon for the button.
   */
  leftIcon?: IconType;
  /**
   * Whether the action is currently loading.
   */
  isLoading?: boolean;
}

/**
 * Price configuration.
 */
export interface SubscriptionPanelPrice {
  /**
   * Price value (e.g., "R$ 5,00").
   */
  value: string;
  /**
   * Price interval (e.g., "mês", "ano").
   */
  interval?: string;
}

/**
 * Main SubscriptionPanel props.
 */
export interface SubscriptionPanelProps {
  /**
   * Visual variant for the accent bar and header icon.
   * @default 'spotlight'
   */
  variant?: SubscriptionPanelVariant;
  /**
   * Plan icon to display. Can be a ReactNode or an IconType string.
   */
  icon?: string;
  /**
   * Name of the subscription plan.
   */
  planName: string;
  /**
   * Price configuration.
   */
  price: SubscriptionPanelPrice;
  /**
   * Status badge configuration.
   */
  status: SubscriptionPanelStatusBadgeProps;
  /**
   * Feature tags to display.
   */
  features?: SubscriptionPanelFeatureTag[];
  /**
   * Action buttons.
   */
  actions?: SubscriptionPanelAction[];
  /**
   * Metrics to display in the card.
   */
  metrics?: MetricType[];
  /**
   * Whether the card is in a loading state.
   */
  isLoading?: boolean;
}
