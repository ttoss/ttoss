import { BigNumber } from './Cards/BigNumber';
import { BigNumberSparkline } from './Cards/BigNumberSparkline';

export type CardNumberType = 'number' | 'percentage' | 'currency';
export type CardSourceType = {
  source: string;
  level?: string;
};
export type DashboardCardType =
  | 'bigNumber'
  | 'bigNumberSparkline'
  | 'pieChart'
  | 'barChart'
  | 'lineChart'
  | 'table'
  | 'list';
export type DashboardCardData = {
  /** Current period aggregate value. */
  value?: number;
  /** Time-series values for the current period (one entry per day/interval). */
  series?: number[];
  /** Time-series values for the comparison period, used to render the overlay line. */
  previousSeries?: number[];
};
export type CardVariant = 'default' | 'dark' | 'light-green';
export type TrendIndicator = {
  value: number;
  status?: 'positive' | 'negative' | 'neutral';
  type?: 'higher' | 'lower';
};
export type StatusIndicator = {
  text: string;
  icon?: string;
};

export interface DashboardCard {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  variant?: CardVariant;
  numberType: CardNumberType;
  numberDecimalPlaces?: number;
  /** ISO 4217 currency code (e.g. `"BRL"`, `"USD"`, `"EUR"`). Only used when `numberType` is `"currency"`. Defaults to `"BRL"`. */
  currency?: string;
  /** BCP 47 locale tag used for number/currency formatting (e.g. `"pt-BR"`, `"en-US"`). Defaults to the i18n context locale. */
  locale?: string;
  type: DashboardCardType;
  sourceType?: CardSourceType[];
  labels?: Array<string | number>;
  data: DashboardCardData;
  suffix?: string;
  trend?: TrendIndicator;
  additionalInfo?: string;
  status?: StatusIndicator;
}

export const DashboardCard = (props: DashboardCard) => {
  switch (props.type) {
    case 'bigNumber':
      return <BigNumber {...props} />;
    case 'bigNumberSparkline':
    case 'lineChart':
      return <BigNumberSparkline {...props} />;
    default:
      return null;
  }
};
