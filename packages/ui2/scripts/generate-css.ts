/* eslint-disable no-console */
/**
 * generate-css.ts — Generates the complete styles.css for @ttoss/ui2.
 *
 * This script produces the entire `styles.css` file from component definitions.
 * There is no hand-authored CSS — the file is a build artifact.
 *
 * **Auto-discovery:** Components and composites are discovered via filesystem
 * convention. Adding a new `src/components/Name/Name.tsx` that exports a
 * `*ComponentMeta` automatically includes it in CSS generation. Same for
 * `src/composites/Name/Name.tsx` with `*CompositeMeta`.
 *
 * Sections produced:
 *   1. File header comment
 *   2. @layer declaration (ui2.behavioral, ui2.components)
 *   3. @layer ui2.behavioral — focus ring + disabled cursor (static template)
 *   4. @layer ui2.components:
 *      a. Per-component layout CSS (from componentMeta.layout)
 *      b. Per-component focus ring overrides (for input)
 *      c. Per-composite layout CSS (from compositeMeta.layout)
 *      d. Per-component color-state CSS (from generateComponentCss())
 *
 * **When to run:**
 *   pnpm run generate:css
 *
 * Run after:
 *   - Adding a new component
 *   - Changing a component's layout, responsibility, dimensions, or withInvalidOverlay
 *   - Modifying token structure in @ttoss/theme2 that affects state CSS
 */

import * as fs from 'node:fs';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ComponentMeta } from '../src/_model/defineComponent';
import type { CompositeMeta } from '../src/_model/defineComposite';
import type {
  LayoutDeclaration,
  LayoutToken,
} from '../src/_model/layoutTokens';
import { generateComponentCss } from '../src/_model/resolver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const srcDir = path.resolve(__dirname, '../src');
const stylesPath = path.resolve(srcDir, 'styles.css');

// ---------------------------------------------------------------------------
// Auto-discovery
// ---------------------------------------------------------------------------

/**
 * Discover component metas by scanning `src/components/` directories.
 * Convention: each `src/components/Name/Name.tsx` exports `{camelName}ComponentMeta`.
 */
const discoverComponentMetas = (): ComponentMeta[] => {
  const componentsDir = path.resolve(srcDir, 'components');
  const dirs = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => {
      return d.isDirectory();
    })
    .map((d) => {
      return d.name;
    });

  const metas: ComponentMeta[] = [];
  for (const dir of dirs) {
    const modulePath = path.resolve(componentsDir, dir, `${dir}.tsx`);
    if (!fs.existsSync(modulePath)) continue;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(modulePath) as Record<string, unknown>;
    const metaKey = Object.keys(mod).find((k) => {
      return k.endsWith('ComponentMeta');
    });
    if (metaKey) {
      metas.push(mod[metaKey] as ComponentMeta);
    }
  }

  metas.sort((a, b) => {
    return a.scope.localeCompare(b.scope);
  });
  return metas;
};

/**
 * Discover composite metas by scanning `src/composites/` directories.
 * Convention: each `src/composites/Name/Name.tsx` exports `{camelName}CompositeMeta`.
 */
