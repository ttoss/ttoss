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
import { CHOOSABLE_ROW } from 'src/tokens/choosableRow';
import { FOCUS_RING_OFFSET } from 'src/tokens/focusRing';
import { ENTITY_TOKEN_MAPPING } from 'src/tokens/projection';
import { SELECTION_CONTROL } from 'src/tokens/selectionControl';

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

  // Raw `var(--…)` reads outside the sanctioned namespaces (`--tt-` theme
  // tokens emitted by `vars.*`, `--fsl-` host knobs via `fslVar`) would create
  // an unreviewable styling side channel. One narrow exception exists and it is
  // an allowlist, not a hole: a property published as documented API by a direct
  // dependency, read through `upstreamVar` (ADR-023).
  //
  // This is the source-text half of the rule, and on its own it is **not
  // sufficient** — a helper living outside `src/components/**` composes the
  // string somewhere this regex never looks, which is exactly what happened when
  // `upstreamVar` was introduced and this test stayed green. The runtime half is
  // below, over the rendered fixtures, and it is the one that actually binds.
  const FOREIGN_VAR = /\bvar\(\s*--(?!tt-|fsl-|trigger-width\b)/;

  test.each(componentSources)(
    '%s reads no CSS variables outside the sanctioned namespaces',
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

// ---------------------------------------------------------------------------
// 4b. Foreign custom properties — the allowlist, enforced at runtime (ADR-023)
//
// The source-text rule in §4 catches a hand-written `var(--x)` in a component.
// It does not catch one composed by a helper elsewhere — proven, not supposed:
// `upstreamVar` was added in `src/tokens/`, both pickers started reading
// `--trigger-width`, and the source scan stayed green because it only reads
// `src/components/**`.
//
// So the binding rule is over the **rendered** styles: whatever produced the
// value, it lands in an inline style, and every `var()` read there must be a
// theme token, a host knob, or an allowlisted upstream property. A helper cannot
// launder a foreign namespace past this.
// ---------------------------------------------------------------------------

describe('contract: foreign CSS variables come from a named allowlist', () => {
  /**
   * Published as documented API by a dependency we already depend on. One entry
   * per name; growing this list is an ADR-023 amendment, not a refactor.
   *
   * Kept as literals rather than imported from `UpstreamCssVar` on purpose: a
   * test that imports the thing it polices would pass by construction the day
   * someone widens the type.
   */
  const ALLOWED_UPSTREAM: ReadonlySet<string> = new Set(['--trigger-width']);

  const varReadsIn = (): Set<string> => {
    const names = new Set<string>();

    for (const el of document.querySelectorAll<HTMLElement>('[style]')) {
      const style = el.getAttribute('style') ?? '';
      // Reads only. A *declaration* (`--trigger-width: 1200px`) is React Aria
      // publishing the value, which is the whole point — see the write guard.
      for (const match of style.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
        names.add(match[1]);
      }
    }

    return names;
  };

  const assertAllowed = (names: Set<string>) => {
    const foreign = [...names].filter((name) => {
      return (
        !name.startsWith('--tt-') &&
        !name.startsWith('--fsl-') &&
        !ALLOWED_UPSTREAM.has(name)
      );
    });

    expect(foreign).toEqual([]);
  };

  test.each(Object.entries(DOM_FIXTURES))(
    '%s reads only theme tokens, host knobs and allowlisted properties',
    (_name, fixture) => {
      const { unmount } = render(fixture.element());
      fixture.open?.();

      assertAllowed(varReadsIn());

      unmount();
    }
  );

  test('an open picker popover reads the allowlisted property, not a foreign one', () => {
    // The fixture registry renders a ComboBox closed, so its popover — the one
    // element that reads `--trigger-width` — never mounts there. Opened
    // explicitly, because a guard that cannot see the subject is not a guard.
    const { unmount } = render(
      <pkg.Select label="Choice" defaultOpen>
        <pkg.SelectItem id="a">A</pkg.SelectItem>
      </pkg.Select>
    );

    const reads = varReadsIn();

    expect(reads.has('--trigger-width')).toBe(true);
    assertAllowed(reads);

    unmount();
  });

  test('no component writes an allowlisted property', () => {
    // React Aria resolves `--trigger-width` as `props.style[…] || measured`, and
    // supplying our own also switches off the ResizeObserver keeping it current —
    // so writing it would freeze the popover at the trigger's first-paint width.
    // Read-only is a mechanism, not a convention.
    const WRITES = /['"`]--trigger-width['"`]\s*:/;

    for (const [path, source] of componentSources) {
      expect(stripComments(source)).not.toMatch(WRITES);
      expect(path).toBeTruthy();
    }
  });
});

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

  // The focus ring's two offsets are constants, and a literal beside them is how
  // the package ended up with four different row insets — `2px` via the constant,
  // `2px` twice hand-written, `-1px`, `-2px` — one of which was measured clipping.
  // The values are identical today, which is exactly why nothing caught it: a
  // literal that happens to match is indistinguishable from one that tracks, until
  // the theme changes the ring's thickness and only the derived one follows.
  const OUTLINE_OFFSET_LITERAL = /outlineOffset:\s*['"`]/;

  test.each(componentSources)(
    '%s reads focus-ring offsets from the constants, never a literal',
    (_path, source) => {
      expect(stripComments(source)).not.toMatch(OUTLINE_OFFSET_LITERAL);
    }
  );

  test('the two offsets are distinct, and the inset is derived from the ring width', async () => {
    const { FOCUS_RING_INSET: inset, FOCUS_RING_OFFSET: offset } =
      await import('src/tokens/focusRing');

    // A ring needs `offset + width` px of room outside its box. The floated one
    // asks for room; the inset one asks for none, by construction rather than by
    // a chosen number — so it holds if the theme changes the thickness.
    expect(inset).toBe(`calc(-1 * ${vars.focus.ring.width})`);
    expect(inset).not.toBe(offset);
    expect(offset).not.toMatch(/calc/);
  });

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
      expect(style.fontSize).toBe(FIELD_ROW.text.fontSize);

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
      // The frame declares the row's type although it renders no text: measured
      // at 16px in Storybook and 18px in the Studio's dialog before it did,
      // because an undeclared frame inherits the host's paragraph size and
      // hands it to every adornment placed inside it.
      expect(frame.fontSize).toBe(FIELD_ROW.text.fontSize);

      expect(value.paddingBlock).toBe(FIELD_ROW.insetBlock);
      expect(value.paddingInline).toBe(FIELD_ROW.insetInline);
      expect(value.textAlign).toBe('start');

      unmount();
    }
  );
});

