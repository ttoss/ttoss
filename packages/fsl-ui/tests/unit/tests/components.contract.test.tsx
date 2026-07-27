/**
 * Component contract tests — structural enforcement of invariants that
 * `src/tokens/CONTRACT.md` specifies for every component in `@ttoss/fsl-ui`.
 *
 * The suite is **auto-discovering**: anything exported from `src/index.ts`
 * whose name ends in `Meta` is validated. Adding a new component is:
 *   1. Define `fooMeta satisfies ComponentMeta<E>` in the component file.
 *   2. Export `foo` and `fooMeta` from `src/index.ts`.
 * The contract tests pick it up without edits here.
 *
 * Invariants covered:
 *   1. Registry ↔ export sync   — every `*Meta` is paired with its component.
 *   2. `*Meta` is a valid `ComponentMeta` at runtime.
 *   3. Meta values are legal per taxonomy matrices.
 *   4. No `var(--x, fallback)` in `src/components/**`.
 *   5. No raw color literals (hex / rgb / hsl) in `src/components/**`.
 *   6. `toCssVarName` output matches the `--tt-*` prefix convention.
 *   7. DOM data-attributes — rendered output carries `data-scope`/`data-part`
 *      consistent with the component's `*Meta` declaration.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { render } from '@testing-library/react';
import { toCssVarName } from '@ttoss/fsl-theme/css';
import { vars } from '@ttoss/fsl-theme/vars';
import { FIELD_ROW } from 'src/components/Field/anatomy';
import * as pkg from 'src/index';
import {
  ENTITIES,
  ENTITY_COMPOSITION,
  ENTITY_CONSEQUENCE,
  ENTITY_EVALUATION,
  ENTITY_STRUCTURE,
  STRUCTURAL_ROLES,
} from 'src/semantics/taxonomy';
import { FOCUS_RING_OFFSET } from 'src/tokens/focusRing';
import { ENTITY_TOKEN_MAPPING } from 'src/tokens/projection';

import { DOM_FIXTURES } from './domFixtures';

// ---------------------------------------------------------------------------
// Auto-discovery helpers
// ---------------------------------------------------------------------------

type UnknownMeta = {
  displayName: string;
  entity: string;
  structure: string;
  composition?: string;
  consequence?: string;
};

const isMetaShape = (value: unknown): value is UnknownMeta => {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.displayName === 'string' &&
    typeof m.entity === 'string' &&
    typeof m.structure === 'string' &&
    (m.composition === undefined || typeof m.composition === 'string') &&
    (m.consequence === undefined || typeof m.consequence === 'string')
  );
};

/** `[metaExportName, componentExportName, meta]` tuples for every `*Meta` export. */
const discoveredMetas: Array<[string, string, UnknownMeta]> = Object.entries(
  pkg as Record<string, unknown>
)
  .filter(([name]) => {
    return name.endsWith('Meta') && name !== 'Meta';
  })
  .map(([metaName, value]) => {
    // `buttonMeta` → `Button`, `dialogMeta` → `Dialog`.
    // Component exports are PascalCase; metas are camelCase.
    const base = metaName.slice(0, -'Meta'.length);
    const componentName = base.charAt(0).toUpperCase() + base.slice(1);
    if (!isMetaShape(value)) {
      throw new Error(
        `Export "${metaName}" from src/index.ts is not a ComponentMeta shape.`
      );
    }
    return [metaName, componentName, value];
  });

// ---------------------------------------------------------------------------
// Source-file invariants (read .tsx files once, reuse across tests)
// ---------------------------------------------------------------------------

const SOURCE_ROOTS = [
  resolve(__dirname, '../../../src/components'),
  resolve(__dirname, '../../../src/composites'),
];

const listTsxFiles = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsxFiles(full));
    } else if (entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
};

const componentSources: Array<[string, string]> = SOURCE_ROOTS.flatMap(
  (root) => {
    return listTsxFiles(root).map((file) => {
      return [file.replace(`${root}/`, ''), readFileSync(file, 'utf8')] as [
        string,
        string,
      ];
    });
  }
);

// Strip comments before scanning literal patterns so rationale in comments
// (e.g. "use a hex like #AABBCC") does not trip the test.
const stripComments = (source: string): string => {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1'); // line comments (avoid URLs)
};

