# @ttoss/ui2

Semantic, token-native component library for ttoss. Built on [React Aria Components](https://react-spectrum.adobe.com/react-aria/) with `@ttoss/theme2` tokens.

Components are not visual variants of widgets — they are executable expressions of the [FSL](../../docs/website/docs/design/01-design-system/01-fsl) semantic model. A component's identity (`Entity`, `Structure`, `Interaction`, `Composition`) determines which tokens it may consume.

## Authoring

- **`src/tokens/CONTRACT.md`** — the authoring guide. Given an `Entity`, it specifies the exact `vars.*` paths, state cascade, and `data-*` conventions a component must use. Designed to be read by humans and AI agents.
- **`src/semantics/taxonomy.ts`** — the FSL vocabulary and legality matrices.
- **`CONTRIBUTING.md`** — how to add components, entities, and taxonomy terms.

Contract tests auto-discover every `*Meta` export from `src/index.ts` and validate it against the taxonomy + token hygiene rules. No manual registry.
