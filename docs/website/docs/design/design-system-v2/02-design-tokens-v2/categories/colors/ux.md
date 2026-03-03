---
title: Color UX Contexts
---

# Color UX Contexts

Semantic colours begin with a **context** segment that describes _where_ in the user interface the color is applied. Contexts help group tokens by UI areas and enforce consistency across components. The following contexts are defined in our system; avoid inventing new ones without consulting the design system team.

## navigation

Colours used in navigation bars, sidebars, breadcrumbs and tabs. Navigation tokens define backgrounds, text and borders for the containers that help users move through the product.

Example semantic tokens:

- `navigation.primary.background.default`
- `navigation.secondary.text.hover`
- `navigation.tertiary.border.active`

## input

Colours for form fields (text inputs, selects, checkboxes, radios, toggles, sliders). Input tokens cover backgrounds, borders, text and icons inside these controls, including interactive states.

Example semantic tokens:

- `input.primary.background.default`
- `input.primary.border.focus`
- `input.primary.text.disabled`

## action

Colours for buttons, links, dropdown triggers and other elements that initiate actions. Use `action` tokens to style calls‑to‑action with different roles (primary, secondary, tertiary).

Example semantic tokens:

- `action.primary.background.hover`
- `action.secondary.text.default`
- `action.tertiary.border.active`

## content

Colours for general content such as paragraphs, headings, lists, tables and cards. These tokens cover both text and backgrounds for containers that present information rather than interactive elements.

Example semantic tokens:

- `content.primary.text.default`
- `content.neutral.background.emphasis`
- `content.secondary.border.disabled`

## feedback

Colours for messaging components that provide status feedback to the user—alerts, notifications, banners, tooltips and inline error messages. Feedback tokens include roles like positive, negative, warning and info.

Example semantic tokens:

- `feedback.positive.background.default`
- `feedback.negative.icon.default`
- `feedback.warning.border.default`

## surface

Colours that define large structural surfaces such as the application shell, modals, sheets and panels. Surface tokens set the overall tone of your UI.

Example semantic tokens:

- `surface.default.background.default`
- `surface.elevated.background.default`
- `surface.muted.border.default`

## overlay

Colours for scrims, masks and backgrounds that sit above content (e.g. when a modal is open). Overlay tokens include opacities and tinted colours.

Example semantic tokens:

- `overlay.backdrop.background.default`
- `overlay.spinner.icon.default`

## dataviz

Colours used exclusively for data visualization (charts, graphs, diagrams). These tokens do not apply to general UI elements and follow specific rules for readability. See [Data Visualization Colours](./dataviz.md) for details.
