import type * as React from 'react';

/**
 * Position of the step list relative to the wizard content.
 */
export type WizardLayout = 'top' | 'right' | 'bottom' | 'left';

/**
 * Status of a wizard step.
 */
export type WizardStepStatus = 'completed' | 'active' | 'upcoming';

/**
 * Definition of a single wizard step.
 */
export interface WizardStep {
  /**
   * Title displayed in the step list.
   */
  title: string;
  /**
   * Optional description displayed below the title in the step list.
   */
  description?: string;
  /**
   * The content rendered when this step is active.
   */
  content: React.ReactNode;
  /**
   * Called when the user clicks "Next". If it returns false or
   * a Promise that resolves to false, the wizard will not advance.
   */
  onNext?: () => boolean | Promise<boolean>;
}

/**
 * Props for the Wizard component.
 */
export interface WizardProps {
  /**
   * Array of steps to display in the wizard.
   */
  steps: WizardStep[];
  /**
   * Position of the step list. Defaults to 'top'.
   */
  layout?: WizardLayout;
  /**
   * Called when the wizard completes (user clicks "Finish" on the last step).
   */
  onComplete?: () => void;
  /**
   * Called when the user clicks "Cancel".
   * If not provided, the Cancel button is not rendered.
   */
  onCancel?: () => void;
  /**
   * Called whenever the active step changes.
   */
  onStepChange?: (params: { stepIndex: number }) => void;
  /**
   * The initially active step index. Defaults to 0.
   */
  initialStep?: number;
  /**
   * Allow clicking on completed steps to navigate back.
   * Defaults to true.
   */
  allowStepClick?: boolean;
}

/**
 * Context value exposed by WizardProvider.
 */
export interface WizardContextValue {
  /**
   * Current active step index.
   */
  currentStep: number;
  /**
   * Total number of steps.
   */
  totalSteps: number;
  /**
   * Navigate to the next step.
   */
  goToNext: () => Promise<void>;
  /**
   * Navigate to the previous step.
   */
  goToPrevious: () => void;
  /**
   * Navigate to a specific step (only if it's completed or active).
   */
  goToStep: (params: { stepIndex: number }) => void;
  /**
   * Whether the wizard is on the first step.
   */
  isFirstStep: boolean;
  /**
   * Whether the wizard is on the last step.
   */
  isLastStep: boolean;
  /**
   * Get the status of a step by index.
   */
  getStepStatus: (params: { stepIndex: number }) => WizardStepStatus;
  /**
   * Register a validation function for the current step.
   * This allows step content components to provide their own validation logic.
   */
  setStepValidation: (validate: () => boolean | Promise<boolean>) => void;
}
