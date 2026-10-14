import type { DeployEvent } from '../data';

/** The deploy events an environment can notify on, in reporting order. */
export const EVENT_LABELS: Record<DeployEvent, string> = {
  started: 'Started',
  succeeded: 'Succeeded',
  failed: 'Failed',
  'rolled-back': 'Rolled back',
};

/**
 * An environment name ends up in deploy URLs, so it carries the same shape
 * rule as the workspace slug — and it is the field the fictional backend can
 * still refuse (a duplicate), which client validation cannot know.
 */
export const validateEnvironmentName = (value: string): string | null => {
  if (value.trim() === '') return 'Enter an environment name.';
  if (!/^[a-z0-9-]+$/.test(value)) {
    return 'Use lowercase letters, numbers and dashes only.';
  }
  return null;
};
