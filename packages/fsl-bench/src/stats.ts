/**
 * Wilson score interval for a binomial proportion.
 *
 * Used instead of a normal approximation because campaign cell sizes are
 * small (n ≈ 5–10) — the Wilson interval stays inside [0, 1] and does not
 * collapse at 0% / 100% observed rates.
 */
export interface WilsonInterval {
  point: number;
  lower: number;
  upper: number;
}

export const wilson = ({
  successes,
  total,
  z = 1.96,
}: {
  successes: number;
  total: number;
  z?: number;
}): WilsonInterval => {
  if (total <= 0) {
    return { point: 0, lower: 0, upper: 0 };
  }

  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) /
    denominator;

  return {
    point: p,
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
};

export const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(0)}%`;
};

export const formatInterval = (interval: WilsonInterval): string => {
  return `${formatPercent(interval.point)} [${formatPercent(
    interval.lower
  )}–${formatPercent(interval.upper)}]`;
};