// ---------------------------------------------------------------------------
// 1. Registry ↔ export sync
// ---------------------------------------------------------------------------

describe('contract: export sync', () => {
  test('at least one *Meta is exported (sanity)', () => {
    expect(discoveredMetas.length).toBeGreaterThan(0);
  });

  test.each(discoveredMetas)(
    '%s is paired with a component export named %s',
    (_metaName, componentName) => {
      expect(pkg).toHaveProperty(componentName);
      expect(typeof (pkg as Record<string, unknown>)[componentName]).toBe(
        'function'
      );
    }
  );

  test.each(discoveredMetas)(
    '%s.displayName matches the paired component name (%s)',
    (_metaName, componentName, meta) => {
      expect(meta.displayName).toBe(componentName);
    }
  );
});

// ---------------------------------------------------------------------------
// 2. ComponentMeta shape
// ---------------------------------------------------------------------------

describe('contract: meta shape', () => {
  test.each(discoveredMetas)(
    '%s has non-empty displayName, entity, structure',
    (_metaName, _componentName, meta) => {
      expect(meta.displayName).not.toBe('');
      expect(meta.entity).not.toBe('');
      expect(meta.structure).not.toBe('');
    }
  );
});

// ---------------------------------------------------------------------------
// 3. Legality per taxonomy matrices
// ---------------------------------------------------------------------------

