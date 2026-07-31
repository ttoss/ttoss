/**
 * Meridian's fictional workspace data — the `northline` team shipping a
 * handful of web properties. Static module data: the Stage is a real
 * application over a fictional backend.
 */

export type DeployStatus = 'ready' | 'building' | 'failed';

export interface Deploy {
  id: string;
  project: string;
  status: DeployStatus;
  branch: string;
  commit: string;
  /** Build duration in seconds; `null` while still building. */
  duration: number | null;
  /** Minutes ago, relative to page load. */
  minutesAgo: number;
  actor: string;
}

export const DEPLOYS: Deploy[] = [
  {
    id: 'dpl_9f2c',
    project: 'marketing-site',
    status: 'building',
    branch: 'main',
    commit: '4e1f9a2',
    duration: null,
    minutesAgo: 2,
    actor: 'Marina Costa',
  },
  {
    id: 'dpl_8be1',
    project: 'api-gateway',
    status: 'ready',
    branch: 'main',
    commit: 'b7d03c8',
    duration: 74,
    minutesAgo: 26,
    actor: 'Rafael Lima',
  },
  {
    id: 'dpl_7ac4',
    project: 'docs',
    status: 'ready',
    branch: 'main',
    commit: '19e5f77',
    duration: 58,
    minutesAgo: 61,
    actor: 'Sofia Almeida',
  },
  {
    id: 'dpl_6d90',
    project: 'checkout',
    status: 'failed',
    branch: 'fix/tax-rounding',
    commit: 'c2a81b4',
    duration: 41,
    minutesAgo: 94,
    actor: 'Rafael Lima',
  },
  {
    id: 'dpl_5e77',
    project: 'checkout',
    status: 'ready',
    branch: 'main',
    commit: '88f10de',
    duration: 96,
    minutesAgo: 170,
    actor: 'Marina Costa',
  },
  {
    id: 'dpl_4c25',
    project: 'marketing-site',
    status: 'ready',
    branch: 'campaign/q3-launch',
    commit: '5a90c11',
    duration: 63,
    minutesAgo: 260,
    actor: 'Tiago Ferreira',
  },
  {
    id: 'dpl_3b18',
    project: 'api-gateway',
    status: 'ready',
    branch: 'main',
    commit: 'e4b72f0',
    duration: 71,
    minutesAgo: 420,
    actor: 'Sofia Almeida',
  },
  {
    id: 'dpl_2a03',
    project: 'docs',
    status: 'ready',
    branch: 'main',
    commit: '90cd315',
    duration: 55,
    minutesAgo: 610,
    actor: 'Helena Duarte',
  },
];

/** Deploys per day over the trailing week — the dashboard chart series. */
export const WEEKLY_DEPLOYS: { day: string; count: number }[] = [
  { day: 'Thu', count: 14 },
  { day: 'Fri', count: 19 },
  { day: 'Sat', count: 4 },
  { day: 'Sun', count: 2 },
  { day: 'Mon', count: 17 },
  { day: 'Tue', count: 23 },
  { day: 'Wed', count: 11 },
];

export interface Kpi {
  id: string;
  label: string;
  value: string;
  /** Week-over-week movement, already formatted (e.g. '+12%'). */
  delta: string;
  deltaTone: 'positive' | 'negative';
}

export const KPIS: Kpi[] = [
  {
    id: 'deploys',
    label: 'Deploys',
    value: '90',
    delta: '+12%',
    deltaTone: 'positive',
  },
  {
    id: 'success',
    label: 'Success rate',
    value: '98.2%',
    delta: '+0.4%',
    deltaTone: 'positive',
  },
  {
    id: 'build',
    label: 'Avg build time',
    value: '64s',
    delta: '-9s',
    deltaTone: 'positive',
  },
  {
    id: 'projects',
    label: 'Active projects',
    value: '5',
    delta: '+1',
    deltaTone: 'positive',
  },
];

export type Role = 'Admin' | 'Developer' | 'Viewer';

export interface Timezone {
  /** IANA zone id — the stored value. */
  id: string;
  /** City label the member scans and types against. */
  label: string;
}

/**
 * The option set that motivated `ComboBox` (friction F-008): long enough that
 * a `Select` popover is scan-only, so the field needs typeahead to be usable.
 */
