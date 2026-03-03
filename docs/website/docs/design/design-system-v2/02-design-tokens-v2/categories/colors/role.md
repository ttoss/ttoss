---
title: Color Roles
---

# Color Roles

The **role** segment of a semantic color token captures _why_ a color is used. Roles communicate either hierarchy (primary vs secondary vs tertiary vs neutral) or semantic meaning (positive, negative, warning, info). Using roles consistently helps users understand significance, reinforces brand identity and improves accessibility.

## Hierarchical roles

- **primary:** The most prominent element in a group. Use for primary navigation items, primary buttons and headings. Primary colours draw the user’s attention and should have the highest contrast.
- **secondary:** Secondary actions or elements of lesser importance. Secondary colours support primary actions without competing with them.
- **tertiary:** The least prominent or most subtle variant. Use for tertiary buttons, ghost actions or meta information. Tertiary colours should have low emphasis.
- **neutral:** Elements that should not stand out, such as dividers, frames or subtle text. Neutral tones are often shades of grey or desaturated colours.

## Status roles

- **positive:** Indicates success or confirmation. Use for success messages, completed states and approval icons.
- **negative:** Indicates an error or failure. Use for error messages, invalid inputs and destructive actions.
- **warning:** Indicates caution, potential issues or irreversible actions. Use for warning banners and confirmations.
- **info:** Provides neutral information or secondary feedback. Use for informational messages, hints and tooltips.

## One role per token

A semantic token must have _exactly one_ role. Do not combine roles (e.g. “primary positive”), as this mixes hierarchy with status and creates ambiguity. Choose the most appropriate role for the context. For example, a “delete” button should use `negative` even if it is a primary action.

## Choosing the right role

1. **Determine the component’s purpose.** Is it a primary call to action, a secondary action, or supportive content?
2. **Identify status.** Does the element convey success, error, warning or information? If so, prefer status roles over hierarchy.
3. **Avoid using roles to fix contrast.** If a color fails contrast requirements, adjust the core palette or theme rather than switching from primary to secondary.

Consistent roles make the UI predictable and accessible. When introducing a new role, follow the governance process to update documentation and themes.