describe('contract: taxonomy legality', () => {
  test.each(discoveredMetas)(
    '%s.entity is a known Entity',
    (_metaName, _componentName, meta) => {
      expect(ENTITIES).toContain(meta.entity);
    }
  );

  test.each(discoveredMetas)(
    '%s.structure is a known StructuralRole',
    (_metaName, _componentName, meta) => {
      expect(STRUCTURAL_ROLES).toContain(meta.structure);
    }
  );

  test.each(discoveredMetas)(
    '%s.structure is legal for %s.entity',
    (_metaName, _componentName, meta) => {
      const legal = ENTITY_STRUCTURE[
        meta.entity as keyof typeof ENTITY_STRUCTURE
      ] as ReadonlyArray<string>;
      expect(legal).toContain(meta.structure);
    }
  );

  test.each(discoveredMetas)(
    '%s.composition (if set) is legal for %s.entity',
    (_metaName, _componentName, meta) => {
      if (meta.composition === undefined) return;
      const legal = ENTITY_COMPOSITION[
        meta.entity as keyof typeof ENTITY_COMPOSITION
      ] as ReadonlyArray<string>;
      expect(legal).toContain(meta.composition);
    }
  );

  test.each(discoveredMetas)(
    '%s.consequence (if set) is legal for %s.entity',
    (_metaName, _componentName, meta) => {
      if (meta.consequence === undefined) return;
      const legal = ENTITY_CONSEQUENCE[
        meta.entity as keyof typeof ENTITY_CONSEQUENCE
      ] as ReadonlyArray<string>;
      expect(legal).toContain(meta.consequence);
    }
  );

  test.each(discoveredMetas)(
    '%s.entity has a defined evaluation list (may be empty for data-entry entities)',
    (_metaName, _componentName, meta) => {
      // Per FSL §10.5 parallel and the State-vs-Evaluation distinction:
      // Input and Selection entities legitimately have an EMPTY evaluation
      // list — they do not carry authorial emphasis. Validation feedback
      // flows through the `invalid` State instead. We only assert that the
      // entity has a defined entry in ENTITY_EVALUATION.
      const evaluations = ENTITY_EVALUATION[
        meta.entity as keyof typeof ENTITY_EVALUATION
      ] as ReadonlyArray<string> | undefined;
      expect(Array.isArray(evaluations)).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// 4. Token hygiene in component sources
// ---------------------------------------------------------------------------

describe('contract: token hygiene', () => {
  // `var(--tt-*, fallback)` is forbidden — fallbacks on THEME tokens mask
  // missing token coverage and create silent drift across themes.
  // Host knobs (`--fsl-*`, CONTRACT.md §7) are the one exception and are
  // covered by the escape-hatch suite below.
  const THEME_VAR_WITH_FALLBACK = /\bvar\(\s*--tt-[^,)]+,[^)]*\)/;

  test.each(componentSources)(
    '%s contains no var(--tt-*, fallback)',
    (_path, source) => {
      expect(stripComments(source)).not.toMatch(THEME_VAR_WITH_FALLBACK);
    }
  );

  // Raw `var(--…)` reads outside the two sanctioned namespaces (`--tt-`
  // theme tokens emitted by `vars.*`, `--fsl-` host knobs via `fslVar`)
  // would create an unreviewable styling side channel.
  const FOREIGN_VAR = /\bvar\(\s*--(?!tt-|fsl-)/;

  test.each(componentSources)(
    '%s reads no CSS variables outside the --tt-/--fsl- namespaces',
    (_path, source) => {
      expect(stripComments(source)).not.toMatch(FOREIGN_VAR);
    }
  );

  // Raw color literals bypass the semantic token layer. Components must
  // only consume colors via `vars.colors.*`.
  const HEX_LITERAL = /#[0-9a-fA-F]{3,8}\b/;
  const RGB_LITERAL = /\b(?:rgb|hsl)a?\(\s*\d/;

  test.each(componentSources)(
    '%s contains no raw hex color literal',
    (_path, source) => {
      expect(stripComments(source)).not.toMatch(HEX_LITERAL);
    }
  );

  test.each(componentSources)(
    '%s contains no raw rgb/hsl literal with numeric channels',
    (_path, source) => {
      // Absolute rule: components read colors via `vars.colors.*` only.
      // The backdrop scrim has its own semantic token (`vars.overlay.scrim`)
      // — no `rgba(...)` literal is permitted in any component source.
      expect(stripComments(source)).not.toMatch(RGB_LITERAL);
    }
  );
});

// ---------------------------------------------------------------------------
// 4a. Escape hatches — CONTRACT.md §7
//
// Host knobs are `--fsl-<scope>-<knob>` custom properties consumed through
// `fslVar`. Two rules are enforceable statically:
//   - every knob read goes through `fslVar(…)` (never a hand-written
//     `var(--fsl-…)`), which guarantees the fallback argument exists;
//   - no `var(--fsl-…)` without a fallback anywhere in a component source.
// ---------------------------------------------------------------------------

describe('contract: escape hatches (§7)', () => {
  const RAW_FSL_VAR = /\bvar\(\s*--fsl-/;
  const FSL_VAR_WITHOUT_FALLBACK = /\bvar\(\s*--fsl-[a-z0-9-]+\s*\)/;

  test.each(componentSources)(
    '%s consumes --fsl-* knobs only through fslVar (with fallback)',
    (_path, source) => {
      const stripped = stripComments(source);
      // A hand-written `var(--fsl-…)` bypasses the helper.
      expect(stripped).not.toMatch(RAW_FSL_VAR);
      expect(stripped).not.toMatch(FSL_VAR_WITHOUT_FALLBACK);
    }
  );

  test('fslVar output always contains the fallback', async () => {
    const { fslVar } = await import('src/tokens/escapeHatch');
    expect(fslVar('--fsl-dialog-max-width', 'min(500px, 90vw)')).toBe(
      'var(--fsl-dialog-max-width, min(500px, 90vw))'
    );
  });

  test('DialogModal surface reads the --fsl-dialog-max-width knob', () => {
    render(
      <pkg.DialogTrigger defaultOpen>
        <pkg.Button>Open</pkg.Button>
        <pkg.DialogModal>
          <pkg.Dialog aria-label="test">content</pkg.Dialog>
        </pkg.DialogModal>
      </pkg.DialogTrigger>
    );
    const surface = document.querySelector<HTMLElement>(
      '[data-scope="dialog"][data-part="surface"]'
    );
    expect(surface?.style.maxWidth).toBe(
      'var(--fsl-dialog-max-width, min(500px, 90vw))'
    );
  });

  test('Menu popover reads the --fsl-menu-{min,max}-width knobs', () => {
    render(
      <pkg.MenuTrigger defaultOpen>
        <pkg.Button>T</pkg.Button>
        <pkg.Menu>
          <pkg.MenuItem>Item</pkg.MenuItem>
        </pkg.Menu>
      </pkg.MenuTrigger>
    );
    const popover = document.querySelector<HTMLElement>(
      '[data-scope="menu"][data-part="root"]'
    );
    expect(popover?.style.minWidth).toBe('var(--fsl-menu-min-width, 12rem)');
    expect(popover?.style.maxWidth).toBe(
      'var(--fsl-menu-max-width, min(320px, 90vw))'
    );
  });
});

// ---------------------------------------------------------------------------
// 4a2. RTL correctness — logical CSS properties only
//
// Physical horizontal properties (`left:`, `marginRight:`, …) break
// right-to-left layouts. Components must use logical equivalents
// (`insetInlineStart`, `marginInlineEnd`, …). Vertical physical properties
// are included for consistency (`insetBlockStart` over `top`).
// ---------------------------------------------------------------------------

describe('contract: logical CSS properties (RTL)', () => {
  // Style-object keys for physical box placement. `inset:` (all four
  // sides at once, e.g. `inset: 0`) is direction-agnostic and stays legal.
  const PHYSICAL_PROPERTY = new RegExp(
    String.raw`\b(top|left|right|bottom` +
      String.raw`|margin(Top|Left|Right|Bottom)` +
      String.raw`|padding(Top|Left|Right|Bottom)` +
      String.raw`|border(Top|Left|Right|Bottom)\w*)\s*:`
  );

  test.each(componentSources)(
    '%s uses no physical box properties',
    (_path, source) => {
      const offending = stripComments(source)
        .split('\n')
        .filter((line) => {
          return PHYSICAL_PROPERTY.test(line);
        });
      expect(offending).toEqual([]);
    }
  );
});

// ---------------------------------------------------------------------------
// 4b. Entity → UX-context alignment
//
// Every `vars.colors.<ux>.*` read in a component source must match the UX
// context derived from that file's declared entity (via ENTITY_TOKEN_MAPPING),
// OR be a cross-cutting infrastructure family (currently only `overlay`).
//
// This is the grep-able audit trail that enforces CONTRACT.md §1 at test
// time: a component cannot silently drift into another entity's color tree.
// ---------------------------------------------------------------------------

describe('contract: entity → ux-context alignment', () => {
  // Cross-cutting UX contexts available to any component, regardless of entity.
  const CROSS_CUTTING_UX: ReadonlySet<string> = new Set(['overlay']);

  /** Extract every `entity: 'Foo'` declaration (stripped of comments). */
  const extractEntitiesFromSource = (source: string): Set<string> => {
    const stripped = stripComments(source);
    const matches = stripped.matchAll(/\bentity:\s*'([A-Z][a-zA-Z]*)'/g);
    const entities = new Set<string>();
    for (const m of matches) {
      entities.add(m[1] as string);
    }
    return entities;
  };

  /** Extract every `vars.colors.<ux>` read (stripped of comments). */
  const extractColorReads = (source: string): Set<string> => {
    const stripped = stripComments(source);
    const matches = stripped.matchAll(/\bvars\.colors\.([a-zA-Z]+)\b/g);
    const reads = new Set<string>();
    for (const m of matches) {
      reads.add(m[1] as string);
    }
    return reads;
  };

  test.each(componentSources)(
    '%s: every `vars.colors.<ux>` matches its declared entity',
    (_path, source) => {
      const entities = extractEntitiesFromSource(source);
      if (entities.size === 0) return; // no meta — not a component source

      const allowedUx = new Set<string>(CROSS_CUTTING_UX);
      for (const e of entities) {
        // Unknown entity is caught by the taxonomy legality suite — skip here.
        const mapping =
          ENTITY_TOKEN_MAPPING[e as keyof typeof ENTITY_TOKEN_MAPPING];
        if (mapping) allowedUx.add(mapping.uxContext);
      }

      const reads = extractColorReads(source);
      const violations: string[] = [];
      for (const ux of reads) {
        if (!allowedUx.has(ux)) {
          violations.push(
            `vars.colors.${ux} is not allowed — entities in this file ` +
              `(${[...entities].join(', ')}) map to ux contexts ` +
              `${[...allowedUx].join(', ')}`
          );
        }
      }
      expect(violations).toEqual([]);
    }
  );
});

// ---------------------------------------------------------------------------
// 5. toCssVarName prefix convention
// ---------------------------------------------------------------------------

describe('contract: CSS var prefix', () => {
  const samples = [
    'core.colors.brand.500',
    'semantic.colors.action.primary.background.default',
    'semantic.spacing.inset.control.md',
    'semantic.text.label.md.fontSize',
  ];

  test.each(samples)('toCssVarName("%s") starts with --tt-', (path) => {
    expect(toCssVarName(path)).toMatch(/^--tt-/);
  });

  test('semantic.colors.* emits the --tt-colors- prefix (not --tt-color-)', () => {
    // Resolves the `--tt-color-*` vs `--tt-colors-*` ambiguity flagged in
    // the naming decision: the canonical prefix is `--tt-colors-`.
    expect(
      toCssVarName('semantic.colors.action.primary.background.default')
    ).toBe('--tt-colors-action-primary-background-default');
  });
});
describe('contract: DOM data-attributes', () => {
  test.each(discoveredMetas)(
    '%s renders [data-scope][data-part] per meta',
    (_metaName, componentName, meta) => {
      const fixture = DOM_FIXTURES[componentName];
      if (fixture === undefined) {
        throw new Error(
          `No DOM fixture for "${componentName}". ` +
            `Add an entry to DOM_FIXTURES in domFixtures.tsx.`
        );
      }

      render(fixture.element());
      fixture.open?.();

      const element = document.querySelector(
        `[data-scope="${fixture.scope}"][data-part="${meta.structure}"]`
      );

      expect(element).not.toBeNull();
      expect(element).toHaveAttribute('data-scope', fixture.scope);
      expect(element).toHaveAttribute('data-part', meta.structure);
    }
  );
});

// ---------------------------------------------------------------------------
// Invariant #9: every glyph host centres its glyph as a box, not as text
//
// `iconify-icon` is inline-level, so in a non-flex host it aligns to the
// host's text baseline and the font's descender space pushes the glyph
// visually high (measured −2px in Button/Select/Disclosure/Accordion and −1px
// in Checkbox before ICON_SLOT_STYLE existed). jsdom cannot lay this out, but
// it can assert the declaration that prevents it — so the fix stays enforced
// for every future glyph-bearing component.
// ---------------------------------------------------------------------------

describe('contract: glyph hosts centre their glyph (ICON_SLOT_STYLE)', () => {
  test.each(Object.entries(DOM_FIXTURES))(
    '%s: every element wrapping an icon is a centring flex box',
    (_componentName, fixture) => {
      render(fixture.element());
      fixture.open?.();

      const hosts = [...document.querySelectorAll('iconify-icon')]
        .map((glyph) => {
          return glyph.parentElement;
        })
        .filter((host): host is HTMLElement => {
          // Only hosts that exist to *hold* the glyph — a control that also
          // lays out other children (a stepper button, a trigger) already
          // centres via its own flex row.
          return host !== null && host.tagName === 'SPAN';
        });

      for (const host of hosts) {
        expect(host.style.display).toMatch(/flex$/);
        expect(host.style.alignItems).toBe('center');
        expect(host.style.justifyContent).toBe('center');
      }
    }
  );
});

// ---------------------------------------------------------------------------
// Invariant #10: the utility silhouette sits on the *field row*
//
// A utility trigger's job is to stand beside a field — a toolbar's search
// input, a filter bar's select, a table's inline editor. So its height and its
// type are not free parameters to tune per component: they are the field row's,
// and the row is defined by `sizing.hit` + `inset.control` + `text.label.md`
// (34px at 1920×1080 in the base theme). A command trigger is the deliberate
// exception — it leaves the row for the CTA height (40px) via
// `inset.action.block` and `text.action.md` (ADR-021 addendum).
//
// This is the invariant that answers "should ActionButton be smaller?": it may
// not be *independently* smaller. Shrinking its type alone would break the
// alignment with the fields it was designed to sit next to. The utility/command
// contrast is carried by height, weight, inset and radius — never by a size
// step nobody else on the row took.
// ---------------------------------------------------------------------------

describe('contract: utility triggers share the field row', () => {
  const rowGeometry = (el: HTMLElement) => {
    return {
      minHeight: el.style.minHeight,
      paddingBlock: el.style.paddingBlock,
      paddingInline: el.style.paddingInline,
      fontSize: el.style.fontSize,
      fontWeight: el.style.fontWeight,
    };
  };

  const renderRoot = (fixtureName: string, selector: string) => {
    const { unmount } = render(DOM_FIXTURES[fixtureName].element());
    const el = document.querySelector<HTMLElement>(selector);

    expect(el).not.toBeNull();

    const geometry = rowGeometry(el as HTMLElement);

    unmount();

    return geometry;
  };

  test('ActionButton and ToggleButton match the TextField control exactly', () => {
    const field = renderRoot(
      'TextFieldControl',
      '[data-scope="text-field"][data-part="control"]'
    );

    expect(
      renderRoot(
        'ActionButton',
        '[data-scope="action-button"][data-part="root"]'
      )
    ).toEqual(field);
    expect(
      renderRoot(
        'ToggleButton',
        '[data-scope="toggle-button"][data-part="root"]'
      )
    ).toEqual(field);
  });

  test('Button leaves the row on inset and type, keeping the same floor', () => {
    const field = renderRoot(
      'TextFieldControl',
      '[data-scope="text-field"][data-part="control"]'
    );
    const command = renderRoot(
      'Button',
      '[data-scope="button"][data-part="root"]'
    );

    // Taller, wider, heavier — that is the command posture.
    expect(command.paddingBlock).not.toBe(field.paddingBlock);
    expect(command.paddingInline).not.toBe(field.paddingInline);
    expect(command.fontWeight).not.toBe(field.fontWeight);

    // Same ergonomic floor, so a CTA dropped into a toolbar never falls below
    // the row it shares. That the two type contracts also resolve to the *same
    // font size* (they differ in weight alone) is a theme-level invariant —
    // jsdom cannot resolve `var()`, so it is asserted in fsl-theme's
    // `typography.test.ts`.
    expect(command.minHeight).toBe(field.minHeight);
  });
});

// ---------------------------------------------------------------------------
// Invariant #11: the field family reads one row, from one source
//
// Invariant #10 asserts that a *utility trigger* matches the field row. It
// proves that by comparing a trigger against `TextField`, which is fine for
// the two Action members it names — but it cannot be widened to the field
// family as written, because it compares inline-style *strings*: a sibling
// that declared `minBlockSize` instead of `minHeight` computed exactly the
// same box and still failed the comparison.
//
// So this invariant asserts against the shared source (`FIELD_ROW` +
// `sizing.hit`) rather than against a peer. A member drifts the moment it
// stops reading the anatomy — which is the only way it *can* drift now.
//
// The list grows by one entry per component migrated onto the anatomy; it is
// the authority on who is on the row, which is why it is a list and not a
// glob over the fixtures.
// ---------------------------------------------------------------------------

describe('contract: the field family reads one row', () => {
  // A *self-painted* member resolves the whole row on one element. A *split*
  // member spreads it across two: the frame owns the floor, the radius, the
  // border and the ring, while the value owns the insets and the reading edge —
  // a frame that also padded would double the gap on the reading edge. So the
  // invariant asks each shape for the half it is responsible for; asking both
  // for all six is what would make a correct split control look broken.
  const SELF_PAINTED: ReadonlyArray<readonly [string, string, string]> = [
    ['TextFieldControl', 'TextFieldControl', 'text-field'],
    ['TextAreaControl', 'TextAreaControl', 'text-area'],
    ['Select trigger', 'Select', 'select'],
  ];

  const SPLIT: ReadonlyArray<readonly [string, string, string]> = [
    ['ComboBox', 'ComboBox', 'combo-box'],
  ];

  const styleOf = (selector: string): CSSStyleDeclaration => {
    const el = document.querySelector<HTMLElement>(selector);

    expect(el).not.toBeNull();

    return (el as HTMLElement).style;
  };

  test.each(SELF_PAINTED)(
    '%s resolves the whole row from FIELD_ROW',
    (_label, fixtureName, scope) => {
      const { unmount } = render(DOM_FIXTURES[fixtureName].element());
      const part = scope === 'select' ? 'trigger' : 'control';
      const style = styleOf(`[data-scope="${scope}"][data-part="${part}"]`);

      expect(style.minHeight).toBe(vars.sizing.hit);
      expect(style.paddingBlock).toBe(FIELD_ROW.insetBlock);
      expect(style.paddingInline).toBe(FIELD_ROW.insetInline);
      expect(style.borderRadius).toBe(FIELD_ROW.radius);
      // The reading edge is declared, never inherited: the host element's UA
      // default decides it otherwise, and `<input>` and `<button>` disagree.
      expect(style.textAlign).toBe('start');
      expect(style.outlineOffset).toBe(FOCUS_RING_OFFSET);

      unmount();
    }
  );

  test.each(SPLIT)(
    '%s spreads the row across its frame and its value',
    (_label, fixtureName, scope) => {
      const { unmount } = render(DOM_FIXTURES[fixtureName].element());

      const frame = styleOf(`[data-scope="${scope}"][data-part="frame"]`);
      const value = styleOf(`[data-scope="${scope}"][data-part="control"]`);

      expect(frame.minHeight).toBe(vars.sizing.hit);
      expect(frame.borderRadius).toBe(FIELD_ROW.radius);
      expect(frame.outlineOffset).toBe(FOCUS_RING_OFFSET);

      expect(value.paddingBlock).toBe(FIELD_ROW.insetBlock);
      expect(value.paddingInline).toBe(FIELD_ROW.insetInline);
      expect(value.textAlign).toBe('start');

      unmount();
    }
  );
});

// ---------------------------------------------------------------------------
// Invariant #12: `(data-scope, data-part)` is unique per subtree
//
// The pair is the package's addressing scheme: a test, a host stylesheet or an
// agent resolves a part by it. Sibling repeats are legitimate and common — two
// radios in a group, two steppers in a NumberField, two glyph hosts — so the
// defect is not "the pair appears twice in the document". It is an element
// that *contains a descendant carrying the same pair*, because then no
// selector can address either one unambiguously.
//
// Measured in a real browser before being written down: three components wrap
// an `<input>` in a painted `<div>` and name both `control`. They are listed
// as known violations rather than silently excluded, so the list can only
// shrink — each entry names the queue item that removes it.
// ---------------------------------------------------------------------------

describe('contract: (scope, part) is unique per subtree', () => {
  // Each entry names what removes it. Do not add to this list: for a field, a
  // new violation means the anatomy was bypassed.
  const KNOWN_NESTED_PAIRS: ReadonlySet<string> = new Set([
    'search-field/control', // P3 Slice 5 ③ — adornment anatomy
    'number-field/control', // P3 Slice 5 ④ — frame/value split
    // Found by this invariant, not by the browser audit that preceded it: the
    // popover and every row both resolve `menu/root`, because §5 has sub-parts
    // reuse the host's scope while `MenuItem` also declares `structure: 'root'`.
    // A different family and a different cause from the three above — F-030.
    'menu/root',
  ]);

  const nestedPairs = (root: ParentNode): string[] => {
    const found: string[] = [];
    for (const el of root.querySelectorAll<HTMLElement>(
      '[data-scope][data-part]'
    )) {
      const { scope, part } = el.dataset;
      if (
        el.querySelector(`[data-scope="${scope}"][data-part="${part}"]`) !==
        null
      ) {
        found.push(`${scope}/${part}`);
      }
    }
    return found;
  };

  test.each(Object.entries(DOM_FIXTURES))(
    '%s nests no repeated (scope, part)',
    (_name, fixture) => {
      const { unmount } = render(fixture.element());

      fixture.open?.();

      const offending = [...new Set(nestedPairs(document.body))].filter(
        (pair) => {
          return !KNOWN_NESTED_PAIRS.has(pair);
        }
      );

      expect(offending).toEqual([]);

      unmount();
    }
  );

  test('every known violation is still real (the list cannot go stale)', () => {
    const seen = new Set<string>();

    for (const fixture of Object.values(DOM_FIXTURES)) {
      const { unmount } = render(fixture.element());
      fixture.open?.();
      for (const pair of nestedPairs(document.body)) {
        seen.add(pair);
      }
      unmount();
    }

    // A fixed violation must be deleted from the list, not left behind as a
    // permanent exemption for a defect that no longer exists.
    expect(
      [...KNOWN_NESTED_PAIRS].filter((p) => {
        return !seen.has(p);
      })
    ).toEqual([]);
  });
});