const discoverCompositeMetas = (): CompositeMeta[] => {
  const compositesDir = path.resolve(srcDir, 'composites');
  if (!fs.existsSync(compositesDir)) return [];

  const dirs = fs
    .readdirSync(compositesDir, { withFileTypes: true })
    .filter((d) => {
      return d.isDirectory();
    })
    .map((d) => {
      return d.name;
    });

  const metas: CompositeMeta[] = [];
  for (const dir of dirs) {
    const modulePath = path.resolve(compositesDir, dir, `${dir}.tsx`);
    if (!fs.existsSync(modulePath)) continue;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(modulePath) as Record<string, unknown>;
    const metaKey = Object.keys(mod).find((k) => {
      return k.endsWith('CompositeMeta');
    });
    if (metaKey) {
      metas.push(mod[metaKey] as CompositeMeta);
    }
  }

  metas.sort((a, b) => {
    return a.scope.localeCompare(b.scope);
  });
  return metas;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert camelCase CSS property to kebab-case.
 * e.g. 'paddingBlock' → 'padding-block', 'fontOpticalSizing' → 'font-optical-sizing'
 */
const camelToKebab = (s: string): string => {
  return s.replace(/[A-Z]/g, (m) => {
    return `-${m.toLowerCase()}`;
  });
};

/**
 * Check if a value is a layout token (--tt-*) that needs var() wrapping.
 */
const isLayoutToken = (v: string | number): v is LayoutToken => {
  return typeof v === 'string' && v.startsWith('--tt-');
};

/**
 * Format a layout value for CSS output.
 * - LayoutToken → var(--tt-...)
 * - string → as-is
 * - number → as-is (for things like flexShrink: 0)
 */
const formatValue = (v: string | number): string => {
  if (isLayoutToken(v)) return `var(${v})`;
  return String(v);
};

/**
 * Generate a CSS rule block from a selector and layout declaration.
 */
const layoutToCssBlock = (
  selector: string,
  layout: LayoutDeclaration
): string => {
  const entries = Object.entries(layout);
  if (entries.length === 0) return '';

  const props = entries
    .map(([prop, val]) => {
      return `  ${camelToKebab(prop)}: ${formatValue(val!)};`;
    })
    .join('\n');

  return `${selector} {\n${props}\n}`;
};

// ---------------------------------------------------------------------------
// Component layout CSS generation
// ---------------------------------------------------------------------------

const generateComponentLayoutCss = (meta: ComponentMeta): string => {
  if (!meta.layout) return '';

  const baseSelector = `[data-scope='${meta.scope}'][data-part='root']`;
  const blocks: string[] = [];

  // Base layout
  blocks.push(layoutToCssBlock(baseSelector, meta.layout.base));

  // Size variants
  if (meta.layout.sizes) {
    for (const [size, overrides] of Object.entries(meta.layout.sizes)) {
      if (overrides) {
        blocks.push(
          layoutToCssBlock(`${baseSelector}[data-size='${size}']`, overrides)
        );
      }
    }
  }

  return blocks.filter(Boolean).join('\n\n');
};

// ---------------------------------------------------------------------------
// Composite layout CSS generation
// ---------------------------------------------------------------------------

const generateCompositeLayoutCss = (meta: CompositeMeta): string => {
  if (!meta.layout) return '';

  const baseSelector = `[data-scope='${meta.scope}'][data-part='root']`;
  return layoutToCssBlock(baseSelector, meta.layout.base);
};

// ---------------------------------------------------------------------------
// Static behavioral layer (template)
// ---------------------------------------------------------------------------

const BEHAVIORAL_LAYER = `@layer ui2.behavioral {
  /* Focus ring — keyboard-accessible, scoped to ui2 components */
  [data-scope]:focus-visible {
    outline: var(--tt-focus-ring-width) var(--tt-focus-ring-style)
      var(--tt-focus-ring-color);
    outline-offset: 2px;
  }

  /* Disabled cursor — shown for any ui2 component in disabled state */
  [data-scope]:disabled,
  [data-scope][data-disabled] {
    cursor: not-allowed;
  }
}`;

// ---------------------------------------------------------------------------
// Per-component extra rules (focus ring overrides, etc.)
// ---------------------------------------------------------------------------

/**
 * Input needs its own focus-visible rule (layout concern, not color).
 * This is a structural override — Input uses outline:none in base layout
 * and has its own focus ring with outline-offset.
 */
const INPUT_FOCUS_RING = `/* Input focus ring override (layout concern) */
[data-scope='input'][data-part='root']:focus-visible {
  outline: var(--tt-focus-ring-width) var(--tt-focus-ring-style)
    var(--tt-focus-ring-color);
  outline-offset: 2px;
}`;

// ---------------------------------------------------------------------------
// Assemble the complete styles.css
// ---------------------------------------------------------------------------

const componentMetas = discoverComponentMetas();
const compositeMetas = discoverCompositeMetas();

console.log(
  `Discovered ${componentMetas.length} components: ${componentMetas
    .map((m) => {
      return m.scope;
    })
    .join(', ')}`
);
console.log(
  `Discovered ${compositeMetas.length} composites: ${compositeMetas
    .map((m) => {
      return m.scope;
    })
    .join(', ')}`
);

// Generate layout CSS blocks
const layoutBlocks = componentMetas
  .map(generateComponentLayoutCss)
  .filter(Boolean);

// Generate composite layout blocks
const compositeLayoutBlocks = compositeMetas
  .map(generateCompositeLayoutCss)
  .filter(Boolean);

// Generate color-state CSS blocks
const colorBlocks = componentMetas
  .map((meta) => {
    return generateComponentCss({
      scope: meta.scope,
      responsibility: meta.responsibility,
      dimensions: meta.dimensions,
      withInvalidOverlay: meta.withInvalidOverlay,
    });
  })
  .filter(Boolean);

// Assemble the file
const FILE_HEADER = `/*
 * @ttoss/ui2 — Global Styles (generated)
 *
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Regenerate: pnpm run generate:css
 * Drift check: cross-system.test.ts (section 4)
 *
 * Architecture:
 *   @layer ui2.behavioral  — Universal cross-component rules (focus ring,
 *                            disabled cursor). Applied to any element carrying
 *                            [data-scope] — the ui2 component marker.
 *
 *   @layer ui2.components  — Per-component identity rules (layout + color).
 *                            Layout: [data-scope][data-part] + [data-size] selectors.
 *                            Color:  [data-scope][data-part][data-variant] selectors
 *                            referencing theme tokens directly via var(--tt-*).
 *
 * Usage:
 *   import '@ttoss/ui2/styles.css';
 */`;

const componentsLayerContent = [
  '/* ── Layout ── */\n',
  ...layoutBlocks,
  '',
  INPUT_FOCUS_RING,
  '',
  '/* ── Composite Layout ── */\n',
  ...compositeLayoutBlocks,
  '',
  '/* ── Color States ── */\n',
  ...colorBlocks,
].join('\n\n');

const output = [
  FILE_HEADER,
  '',
  '/* Declare layer order. Lower layers have lower specificity than later ones. */',
  '@layer ui2.behavioral, ui2.components;',
  '',
  BEHAVIORAL_LAYER,
  '',
  `@layer ui2.components {\n${componentsLayerContent}\n}`,
  '',
].join('\n');

fs.writeFileSync(stylesPath, output, 'utf-8');
console.log(`styles.css generated — ${output.split('\n').length} lines`);
