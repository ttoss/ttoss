import type { Scenario, ScenarioId } from '../types.ts';
import { destructiveConfirm } from './destructiveConfirm.ts';
import { dialog } from './dialog.ts';
import { fieldValidation } from './fieldValidation.ts';
import { menu } from './menu.ts';
import { themedComposite } from './themedComposite.ts';

/**
 * The fixed D1 prompt suite (fsl-ui ROADMAP §D1): dialog, field+validation,
 * menu, destructive confirm, themed composite. FROZEN — see README.
 */
export const SCENARIOS: Scenario[] = [
  dialog,
  fieldValidation,
  menu,
  destructiveConfirm,
  themedComposite,
];

export const getScenario = (id: ScenarioId): Scenario => {
  const scenario = SCENARIOS.find((candidate) => {
    return candidate.id === id;
  });

  if (!scenario) {
    throw new Error(`Unknown scenario: ${id}`);
  }

  return scenario;
};
