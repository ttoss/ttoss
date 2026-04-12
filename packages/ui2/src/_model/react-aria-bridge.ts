/**
 * react-aria-bridge.ts — Utilities to adapt React Aria hooks to @ttoss/ui2 patterns.
 *
 * React Aria provides hooks that return aria-* attributes and state info.
 * This bridge layer ensures those hook results play nicely with ui2's semantic
 * data attributes (data-scope, data-part, data-variant, data-size).
 *
 * Key principle: Semantic attrs must be applied AFTER hook attrs so they
 * cannot be overridden by consumers. This module provides utilities for that.
 */

import type React from 'react';

/**
 * Props returned by a React Aria hook (typically aria-*, role, etc.)
 */
export interface ReactAriaHookProps extends React.AllHTMLAttributes<HTMLElement> {
  role?: string;
  // aria-* attributes are included in HTMLAttributes
}

/**
 * Semantic attributes that ui2 applies to components.
 * These MUST override any hook-provided attributes to prevent consumer override.
 */
export interface SemanticAttrs {
  'data-scope': string;
  'data-part': string;
  'data-variant': string;
  'data-size'?: string;
}

/**
 * Merges React Aria hook props with ui2 semantic attributes.
 *
 * Strategy:
 * 1. Spread hook props first (aria-*, role, event handlers, etc.)
 * 2. Spread semantic attrs AFTER (prevents consumer override)
 * 3. Ensure readonly semantics in TypeScript
 *
 * @example
 * const { buttonProps } = useButton();
 * const semanticAttrs = { 'data-scope': 'button', ... };
 * const merged = mergeReactAriaAttrs(buttonProps, semanticAttrs);
 * <button {...merged} />  // aria-* from hook, data-* cannot be overridden
 */
export function mergeReactAriaAttrs(
  hookProps: ReactAriaHookProps,
  semanticAttrs: SemanticAttrs
): Record<string, any> {
  return {
    ...hookProps,
    ...semanticAttrs,
  };
}

/**
 * Utility for forwarding refs correctly when wrapping React Aria components.
 *
 * React Aria hooks like useButton() return { buttonProps } that you spread
 * onto a native element. This utility ensures ref forwarding works correctly.
 *
 * @example
 * const ref = useRef<HTMLButtonElement>(null);
 * const { buttonProps } = useButton({ elementType: 'button' }, ref);
 * return <button {...buttonProps} />;
 */
export function forwardRefWithHook<T extends HTMLElement>(
  ref: React.Ref<T>,
  hookElementRef: React.MutableRefObject<T | null>
): void {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(hookElementRef.current);
  } else {
    ref.current = hookElementRef.current;
  }
}

/**
 * Maps React Aria hook state to ui2 data-* attributes.
 *
 * Some React Aria hooks return state info (isDisabled, isFocused, etc.)
 * This utility converts those to data-* attributes for CSS targeting.
 *
 * Note: React Aria already adds its own data-* attrs (data-disabled, data-focus),
 * so this is mainly for documentation/consistency.
 */
export interface ReactAriaState {
  isDisabled?: boolean;
  isFocused?: boolean;
  isFocusVisible?: boolean;
  isHovered?: boolean;
  isPressed?: boolean;
  isActive?: boolean;
}

/**
 * Convert React Aria state to HTML data attributes.
 * Useful for debugging or additional CSS targeting beyond what React Aria provides.
 */
export function stateToDataAttrs(state: ReactAriaState): Record<string, string | undefined> {
  return {
    'data-disabled': state.isDisabled ? 'true' : undefined,
    'data-focused': state.isFocused ? 'true' : undefined,
    'data-focus-visible': state.isFocusVisible ? 'true' : undefined,
    'data-hovered': state.isHovered ? 'true' : undefined,
    'data-pressed': state.isPressed ? 'true' : undefined,
    'data-active': state.isActive ? 'true' : undefined,
  };
}

/**
 * Hook to combine React Aria props with ui2 semantic attributes.
 *
 * Common pattern for creating ui2 components from React Aria hooks:
 * const { merged, semanticAttrs } = useUi2Attrs(hookProps, ui2Attrs);
 *
 * @example
 * const { buttonProps } = useButton();
 * const { merged } = useUi2Attrs(buttonProps, {
 *   'data-scope': 'button',
 *   'data-part': 'root',
 *   'data-variant': 'primary',
 * });
 * <button {...merged} />
 */
export function useUi2Attrs(
  hookProps: ReactAriaHookProps,
  semanticAttrs: SemanticAttrs
) {
  const merged = mergeReactAriaAttrs(hookProps, semanticAttrs);
  return { merged, semanticAttrs };
}
