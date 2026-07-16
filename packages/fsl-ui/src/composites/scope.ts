/**
 * Composite Scope — runtime host-presence guard.
 *
 * The Component Semantics Projection treats Composition as a flat vocabulary
 * (see `docs/.../component-model.md` §"Parent disambiguation"): a slot role
 * like `'heading'` is legal on its declared Entity regardless of which host
 * renders it. The data model intentionally has no `host` field, and the FSL
 * Structural Language §10 lists no Host × Role legality matrix.
 *
 * What is *not* covered by that flatness is the runtime invariant that some
 * sub-parts only make sense inside their host (e.g. `<DialogHeading>` solto
 * is not a meaningful element). This module closes that gap with two tiny
 * builders — chosen by *name*, not by a `<true>` type sentinel — so the
 * author's intent is self-evident at the call site:
 *
 *   1. `createPresenceScope(host)` — pure host-presence guard. No state is
 *      shared; sub-parts only need to assert "I am inside <Host>". Provider
 *      takes no `value` prop. Used by Dialog, Form, TextField, Menu.
 *
 *   2. `createCompositeScope<T>(host)` — host shares typed state with its
 *      sub-parts (evaluation, controlled step, validation, …). Provider
 *      requires a `value` of type `T`. Used by Accordion, Wizard.
 *
 * Both builders share the same error contract: `use('<SubPart>')` outside
 * the host throws an `Error` whose message names both the sub-part and the
 * expected host. Both set `Context.displayName = '<Host>Scope'` for nice
 * DevTools output.
 *
 * Authoring rule (mirrored in CONTRIBUTING §2.3): if the host has no value
 * to share with sub-parts, use `createPresenceScope`. If TypeScript tempts
 * you to write `createCompositeScope<true>('X')`, you wanted
 * `createPresenceScope('X')`.
 *
 * @example Presence guard
 * ```tsx
 * const formScope = createPresenceScope('Form');
 *
 * export const Form = ({ children }) => (
 *   <formScope.Provider>{children}</formScope.Provider>
 * );
 *
 * export const FormSubmit = (props) => {
 *   formScope.use('FormSubmit');
 *   return <button type="submit" {...props} />;
 * };
 * ```
 *
 * @example Stateful scope
 * ```tsx
 * const wizardScope = createCompositeScope<WizardContextValue>('Wizard');
 *
 * export const Wizard = ({ children }) => {
 *   const ctx = useWizardState(...);
 *   return <wizardScope.Provider value={ctx}>{children}</wizardScope.Provider>;
 * };
 *
 * export const WizardNavigation = () => {
 *   const ctx = wizardScope.use('WizardNavigation');
 *   return <button onClick={ctx.goNext}>Next</button>;
 * };
 * ```
 */
import * as React from 'react';

// ---------------------------------------------------------------------------
// Shared internals
// ---------------------------------------------------------------------------

const PRESENT = Symbol('composite-scope.present');

/** Throws the canonical out-of-host error for a sub-part. */
const throwOutOfHost = (
  consumerDisplayName: string,
  hostDisplayName: string
): never => {
  throw new Error(
    `<${consumerDisplayName}> must be rendered inside <${hostDisplayName}>.`
  );
};

// ---------------------------------------------------------------------------
// Stateful scope — host shares typed state with sub-parts
// ---------------------------------------------------------------------------

export interface CompositeScope<T> {
  /** Wraps the host's subtree with the scope value. */
  Provider: React.Provider<T | null>;
  /**
   * Asserts host presence and returns the scope value.
   * Throws if rendered outside the host.
   */
  use: (consumerDisplayName: string) => T;
}

/**
 * Creates a scope where the host shares typed state with its sub-parts.
 *
 * @param hostDisplayName - Display name of the host component, used in the
 *   error message thrown by `use()` when a sub-part is rendered outside.
 *   Must match the host's `*Meta.displayName`.
 */
export const createCompositeScope = <T>(
  hostDisplayName: string
): CompositeScope<T> => {
  const Context = React.createContext<T | null>(null);
  Context.displayName = `${hostDisplayName}Scope`;

  return {
    Provider: Context.Provider,
    use: (consumerDisplayName: string): T => {
      const value = React.useContext(Context);
      if (value === null) {
        return throwOutOfHost(consumerDisplayName, hostDisplayName);
      }
      return value;
    },
  };
};

// ---------------------------------------------------------------------------
// Presence-only scope — host shares no value, just "I am inside <Host>"
// ---------------------------------------------------------------------------

/** Props for a presence-only Provider. */
export interface PresenceProviderProps {
  children?: React.ReactNode;
}

export interface PresenceScope {
  /**
   * Wraps the host's subtree. Takes no `value` prop — the only contract is
   * that descendants observe a non-default Context value (the internal
   * `PRESENT` symbol).
   */
  Provider: React.ComponentType<PresenceProviderProps>;
  /**
   * Asserts host presence. Throws if rendered outside the host.
   */
  use: (consumerDisplayName: string) => void;
}

/**
 * Creates a presence-only scope. Sub-parts use `scope.use('<Name>')` to
 * assert they are rendered inside `<Host>` — no value is shared.
 *
 * Use this when the host has nothing to publish to sub-parts. If you find
 * yourself reaching for `createCompositeScope<true>('X')`, use this
 * instead — it is the same contract with a clearer name and zero
 * boilerplate at the call site (`<Provider>` instead of
 * `<Provider value={true}>`).
 */
export const createPresenceScope = (hostDisplayName: string): PresenceScope => {
  const Context = React.createContext<symbol | null>(null);
  Context.displayName = `${hostDisplayName}Scope`;

  const Provider = ({ children }: PresenceProviderProps) => {
    return React.createElement(Context.Provider, { value: PRESENT }, children);
  };
  Provider.displayName = `${hostDisplayName}ScopeProvider`;

  return {
    Provider,
    use: (consumerDisplayName: string): void => {
      const value = React.useContext(Context);
      if (value !== PRESENT) {
        throwOutOfHost(consumerDisplayName, hostDisplayName);
      }
    },
  };
};
