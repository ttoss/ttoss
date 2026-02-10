import { BigNumber } from './Cards/BigNumber';

export type CardNumberType = 'number' | 'percentage' | 'currency';
export type CardSourceType = {
  source: 'meta' | 'oneclickads' | 'api';
  level?: 'adAccount' | 'campaign' | 'adSet' | 'ad';
};
export type DashboardCardType =
  | 'bigNumber'
  | 'pieChart'
  | 'barChart'
  | 'lineChart'
  | 'table'
  | 'list';
export type DashboardCardData = {
  meta?: {
    total?: number;
    daily?: number[];
  };
  api?: {
    total?: number;
    daily?: number[];
  };
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

type SourceType = CardSourceType['source'];

type MetricsRecord = {
  [K in SourceType]: { [P in K]: string[] } & Partial<
    Record<Exclude<SourceType, K>, string[]>
  >;
}[SourceType];
export interface DashboardCard {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  variant?: CardVariant;
  numberType: CardNumberType;
  numberDecimalPlaces?: number;
  type: DashboardCardType;
  sourceType: CardSourceType[];
  labels?: Array<string | number>;
  data: DashboardCardData;
  suffix?: string;
  trend?: TrendIndicator;
  additionalInfo?: string;
  status?: StatusIndicator;
  metrics?: MetricsRecord[];
}

export const DashboardCard = (props: DashboardCard) => {
  switch (props.type) {
    case 'bigNumber':
      return <BigNumber {...props} />;
    default:
      return null;
  }
};
