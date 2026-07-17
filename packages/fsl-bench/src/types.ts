/**
 * Core types shared across the benchmark harness.
 *
 * Everything here is runtime-erasable TypeScript so the runner can execute
 * under Node type stripping without a build step.
 */
import type { BoundFunctions, queries, waitFor } from '@testing-library/dom';
import type { UserEvent } from '@testing-library/user-event';

export type ScenarioId =
  | 'dialog'
  | 'field-validation'
  | 'menu'
  | 'destructive-confirm'
  | 'themed-composite';

export type LibraryId =
  | 'fsl-ui'
  | 'fsl-ui-bare'
  | 'react-aria'
  | 'radix'
  | 'mui';

/**
 * Tools handed to a scenario's behavior assertion. All instances come from
 * the gauntlet's native module cache so they share one React/DOM world with
 * the evaluated sample.
 */
export interface AssertContext {
  /** RTL `screen` bound to the gauntlet's jsdom document. */
  screen: BoundFunctions<typeof queries>;
  /** user-event instance for realistic interactions. */
  user: UserEvent;
  /** RTL `waitFor` for async UI transitions (dialog exit, etc.). */
  waitFor: typeof waitFor;
}

export interface Scenario {
  id: ScenarioId;
  title: string;
  /**
   * Library-neutral task prompt. FROZEN: editing a prompt after a campaign
   * has run invalidates comparability — bump the suite version in README
   * instead.
   */
  prompt: string;
  /** Behavior assertions (L3). Throws with a descriptive message on failure. */
  assert: (ctx: AssertContext) => Promise<void>;
}

export type LintProfile = 'fsl' | 'generic';

export interface LibraryCondition {
  id: LibraryId;
  displayName: string;
  /**
   * candidate = the system under test; baseline = headless cohort peers;
   * control = opinionated control reported in a separate column
   * (BENCHMARK_EVAL rule: don't mix cohorts).
   */
  cohort: 'candidate' | 'baseline' | 'control';
  /** Package roots the sample is allowed to import UI from. */
  packages: string[];
  /**
   * Docs context handed to the model, relative to the fsl-bench package
   * root. The full fsl-ui condition points at the shipped llms.txt so the
   * benchmark always measures the real artifact.
   */
  contextFile: string;
  lintProfile: LintProfile;
}

export interface LintFinding {
  rule: string;
  message: string;
  line: number;
}

export type GauntletLevel = 'compile' | 'render' | 'behavior';

export interface GauntletResult {
  passed: boolean;
  /** Set when `passed` is false. */
  failedLevel?: GauntletLevel;
  /** Diagnostics of the failed level — fed verbatim to the repair loop. */
  errors: string[];
  /** L4 semantic lint findings — computed even when the sample passes. */
  lintFindings: LintFinding[];
}

/** One generated sample and everything measured about it. */
export interface SampleRecord {
  runId: string;
  scenario: ScenarioId;
  library: LibraryId;
  model: string;
  provider: string;
  rep: number;
  /** 0 = first-pass green; 1..n = repair rounds needed; null = never green. */
  roundsToGreen: number | null;
  firstPass: GauntletResult;
  finalPass: GauntletResult | null;
  /** Raw model completions, one per round (audit trail). */
  completions: string[];
  /** Extracted code per round. */
  codes: string[];
  contextSha256: string;
  promptSha256: string;
  timestamp: string;
}
