/**
 * Shared types for the defineComponent() factory and testComponentContract() helper.
 *
 * This module is the single source of truth for `ComponentContractConfig`.
 * Both `_model/defineComponent.tsx` (which produces configs) and
 * `tests/unit/helpers/componentContract.tsx` (which consumes them) import from here.
 *
 * Zero React dependency at type level — safe to import in any environment.
 */
import type * as React from 'react';

import type { Evaluation, Responsibility } from './taxonomy';

/**
 * Contract test configuration produced by `defineComponent()` and consumed by
 * `testComponentContract()`.
 *
 * Every field encodes one fact about the component that contract tests rely on
 * to generate correct assertions.
 */
export interface ComponentContractConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>;
  /** The value written to data-scope — must match the component's CSS namespace. */
  scope: string;
  /** The FSL Responsibility the component declares. */
  responsibility: Responsibility;
  /**
   * The fixed evaluation the component uses.
   * Omit for components that default to 'primary' or accept an evaluation prop.
   */
  evaluation?: Evaluation;
  /**
   * Whether the component accepts a `consequence` prop.
   * @default true
   */
  hasConsequence?: boolean;
  /**
   * Whether the component renders a void HTML element (e.g. `<input>`).
   * @default false
   */
  isVoid?: boolean;
  /**
   * Optional React wrapper component that provides context required by the
   * component under test (e.g. Field.Root for Ark-based form parts).
   */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}
