import type * as React from 'react';
import {
  FileTrigger as RACFileTrigger,
  type FileTriggerProps as RACFileTriggerProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { Button } from '../Button/Button';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → CONTRACT.md §1 row: colors `action`, radii `control`,
// border `outline.control`, sizing `hit.base`, spacing `inset.control`,
// typography `label`, motion `feedback`.
//
// React Aria's `FileTrigger` renders no DOM root of its own — it wires a
// hidden `<input type="file">` and makes its pressable child open the OS file
// picker. So the semantic root IS an Action `Button`: FileTrigger reuses the
// package `Button` (the internal-reuse precedent set by Wizard /
// ConfirmationDialog / Form) with its `data-scope` overridden to
// `file-trigger`. The `Button` provides all Action chrome + the
// `data-scope`/`data-part="root"` identity; FileTrigger adds only the
// file-selection behavior.
//
// The `droptarget` State (legal on Action) is exercised end-to-end only when
// paired with a `DropZone` — that pairing is deferred to Phase 4 (ROADMAP
// DnD/DropZone). FileTrigger alone is the click-to-pick trigger.
// ---------------------------------------------------------------------------

/** Formal semantic identity — FileTrigger root (Action entity). */
export const fileTriggerMeta = {
  displayName: 'FileTrigger',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/** Props for the FileTrigger component. */
export interface FileTriggerProps extends Omit<
  RACFileTriggerProps,
  'children'
> {
  /**
   * Authorial emphasis of the trigger button.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof fileTriggerMeta)['entity']>;
  /** Label content of the trigger button (e.g. "Upload avatar"). */
  children?: React.ReactNode;
}

/**
 * A semantic file-picker trigger built on React Aria's `FileTrigger`.
 *
 * Entity = Action. Renders a `Button` that opens the OS file dialog on press
 * and reports the chosen files via `onSelect`. Configure `acceptedFileTypes`,
 * `allowsMultiple`, and `acceptDirectory` as needed.
 *
 * For drag-and-drop upload, pair with a `DropZone` (deferred to Phase 4) — the
 * `droptarget` State lives there, not on this click trigger.
 *
 * @example
 * ```tsx
 * <FileTrigger
 *   acceptedFileTypes={['image/*']}
 *   onSelect={(files) => upload(files)}
 * >
 *   Upload avatar
 * </FileTrigger>
 * ```
 */
export const FileTrigger = ({
  evaluation = 'primary',
  children,
  ...props
}: FileTriggerProps) => {
  return (
    <RACFileTrigger {...props}>
      <Button data-scope="file-trigger" evaluation={evaluation}>
        {children}
      </Button>
    </RACFileTrigger>
  );
};
FileTrigger.displayName = fileTriggerMeta.displayName;