export const TIMEZONES: Timezone[] = [
  { id: 'Pacific/Auckland', label: 'Auckland' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Asia/Seoul', label: 'Seoul' },
  { id: 'Asia/Shanghai', label: 'Shanghai' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'Asia/Jakarta', label: 'Jakarta' },
  { id: 'Asia/Kolkata', label: 'Kolkata' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Europe/Moscow', label: 'Moscow' },
  { id: 'Africa/Nairobi', label: 'Nairobi' },
  { id: 'Europe/Istanbul', label: 'Istanbul' },
  { id: 'Europe/Athens', label: 'Athens' },
  { id: 'Africa/Johannesburg', label: 'Johannesburg' },
  { id: 'Europe/Berlin', label: 'Berlin' },
  { id: 'Europe/Madrid', label: 'Madrid' },
  { id: 'Europe/Paris', label: 'Paris' },
  { id: 'Europe/Amsterdam', label: 'Amsterdam' },
  { id: 'Europe/Stockholm', label: 'Stockholm' },
  { id: 'Africa/Lagos', label: 'Lagos' },
  { id: 'Europe/Lisbon', label: 'Lisbon' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Atlantic/Reykjavik', label: 'Reykjavik' },
  { id: 'America/Sao_Paulo', label: 'São Paulo' },
  { id: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { id: 'America/Santiago', label: 'Santiago' },
  { id: 'America/New_York', label: 'New York' },
  { id: 'America/Toronto', label: 'Toronto' },
  { id: 'America/Bogota', label: 'Bogotá' },
  { id: 'America/Mexico_City', label: 'Mexico City' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'America/Denver', label: 'Denver' },
  { id: 'America/Los_Angeles', label: 'Los Angeles' },
  { id: 'America/Anchorage', label: 'Anchorage' },
  { id: 'Pacific/Honolulu', label: 'Honolulu' },
];

const TIMEZONE_LABELS = new Map(
  TIMEZONES.map((zone) => {
    return [zone.id, zone.label];
  })
);

/** City label for a stored zone id, falling back to the id itself. */
export const timezoneLabel = (id: string): string => {
  return TIMEZONE_LABELS.get(id) ?? id;
};

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** IANA zone id — see `TIMEZONES`. */
  timezone: string;
  joined: string;
}

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem_01',
    name: 'Marina Costa',
    email: 'marina@northline.dev',
    role: 'Admin',
    timezone: 'Europe/Lisbon',
    joined: 'Jan 2024',
  },
  {
    id: 'mem_02',
    name: 'Rafael Lima',
    email: 'rafael@northline.dev',
    role: 'Developer',
    timezone: 'America/Sao_Paulo',
    joined: 'Mar 2024',
  },
  {
    id: 'mem_03',
    name: 'Sofia Almeida',
    email: 'sofia@northline.dev',
    role: 'Developer',
    timezone: 'Europe/Madrid',
    joined: 'Jun 2024',
  },
  {
    id: 'mem_04',
    name: 'Tiago Ferreira',
    email: 'tiago@northline.dev',
    role: 'Developer',
    timezone: 'America/Sao_Paulo',
    joined: 'Nov 2024',
  },
  {
    id: 'mem_05',
    name: 'Helena Duarte',
    email: 'helena@northline.dev',
    role: 'Viewer',
    timezone: 'Europe/London',
    joined: 'Feb 2025',
  },
];

export interface Plan {
  id: 'starter' | 'pro' | 'scale';
  name: string;
  /** Monthly price in USD; rendered with tabular numerals. */
  price: number;
  description: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    description: 'For side projects and experiments.',
    features: [
      '1 concurrent build',
      '100 deploys per month',
      '100 GB bandwidth',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    description: 'For teams shipping production apps.',
    features: [
      '4 concurrent builds',
      'Unlimited deploys',
      '1 TB bandwidth',
      'Preview deployments',
      'Email support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 250,
    description: 'For platforms with heavy traffic.',
    features: [
      '16 concurrent builds',
      'Unlimited deploys',
      '10 TB bandwidth',
      'Preview deployments',
      'SSO and audit log',
      'Dedicated support',
    ],
  },
];

export interface UsageItem {
  id: string;
  label: string;
  /** Percentage of the plan allowance consumed. */
  percent: number;
  detail: string;
}

export const USAGE: UsageItem[] = [
  {
    id: 'builds',
    label: 'Build minutes',
    percent: 62,
    detail: '1,860 of 3,000 min',
  },
  {
    id: 'bandwidth',
    label: 'Bandwidth',
    percent: 38,
    detail: '380 GB of 1 TB',
  },
  {
    id: 'seats',
    label: 'Seats',
    percent: 83,
    detail: '5 of 6 seats',
  },
];

export type EnvironmentType = 'production' | 'staging' | 'preview';

/** A deploy notification the workspace can subscribe an environment to. */
export type DeployEvent = 'started' | 'succeeded' | 'failed' | 'rolled-back';

export interface Environment {
  id: string;
  name: string;
  type: EnvironmentType;
  branch: string;
  /** Instances the environment scales between (fixed count for now). */
  instances: number;
  /** CPU utilisation fraction that triggers a scale-up (0–1). */
  cpuTarget: number;
  /** Deploy events the workspace is notified about. */
  notifications: DeployEvent[];
}

export const INITIAL_ENVIRONMENTS: Environment[] = [
  {
    id: 'env_prod',
    name: 'production',
    type: 'production',
    branch: 'main',
    instances: 4,
    cpuTarget: 0.7,
    notifications: ['failed', 'rolled-back'],
  },
  {
    id: 'env_staging',
    name: 'staging',
    type: 'staging',
    branch: 'main',
    instances: 2,
    cpuTarget: 0.8,
    notifications: ['failed'],
  },
];
