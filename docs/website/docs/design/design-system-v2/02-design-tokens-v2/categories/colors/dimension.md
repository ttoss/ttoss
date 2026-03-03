---
title: Color Dimensions
---

# Color Dimensions

The **dimension** segment of a semantic color token identifies _which part_ of a UI element the color applies to. Dimensions ensure that colours are applied consistently across components and help maintain contrast and hierarchy. Valid dimensions are:

## background

Colours applied to the surface behind content or controls. Examples: button fills, card backgrounds, navigation bars, input fields.

Use backgrounds to create contrast between containers and their surroundings. Background colours should never be transparent; if transparency is needed, consider the `overlay` dimension.

## text

Colours applied to typographic content—headings, body text, labels. Text colours must have sufficient contrast with their background. Avoid using saturated hues for large bodies of text; reserve those for smaller accents or headings.

## border

Colours applied to the edges of elements, including outlines, strokes and hairlines. Borders help separate elements and indicate interactive states. Border colours often come from neutral hues to avoid overwhelming the UI.

## icon

Colours applied to glyphs, icons or vector shapes that accompany text. Icons often match the role of the surrounding content (e.g. a positive icon uses a positive color).

## overlay

Colours applied on top of other content, such as scrims behind modals or tinted layers above images. Overlay colours usually combine a neutral base with an opacity to dim underlying content. Use overlay dimension tokens rather than backgrounds with alpha to maintain consistency.

## outline

Some components use **outline** colours distinct from borders. Outlines are thicker strokes used to indicate focus or selection (e.g. focus rings). Defining `outline` separately prevents confusion with structural borders.

## Choosing a dimension

1. **Match the element part.** Use `background` for fills, `border` for strokes, `text` for typography, `icon` for pictograms, `overlay` for masks and `outline` for focus rings.
2. **Keep semantics separate.** Don’t use `border` colours for text or vice versa. The palette for each dimension may differ to ensure appropriate contrast.
3. **Avoid “general” colours.** There is no “color” dimension. Always specify which part of the element you are styling.

Correct use of dimensions ensures consistent patterns and helps maintainers reason about theme adjustments.
