/**
 * @ttoss/ui2/model — Semantic model and factory exports.
 *
 * This entry point exposes the complete model layer of @ttoss/ui2:
 *   - Semantic resolver (resolveTokens, resolveRole, STATE_SELECTORS)
 *   - Component taxonomy (Responsibility, Evaluation, Consequence)
 *   - Component token catalog (COMPONENT_TOKENS)
 *   - Component factories (defineComponent, defineComposite)
 *
 * **Runtime environment note:**
 * The resolver, taxonomy, and COMPONENT_TOKENS exports are pure TypeScript with
 * no React dependency. The factory exports (defineComponent, defineComposite)
 * import React and @ark-ui/react — they require a React-capable environment.
 * Both are marked as `external` in the package build so consumers provide them.
 *
 * Intended consumers:
 *   - Component authors: import defineComponent / defineComposite
 *   - Contract test helpers: import resolveRole, ComponentContractConfig
 *   - AI agents or code generators: import the full model to generate or validate ui2 components
 *   - Tooling: import resolveTokens, COMPONENT_TOKENS, taxonomy consts
 */

// -- Resolver ---------------------------------------------------------------
export type {
  ColorRole,
  ColorSpec,
  Dimension,
  FslState,
  StateVarMap,
  TokenSpec,
  UxContext,
} from './_model/resolver';
export {
  generateComponentCss,
  resolveRole,
  resolveTokens,
  RESPONSIBILITY_UX_MAP,
  STATE_SELECTORS,
  UX_VALID_ROLES,
} from './_model/resolver';

// -- Component Factory ------------------------------------------------------
export type {
  ComponentMeta,
  ComponentProps,
  DefineComponentOptions,
  DefineComponentResult,
  ElementDescriptor,
} from './_model/defineComponent';
export { defineComponent } from './_model/defineComponent';
export type { ComponentContractConfig } from './_model/factory.types';

// -- Taxonomy ---------------------------------------------------------------
export type {
  ComponentExpression,
  Consequence,
  Evaluation,
  Responsibility,
} from './_model/taxonomy';
export { CONSEQUENCES, EVALUATIONS, RESPONSIBILITIES } from './_model/taxonomy';

// -- Component Tokens (B-05) ------------------------------------------------
export type {
  ComponentCssProperty,
  ComponentDeclaration,
  ComponentSpec,
  ComponentToken,
  ComponentTokenValue,
  ComponentValue,
} from './_model/componentTokens';
export { COMPONENT_TOKENS } from './_model/componentTokens';

// -- Composite Factory (B-07) -----------------------------------------------
export type {
  CompositeConfig,
  CompositeContext,
  CompositeMeta,
  DefineCompositeOptions,
  DefineCompositeResult,
  FieldContextProps,
} from './_model/defineComposite';
export { defineComposite } from './_model/defineComposite';
