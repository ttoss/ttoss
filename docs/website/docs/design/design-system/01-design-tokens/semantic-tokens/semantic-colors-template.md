---
title: Semantic Colors Template
---

```javascript
export const semanticColors = {
  // ===== ACTION =====
  action: {
    background: {
      primary: {
        default: core.colors.main,
        hover: 'lighten(main,6%)', // Derived: slightly lighter for hover feedback
        active: 'darken(main,8%)', // Derived: darker for pressed state
        disabled: core.colors.gray300, //   commerce: {
    background: {
      primary: { default: core.colors.lightNeutral },   // Product card backgrounds
      accent: { default: core.colors.accent },          // Promo badges
    },
    border: {
      muted: { default: core.colors.gray300 },          // Product borders
      caution: { default: core.colors.amber600 },       // Stock warnings
    },
    text: {
      primary: { default: core.colors.gray700 },        // Product text
      positive: { default: core.colors.teal600 },       // "in stock"
      negative: { default: core.colors.red600 },        // "out of stock"
      accent: { default: core.colors.accent },          // Prices/promos
    },
  }, state
        selected: core.colors.main, // Same as default for toggles
      },
      secondary: {
        default: core.colors.lightNeutral, // Brand light neutral for secondary actions
        hover: 'darken(lightNeutral,4%)', // Derived: subtle hover
        active: 'darken(lightNeutral,8%)', // Derived: pressed feedback
        disabled: core.colors.gray300, // Consistent disabled
        selected: core.colors.lightNeutral, // Same as default
      },
      accent: {
        default: core.colors.accent,
        hover: 'lighten(accent,6%)', // Derived: brighter accent hover
        active: 'darken(accent,8%)', // Derived: pressed accent
        disabled: core.colors.gray300,
        selected: core.colors.accent,
      },
      negative: {
        default: core.colors.red600, // Primary error action (not red700 - too dark for bg)
        hover: 'lighten(red600,6%)', // Derived: lighter hover
        active: 'darken(red600,8%)', // Derived: pressed
        disabled: core.colors.gray300,
        selected: core.colors.red600,
      },
      // positive/caution rarely used as button fills to maintain clear hierarchy
    },
    border: {
      primary: {
        default: core.colors.main,
        hover: core.colors.main, // Border stays consistent on hover
        active: core.colors.main, // Border stays consistent when pressed
        focused: core.colors.accent, // Focus ring using accent
        disabled: core.colors.gray300,
        selected: core.colors.main,
      },
      muted: {
        default: core.colors.gray400, // Visible but subtle border
        hover: core.colors.gray400, // Border stays consistent
        active: core.colors.gray400,
        focused: core.colors.accent, // Focus ring using accent
        disabled: core.colors.gray300,
        selected: core.colors.gray400,
      },
      negative: {
        default: core.colors.red600, // Strong error border
        hover: core.colors.red600,
        active: core.colors.red600,
        focused: core.colors.red600, // Error focus keeps error color
        disabled: core.colors.gray300,
        selected: core.colors.red600,
      },
    },
    text: {
      primary: {
        default: core.colors.lightNeutral, // High contrast on dark action backgrounds
        hover: core.colors.lightNeutral, // Text color stays consistent
        active: core.colors.lightNeutral,
        disabled: core.colors.gray500, // Reduced contrast for disabled
        selected: core.colors.lightNeutral,
      },
      secondary: {
        default: core.colors.gray700, // For secondary buttons (on light backgrounds)
        hover: core.colors.gray700,
        active: core.colors.gray700,
        disabled: core.colors.gray500,
        selected: core.colors.gray700,
      },
      accent: {
        default: core.colors.lightNeutral, // High contrast on accent backgrounds
        hover: core.colors.lightNeutral,
        active: core.colors.lightNeutral,
        disabled: core.colors.gray500,
        selected: core.colors.lightNeutral,
      },
      negative: {
        default: core.colors.lightNeutral, // High contrast on error backgrounds
        hover: core.colors.lightNeutral,
        active: core.colors.lightNeutral,
        disabled: core.colors.gray500,
        selected: core.colors.lightNeutral,
      },
      // focus not applied to text glyphs; focus shown via border/outline
    },
    shadow: {
      primary: {
        default: 'elevation.level2', // Semantic reference to elevation system
        hover: 'elevation.level3', // Higher elevation on hover
        active: 'elevation.level1', // Lower elevation when pressed
        disabled: 'elevation.none', // No shadow when disabled
        selected: 'elevation.level2', // Same as default
      },
    },
  },

  // ===== INPUT =====
  input: {
    background: {
      primary: {
        default: core.colors.lightNeutral, // Brand light neutral for input fields
        disabled: core.colors.gray200, // Light gray for disabled inputs
        selected: core.colors.lightNeutral, // Same as default when selected/focused
      },
      muted: {
        default: core.colors.gray100, // Very subtle background
        disabled: core.colors.gray200,
      },
      // no hover/active for input backgrounds; interaction shown via border/focus
    },
    border: {
      muted: {
        default: core.colors.gray300, // Subtle default border
        hover: core.colors.gray400, // Slightly stronger on hover
        focused: core.colors.accent, // Accent focus ring
        disabled: core.colors.gray200, // Lighter when disabled
      },
      negative: {
        default: core.colors.red500, // Error border (not red700 - too dark)
        hover: core.colors.red500,
        focused: core.colors.red500, // Keep error color on focus
        disabled: core.colors.gray200,
      },
      positive: {
        default: core.colors.teal600, // Success border
        hover: core.colors.teal600,
        focused: core.colors.teal600,
        disabled: core.colors.gray200,
      },
      caution: {
        default: core.colors.amber600, // Warning border
        hover: core.colors.amber600,
        focused: core.colors.amber600,
        disabled: core.colors.gray200,
      },
    },
    text: {
      primary: {
        default: core.colors.gray700, // Strong readable text
        disabled: core.colors.gray500, // Reduced contrast when disabled
        selected: core.colors.gray700, // Same as default when input selected
      },
      secondary: {
        default: core.colors.gray600, // Slightly muted text
        disabled: core.colors.gray500,
      },
      muted: {
        default: core.colors.gray500, // Placeholder text
        disabled: core.colors.gray400,
      },
      accent: { default: core.colors.accent },
      negative: { default: core.colors.red600 }, // Error text (readable)
      positive: { default: core.colors.teal600 },
      caution: { default: core.colors.amber600 },
      // hover/active not applied to input text; selection is field state
    },
    shadow: {
      primary: {
        default: 'elevation.none', // No shadow by default
        focused: 'elevation.level1', // Subtle shadow on focus
      },
    },
  },

  // ===== CONTENT ===== (static presentation and selectable lists/tables)
  content: {
    background: {
      primary: {
        default: core.colors.lightNeutral, // Base page surface
        selected: core.colors.gray200, // Selected list item
      },
      secondary: {
        default: core.colors.gray100, // Card/section surfaces
        hover: core.colors.gray100, // Can add hover for interactive cards
        selected: core.colors.gray200,
      },
      muted: {
        default: core.colors.gray100, // Very subtle surfaces
        selected: core.colors.gray200,
      },
      // generally no active state for content; selected handles chosen items
    },
    border: {
      primary: {
        default: core.colors.main, // Brand borders for important content
        selected: core.colors.accent, // Accent for selected content
      },
      secondary: { default: core.colors.gray600 }, // Visible structural borders
      muted: {
        default: core.colors.gray300, // Subtle dividers
        selected: core.colors.gray400, // Slightly stronger when selected
      },
    },
    text: {
      primary: { default: core.colors.gray700 }, // Main body text
      secondary: { default: core.colors.gray600 }, // Supporting text
      muted: { default: core.colors.gray500 }, // De-emphasized text
      accent: { default: core.colors.accent }, // Links, highlights
      negative: { default: core.colors.red600 }, // Error text
      positive: { default: core.colors.teal600 }, // Success text
      caution: { default: core.colors.amber600 }, // Warning text
    },
    shadow: {
      surface: {
        default: 'elevation.none', // No shadow by default
        hover: 'elevation.level1', // Subtle lift on hover (for cards)
        selected: 'elevation.level1', // Subtle lift when selected
      },
    },
  },

  // ===== FEEDBACK ===== (alerts/status messages; generally non-interactive)
  feedback: {
    background: {
      primary: { default: core.colors.lightNeutral }, // Neutral info background
      positive: { default: 'tint(teal600,85%)' }, // Subtle success background
      negative: { default: core.colors.red100 }, // Subtle error background
      caution: { default: 'tint(amber600,85%)' }, // Subtle warning background
      // no hover/active/disabled: messages are static; selected doesn't apply
    },
    border: {
      positive: { default: core.colors.teal600 },
      negative: { default: core.colors.red500 }, // Slightly lighter than red600 for borders
      caution: { default: core.colors.amber600 },
    },
    text: {
      primary: { default: core.colors.gray700 }, // Dark text on light backgrounds
      secondary: { default: core.colors.gray600 },
      positive: { default: core.colors.teal600 }, // On light success backgrounds
      negative: { default: core.colors.red600 }, // On light error backgrounds
      caution: { default: core.colors.amber600 }, // On light warning backgrounds
    },
    shadow: {
      surface: { default: 'elevation.level1' }, // Subtle highlight for banners/toasts
    },
  },

  // ===== NAVIGATION ===== (wayfinding — items can be interactive)
  navigation: {
    background: {
      primary: {
        default: core.colors.main, // Brand navigation background
        hover: 'lighten(main,4%)', // Subtle hover for nav items
        active: 'darken(main,4%)', // Active press state
        selected: 'lighten(main,8%)', // Current page/section
      },
      muted: {
        default: core.colors.gray100, // Secondary navigation areas
        hover: core.colors.gray200,
        active: core.colors.gray300,
        selected: core.colors.gray200,
      },
      // disabled rare for navigation containers; omitted
    },
    border: {
      primary: {
        default: core.colors.main, // Brand borders
        selected: core.colors.accent, // Accent highlight for current page
      },
      muted: { default: core.colors.gray400 },
      // focus shown on item via outline external => can map to global focus ring tokens
    },
    text: {
      primary: {
        default: core.colors.lightNeutral, // High contrast on dark nav
        hover: core.colors.lightNeutral,
        active: core.colors.lightNeutral,
        selected: core.colors.lightNeutral,
      },
      accent: {
        default: core.colors.accent, // Accent links/highlights in nav
        hover: 'lighten(accent,10%)', // Brighter on hover
        active: 'darken(accent,5%)',
        selected: core.colors.accent,
      },
      muted: {
        default: core.colors.gray300, // Subdued nav text
        selected: core.colors.gray700, // Darker when selected for contrast
      },
      negative: { default: core.colors.red400 }, // Error nav items (lighter for dark bg)
      // disabled for nav links is rare; avoid
    },
  },

  // ===== DISCOVERY ===== (search/filter/highlight — part can be interactive)
  discovery: {
    background: {
      accent: {
        default: core.colors.accent, // Highlight/filter badges
        selected: 'darken(accent,8%)', // Active filter state
      },
    },
    border: {
      muted: {
        default: core.colors.gray300, // Search field borders
        hover: core.colors.gray400,
        focused: core.colors.accent, // Focus state
      },
      accent: {
        default: core.colors.accent,
        focused: 'darken(accent,10%)', // Stronger focus
      },
    },
    text: {
      primary: { default: core.colors.gray700 }, // Search results text
      secondary: { default: core.colors.gray600 }, // Meta information
      muted: { default: core.colors.gray500 }, // Helper text
      accent: {
        default: core.colors.accent, // Links/result highlights
        hover: 'darken(accent,8%)', // Hover state for links
        active: 'darken(accent,12%)',
      },
    },
  },

  // ===== GUIDANCE ===== (proactive/educational; generally non-interactive)
  guidance: {
    background: {
      primary: { default: core.colors.gray100 }, // Neutral background for tips/help
    },
    border: {
      muted: { default: core.colors.gray300 }, // Subtle borders
    },
    text: {
      primary: { default: core.colors.gray700 }, // Main guidance text
      secondary: { default: core.colors.gray600 }, // Supporting text
    },
    // no hover/active; focus only if guidance is focusable (e.g., modal), then use global focus ring tokens
  },

  // ===== SPECIALIZED EXPANSIONS =====
  // Use only when necessary where the application requires them
  analytics: {
    background: {
      primary: { default: core.colors.lightNeutral }, // Chart canvas
      secondary: { default: core.colors.gray100 }, // Supporting surfaces
    },
    border: { muted: { default: core.colors.gray300 } },
    text: {
      primary: { default: core.colors.gray700 }, // Chart labels
      secondary: { default: core.colors.gray600 }, // Secondary labels
      accent: { default: core.colors.accent }, // Highlighted data points
    },
    // interaction states generally don't apply to charts at token level; selection handled in component
  },

  social: {
    background: {
      primary: {
        default: core.colors.lightNeutral,      // Social card backgrounds
        hover: core.colors.gray100,             // Hover state for interactive cards
        active: core.colors.gray200,
        disabled: core.colors.gray200,
      },
    },
    border: {
      muted: {
        default: core.colors.gray300,           // Card borders
        hover: core.colors.gray400,
        active: core.colors.gray400,
        focused: core.colors.accent,
        disabled: core.colors.gray200,
      },
    },
    text: {
      primary: {
        default: core.colors.gray700,           // Main social text
        hover: core.colors.gray700,
        active: core.colors.gray700,
        disabled: core.colors.gray500,
      },
      accent: {
        default: core.colors.accent,            // Links, reactions
        hover: 'darken(accent,8%)',
        active: 'darken(accent,12%)',
      },
    },
  },

  commerce: {
    background: {
      primary: { default: core.colors.white },
      accent: { default: core.colors.accent }, // ex.: promo badge
    },
    border: {
      muted: { default: core.colors.gray300 },
      caution: { default: core.colors.amber600 },
    },
    text: {
      primary: { default: core.colors.black },
      positive: { default: core.colors.teal600 }, // ex.: “in stock”
      negative: { default: core.colors.red700 }, // ex.: “out of stock”
      accent: { default: core.colors.accent }, // ex.: preço/promos
    },
  },

  gamification: {
    background: {
      accent: { default: core.colors.accent },          // Achievement badges
      positive: { default: core.colors.teal600 },       // Progress success
    },
    border: {
      muted: { default: core.colors.gray300 },          // Progress bar borders
    },
    text: {
      primary: { default: core.colors.gray700 },        // Main gamification text
      accent: { default: core.colors.accent },          // Highlighted scores
      positive: { default: core.colors.teal600 },       // Success states
    },
  },
};
```
