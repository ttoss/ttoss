export const formatDuration = (seconds: number | null): string => {
  if (seconds === null) {
    return '—';
  }
  return `${seconds}s`;
};

export const formatAge = (minutesAgo: number): string => {
  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`;
  }
  return `${Math.round(minutesAgo / 60)}h ago`;
};
