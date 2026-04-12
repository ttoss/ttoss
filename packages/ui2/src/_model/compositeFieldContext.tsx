/**
 * compositeFieldContext.tsx — Field context for composite components using React Aria.
 *
 * Ark UI provides `<Field.Root>` which automatically propagates state (invalid,
 * disabled, required, readOnly) to all nested Ark Field parts.
 *
 * React Aria doesn't provide a comparable Field context, so we must create one
 * for ui2 composites (`context: 'Field'`) to work correctly.
 *
 * This module provides:
 * - FieldContextProvider: wraps composite children, manages state
 * - useFieldContext: hook for parts to read propagated state
 * - FieldContextType: type definition for context shape
 */

import * as React from 'react';

/**
 * Shape of the propagated field state.
 * Matches Ark UI's Field.Root behavior.
 */
export interface FieldState {
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
}

/**
 * Data attributes derived from field state.
 * Used by parts to apply data-* attributes for CSS targeting.
 */
export interface FieldDataAttrs {
  'data-invalid'?: string;
  'data-disabled'?: string;
  'data-required'?: string;
  'data-readonly'?: string;
}

/**
 * Shape of the context value.
 * Provides state + ARIA props + data attributes for use by parts.
 */
export interface FieldContextValue extends FieldState {
  /** Generate ARIA attributes for a label (htmlFor, id-pairing) */
  getLabelProps: () => { htmlFor?: string };
  /** Generate ARIA attributes for an input-like element */
  getInputProps: () => { 'aria-labelledby'?: string; 'aria-describedby'?: string };
  /** Generate data-* attributes from current state */
  getDataAttrs: () => FieldDataAttrs;
}

/**
 * React Context for field state propagation.
 * Initially undefined; components should handle gracefully.
 */
const FieldContext = React.createContext<FieldContextValue | undefined>(undefined);

/**
 * Hook for parts to read field context.
 * Returns context value if inside a FieldContextProvider, undefined otherwise.
 *
 * Parts should guard against undefined:
 * ```tsx
 * const fieldContext = useFieldContext();
 * const dataAttrs = fieldContext?.getDataAttrs() ?? {};
 * ```
 */
export function useFieldContext(): FieldContextValue | undefined {
  return React.useContext(FieldContext);
}

/**
 * Props for FieldContextProvider.
 * Spread as FieldContextProps in composite types.
 */
export interface FieldContextProviderProps extends FieldState {
  children: React.ReactNode;
}

/**
 * Provider that manages field state and makes it available to nested parts.
 *
 * Used internally by defineComposite when context='Field'.
 * Generates unique IDs for label/input association and ARIA attributes.
 *
 * @example
 * <FieldContextProvider invalid={error} required>
 *   <Label />
 *   <Input />
 *   <HelperText />
 * </FieldContextProvider>
 */
export const FieldContextProvider: React.FC<FieldContextProviderProps> = ({
  invalid,
  disabled,
  required,
  readOnly,
  children,
}) => {
  // Generate stable IDs for ARIA associations
  const labelIdRef = React.useRef(`field-label-${Math.random().toString(36).slice(2)}`);
  const inputIdRef = React.useRef(`field-input-${Math.random().toString(36).slice(2)}`);
  const helperIdRef = React.useRef(`field-helper-${Math.random().toString(36).slice(2)}`);
  const errorIdRef = React.useRef(`field-error-${Math.random().toString(36).slice(2)}`);

  const value: FieldContextValue = {
    invalid,
    disabled,
    required,
    readOnly,

    getLabelProps: () => ({
      htmlFor: inputIdRef.current,
    }),

    getInputProps: () => ({
      'aria-labelledby': labelIdRef.current,
      'aria-describedby': invalid ? errorIdRef.current : helperIdRef.current,
    }),

    getDataAttrs: () => ({
      'data-invalid': invalid ? 'true' : undefined,
      'data-disabled': disabled ? 'true' : undefined,
      'data-required': required ? 'true' : undefined,
      'data-readonly': readOnly ? 'true' : undefined,
    }),
  };

  return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
};

FieldContextProvider.displayName = 'FieldContextProvider';

/**
 * Export types for composite consumers.
 * These are the props that defineComposite adds when context='Field'.
 */
export type FieldContextProps = FieldState;
