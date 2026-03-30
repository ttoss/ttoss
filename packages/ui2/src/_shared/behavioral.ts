import { BEHAVIORAL_CLASS, type Responsibility } from '../_model/index';

/** Returns data attributes for the behavioral CSS layer. */
export const behavioralAttrs = (responsibility: Responsibility) => {
  const bc = BEHAVIORAL_CLASS[responsibility];
  return bc !== 'static'
    ? ({ 'data-ui2-behavioral': bc } as const)
    : ({} as const);
};
