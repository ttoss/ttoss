import type { IconType } from '@ttoss/react-icons';

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
   * When a function is provided, it's called when the tooltip icon is clicked.
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
 * Union type for all supported metric types.
 */
export type Metric = DateMetric | PercentageMetric | NumberMetric;

/**
 * Props for the MetricCard component.
 */
export interface MetricCardProps {
  /**
   * The metric configuration to display.
   */
  metric: Metric;
  /**
   * Whether the card is in loading state.
   */
  isLoading?: boolean;
}
