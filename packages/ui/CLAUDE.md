# CLAUDE.md — `@ttoss/ui`

## Chakra UI (`src/chakra/`)

Recipes and slot recipes must contain **only color tokens** — never spacing, sizing, typography, border-width, layout, or other non-color properties. Use Chakra UI defaults for everything except color.

Use ttoss semantic color tokens from these categories: `navigation`, `display`, `action`, `input`, `feedback`.

New recipes go in `src/chakra/recipes/`; slot recipes in `src/chakra/slotRecipes/`. Both are auto-integrated by `ChakraThemeProvider.tsx`.