// ---------------------------------------------------------------------------
// Invariant #13: the choosable row is one decision
//
// Five components render a row the user picks from — a Select option, a ComboBox
// option, a MenuItem, a ListBoxItem, a GridListItem — across three entities. The
// row is the same physical thing everywhere, so it comes from one source
// (`CHOOSABLE_ROW`), and this asserts against that source rather than against a
// peer, for the same reason invariant #11 does.
//
// The measurement that made it necessary: three of the five were 44px tall
// against the other two at 32px, because they wrote `inset.control.md` on the
// block axis where the others wrote `sm`, and three had **no ergonomic floor at
// all**. 32px is also what the reference derives for a medium menu row
// (`component-height-100`) — the field row's content box.
//
// The ring is part of the row, not a footnote: four different offsets were in
// use, two of them hand-written literals duplicating the constant, and the
// floated `+2px` was measured **clipping** at a scrolled list's edge.
// ---------------------------------------------------------------------------

describe('contract: the choosable row is one decision', () => {
  // `[scope, fixture, selector]`. Menu's row was selected by role while
  // `MenuItem` published `data-part="root"` — the same pair as its popover
  // (F-030). That is fixed, so it is addressed like every other row.
  const ROWS: ReadonlyArray<readonly [string, string, string]> = [
    ['SelectItem', 'SelectItem', '[data-scope="select"][data-part="item"]'],
    [
      'ComboBoxItem',
      'ComboBoxItem',
      '[data-scope="combo-box"][data-part="item"]',
    ],
    ['ListBoxItem', 'ListBoxItem', '[data-scope="list-box"][data-part="item"]'],
    [
      'GridListItem',
      'GridListItem',
      '[data-scope="grid-list"][data-part="item"]',
    ],
    ['MenuItem', 'MenuItem', '[data-scope="menu"][data-part="control"]'],
  ];

  test.each(ROWS)(
    '%s resolves its box from CHOOSABLE_ROW',
    (_label, fixtureName, selector) => {
      const fixture = DOM_FIXTURES[fixtureName];
      const { unmount } = render(fixture.element());
      fixture.open?.();

      const el = document.querySelector<HTMLElement>(selector);

      expect(el).not.toBeNull();

      const style = (el as HTMLElement).style;

      expect(style.minHeight).toBe(CHOOSABLE_ROW.minHeight);
      expect(style.paddingBlock).toBe(CHOOSABLE_ROW.insetBlock);
      expect(style.paddingInline).toBe(CHOOSABLE_ROW.insetInline);
      expect(style.borderRadius).toBe(CHOOSABLE_ROW.radius);
      expect(style.outlineOffset).toBe(CHOOSABLE_ROW.focusOffset);

      unmount();
    }
  );

  test('the row reads the field row apart from the border the field adds', () => {
    // Both come from `inset.control.sm` on the block axis and `label.md` for the
    // type, which is why a 32px option sits under a 34px field without looking
    // like a different scale. Asserted against the two sources so a change to
    // either has to be a deliberate change to both.
    expect(CHOOSABLE_ROW.insetBlock).toBe(FIELD_ROW.insetBlock);
    expect(CHOOSABLE_ROW.insetInline).toBe(FIELD_ROW.insetInline);
    expect(CHOOSABLE_ROW.radius).toBe(FIELD_ROW.radius);
    expect(CHOOSABLE_ROW.text.fontSize).toBe(FIELD_ROW.text.fontSize);
  });

  test('the row insets its ring by exactly the ring width', () => {
    // The arithmetic is the guarantee: a ring needs `offset + width` px of room
    // outside the box, so at `offset = -width` it needs none and cannot clip at
    // any scroll position. Measured before this held: the focused option in a
    // scrolled ComboBox list sat 0.11px from the viewport edge against a 4px
    // ring extent. A literal would not carry the property.
    expect(CHOOSABLE_ROW.focusOffset).toBe(
      `calc(-1 * ${vars.focus.ring.width})`
    );
    expect(CHOOSABLE_ROW.focusOffset).not.toBe(FOCUS_RING_OFFSET);
  });
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
  // Empty, and it should stay that way. Both entries that lived here —
  // `search-field/control` and `number-field/control` — were closed by forms
  // item D: each wrapper became `data-part="frame"` and `control` stayed on the
  // element a caller operates, the precedent C1 set on `ComboBox`. F-026 is the
  // finding; the anti-stale companion below is what forced this list to shrink
  // rather than sit here as a standing exemption.
  const KNOWN_NESTED_PAIRS: ReadonlySet<string> = new Set([]);

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

// ---------------------------------------------------------------------------
// Contract invariant #14 — embedded triggers share one silhouette
//
// An Action that lives *inside* a field's box — a `SearchField`'s clear button,
// a `NumberField`'s two steppers, a `ComboBox`'s chevron — is one physical
// thing, so it is one decision. The reference system agrees: it names the
// primitive `in-field-button` and gives it its own layout token set.
//
// This exists because the class had drifted into three different boxes, measured
// in Chromium at 1280px before `EMBEDDED_TRIGGER`: the steppers at 32×32, the
// chevron at 25.33, the clear button at 20×20. Two independent causes — a
// font-relative glyph inside a `<button>` that inherits the UA's 13.3333px, and
// paddings that disagreed — which is why it was three numbers and not two.
//
// Like #10 and #13, this asserts **token identity** and never a pixel: the
// trigger's inset is container-fluid, so every measured number above is the top
// of a ramp, and jsdom has no layout to measure with anyway.
// ---------------------------------------------------------------------------

describe('contract: embedded triggers share one silhouette', () => {
  const TRIGGERS: ReadonlyArray<readonly [string, string]> = [
    ['search-field', 'trailingAdornment'],
    ['number-field', 'trigger'],
    ['combo-box', 'trigger'],
  ];

  const silhouette = (el: HTMLElement) => {
    return {
      minInlineSize: el.style.minInlineSize,
      minBlockSize: el.style.minBlockSize,
      padding: el.style.padding,
      borderRadius: el.style.borderRadius,
      fontSize: el.style.fontSize,
      outlineOffset: el.style.outlineOffset,
    };
  };

  const rendered = (scope: string, part: string) => {
    // `SearchField` is authored here rather than taken from `DOM_FIXTURES`
    // because its clear button only exists once there is something to clear —
    // this guard caught that itself when the button gained its `isEmpty` gate.
    const { unmount } = render(
      scope === 'search-field' ? (
        <pkg.SearchField clearLabel="Clear search" defaultValue="ada" />
      ) : (
        DOM_FIXTURES[
          scope === 'number-field' ? 'NumberField' : 'ComboBox'
        ].element()
      )
    );

    const els = [
      ...document.querySelectorAll<HTMLElement>(
        `[data-scope="${scope}"][data-part="${part}"]`
      ),
    ];

    expect(els.length).toBeGreaterThan(0);

    const shapes = els.map(silhouette);

    unmount();

    return shapes;
  };

  test('every embedded trigger in the family resolves the same box', () => {
    const shapes = TRIGGERS.flatMap(([scope, part]) => {
      return rendered(scope, part);
    });

    // Includes both of NumberField's steppers, which is the cheapest place for
    // an asymmetry between increment and decrement to show up.
    expect(shapes.length).toBeGreaterThanOrEqual(4);
    for (const shape of shapes) expect(shape).toEqual(shapes[0]);
  });

  test('the shared box is the ergonomic floor, not a hand-written size', () => {
    const [shape] = rendered('number-field', 'trigger');

    // `hit` on both axes is what keeps the trigger above WCAG 2.5.8's 24px
    // target minimum — the clear button used to be 20×20, and 2.5.8's spacing
    // exception cannot rescue the steppers because they are adjacent.
    expect(shape.minInlineSize).toBe(vars.sizing.hit);
    expect(shape.minBlockSize).toBe(vars.sizing.hit);
    expect(shape.padding).toBe(vars.spacing.inset.control.sm);
  });

  test('it declares the field row type, so no glyph is font-relative', () => {
    const [shape] = rendered('combo-box', 'trigger');

    // The load-bearing one. A `<button>` with no type of its own inherits the
    // UA's 13.3333px, and this chevron's glyph was `size="text"` — so the box
    // came out 13.33 + 6 + 6 = 25.33 while its siblings were 32.
    expect(shape.fontSize).toBe(
      (vars.text.label.md as { fontSize?: string }).fontSize
    );
  });
});

// ---------------------------------------------------------------------------
// Contract invariant #15 — selection controls share one scale
//
// The mark the user toggles — a `Checkbox`'s square, a `Radio`'s circle, a
// `GridList` row's selection box, a `Switch`'s track, a `Slider`'s handle — is
// one scale, stated once in `SELECTION_CONTROL` (S2's large step: 18px box,
// 12px glyph).
//
// This exists because the class had drifted the way every unshared constant
// does: `1.125rem` was hand-written in five files, `Switch`'s track had grown
// to 2.5rem × 1.5rem (larger than the reference's extra-large), `GridList`'s
// box had kept the full `control` radius that P3 slice 3 halved on `Checkbox`
// (the reads-as-a-Radio defect, fixed in one copy and kept in the other), and
// the indicator glyph was `size="sm"` — a container-fluid step measured at
// 20×20 inside its own fixed 18×18 box.
//
// Two complementary halves, like #14's: the equality tests catch one component
// diverging from the shared source, the value test catches the shared source
// itself drifting. Token identity and rem literals, never a measured pixel.
// ---------------------------------------------------------------------------

describe('contract: selection controls share one scale', () => {
  /** The boxed marks: square/circle the user checks. */
  const boxedMark = (): Array<[string, HTMLElement]> => {
    const marks: Array<[string, HTMLElement]> = [];

    render(DOM_FIXTURES.Checkbox.element());
    render(DOM_FIXTURES.RadioGroup.element());
    render(DOM_FIXTURES.GridList.element());

    const checkbox = document.querySelector<HTMLElement>(
      '[data-scope="checkbox"] [data-part="selectionControl"]'
    );
    const radio = document.querySelector<HTMLElement>(
      '[data-scope="radio"] [data-part="selectionControl"]'
    );
    // GridList's addressable part is the RAC checkbox wrapper; the painted box
    // is the `aria-hidden` span inside it (the first child is RAC's
    // visually-hidden input wrapper, a 1px box).
    const gridListBox = document.querySelector<HTMLElement>(
      '[data-scope="grid-list"][data-part="selectionControl"] > span[aria-hidden="true"]'
    );

    if (checkbox) marks.push(['checkbox', checkbox]);
    if (radio) marks.push(['radio', radio]);
    if (gridListBox) marks.push(['grid-list', gridListBox]);

    return marks;
  };

  test('every boxed mark resolves the same box and glyph scale', () => {
    const marks = boxedMark();

    expect(marks.length).toBe(3);
    for (const [, el] of marks) {
      expect(el.style.width).toBe(SELECTION_CONTROL.size);
      expect(el.style.height).toBe(SELECTION_CONTROL.size);
      // The load-bearing one: anything font-relative inside the box — the
      // `Icon` asked for `size="text"` — resolves against this, never against
      // a fluid ramp step or the paragraph the control happens to sit in.
      expect(el.style.fontSize).toBe(SELECTION_CONTROL.glyph);
    }
  });

  test('checkbox-shaped marks share the halved radius; the radio is round', () => {
    const marks = new Map(boxedMark());

    // Halved because the full `control` radius reads as a circle at 18px —
    // GridList's second copy of the box had kept the full radius after
    // Checkbox was fixed, which is the drift this line retires.
    expect(marks.get('checkbox')?.style.borderRadius).toBe(
      SELECTION_CONTROL.checkboxRadius
    );
    expect(marks.get('grid-list')?.style.borderRadius).toBe(
      SELECTION_CONTROL.checkboxRadius
    );
    expect(marks.get('radio')?.style.borderRadius).toBe(vars.radii.round);
  });

  test('the switch track and the slider handle read the same scale', () => {
    render(DOM_FIXTURES.Switch.element());
    render(DOM_FIXTURES.Slider.element());

    const track = document.querySelector<HTMLElement>(
      '[data-scope="switch"] [data-part="control"]'
    );
    const handle = document.querySelector<HTMLElement>(
      '[data-scope="slider"] [data-part="handle"]'
    );

    // The track's height IS the control scale — that is what aligns a switch
    // with the checkbox and radio beside it (S2 large: 30×18).
    expect(track?.style.height).toBe(SELECTION_CONTROL.size);
    expect(handle?.style.inlineSize).toBe(SELECTION_CONTROL.size);
    expect(handle?.style.blockSize).toBe(SELECTION_CONTROL.size);
  });

  test('the slider thumb is an ergonomic target, not its visible handle', () => {
    render(DOM_FIXTURES.Slider.element());

    const thumb = document.querySelector<HTMLElement>(
      '[data-scope="slider"] [data-part="control"]'
    );

    // WCAG 2.5.8 (AA, 24×24): the interactive box takes `hit`, the visible
    // handle inside it is the fill — the same split EMBEDDED_TRIGGER records.
    // A range slider's two thumbs are adjacent, so the spacing exception
    // cannot rescue an undersized handle.
    expect(thumb?.style.inlineSize).toBe(vars.sizing.hit);
    expect(thumb?.style.blockSize).toBe(vars.sizing.hit);
  });

  test('the shared source states the reference scale (value half)', () => {
    // The equality tests above go vacuous if the shared source itself moves —
    // this is the half that pins it. S2 large step: `checkbox-control-size-
    // large` 18px, `checkmark-icon-size-200` 12px.
    expect(SELECTION_CONTROL.size).toBe('1.125rem');
    expect(SELECTION_CONTROL.glyph).toBe('0.75rem');
  });
});
