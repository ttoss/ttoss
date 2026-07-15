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

import { fireEvent, render, screen } from '@testing-library/react';
import { toCssVarName } from '@ttoss/fsl-theme/css';
import type * as React from 'react';
import * as pkg from 'src/index';
import {
  ENTITIES,
  ENTITY_COMPOSITION,
  ENTITY_CONSEQUENCE,
  ENTITY_EVALUATION,
  ENTITY_STRUCTURE,
  STRUCTURAL_ROLES,
} from 'src/semantics/taxonomy';
import { ENTITY_TOKEN_MAPPING } from 'src/tokens/projection';

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
  // `var(--x, fallback)` is forbidden — fallbacks mask missing token coverage
  // and create silent drift across themes. See ui2-guardrails G1/G10.
  const VAR_WITH_FALLBACK = /\bvar\(\s*--[^,)]+,[^)]*\)/;

  test.each(componentSources)(
    '%s contains no var(--x, fallback)',
    (_path, source) => {
      expect(stripComments(source)).not.toMatch(VAR_WITH_FALLBACK);
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
      // The backdrop scrim has its own semantic token (`vars.colors.overlay.scrim`)
      // — no `rgba(...)` literal is permitted in any component source.
      expect(stripComments(source)).not.toMatch(RGB_LITERAL);
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
    // ui2-guardrails.md: the canonical prefix is `--tt-colors-`.
    expect(
      toCssVarName('semantic.colors.action.primary.background.default')
    ).toBe('--tt-colors-action-primary-background-default');
  });
});

// ---------------------------------------------------------------------------
// 7. DOM data-attribute contract
//
// Renders each component in its minimal context and asserts that an element
// with the correct `[data-scope][data-part]` appears in the document.
//
// Fixture structure:
//   scope  — expected `data-scope` value on the element declared by the meta.
//            For composite sub-parts this is the HOST's kebab-case name, not
//            the sub-part's (e.g. DialogHeading uses scope="dialog").
//   render — factory returning the JSX to mount. Overlays use `defaultOpen`
//            so they appear in the DOM without interactive setup.
//   open   — optional post-render action for composites that open via a
//            trigger click (ConfirmationDialog).
//
// Rule: if a new `*Meta` is added and no fixture is defined here, the test
// for that component will throw — add the fixture before shipping.
// ---------------------------------------------------------------------------
type DomFixture = {
  scope: string;
  element: () => React.ReactElement;
  open?: () => void;
};

const DOM_FIXTURES: Record<string, DomFixture> = {
  // ── standalone components ─────────────────────────────────────────────
  Button: {
    scope: 'button',
    element: () => {
      return <pkg.Button>x</pkg.Button>;
    },
  },
  Checkbox: {
    scope: 'checkbox',
    element: () => {
      return <pkg.Checkbox>x</pkg.Checkbox>;
    },
  },
  Link: {
    scope: 'link',
    element: () => {
      return <pkg.Link href="#">x</pkg.Link>;
    },
  },
  ProgressBar: {
    scope: 'progress-bar',
    element: () => {
      return <pkg.ProgressBar aria-label="loading" />;
    },
  },
  Switch: {
    scope: 'switch',
    element: () => {
      return <pkg.Switch>x</pkg.Switch>;
    },
  },
  // ── RadioGroup / Radio ────────────────────────────────────────────
  RadioGroup: {
    scope: 'radio-group',
    element: () => {
      return (
        <pkg.RadioGroup>
          <pkg.Radio value="a">A</pkg.Radio>
        </pkg.RadioGroup>
      );
    },
  },
  Radio: {
    scope: 'radio',
    element: () => {
      return (
        <pkg.RadioGroup>
          <pkg.Radio value="a">A</pkg.Radio>
        </pkg.RadioGroup>
      );
    },
  },
  // ── Select / SelectItem ───────────────────────────────────────────
  Select: {
    scope: 'select',
    element: () => {
      return (
        <pkg.Select>
          <pkg.SelectItem id="a">A</pkg.SelectItem>
        </pkg.Select>
      );
    },
  },
  SelectItem: {
    scope: 'select',
    element: () => {
      return (
        <pkg.Select defaultOpen>
          <pkg.SelectItem id="a">A</pkg.SelectItem>
        </pkg.Select>
      );
    },
  },
  // ── Toast / ToastRegion ───────────────────────────────────────────
  // Both need a queue with an item so the region renders and a toast appears.
  ToastRegion: {
    scope: 'toast-region',
    element: () => {
      const queue = pkg.createToastQueue<pkg.ToastContent>({
        maxVisibleToasts: 5,
      });
      queue.add({ title: 'x' });
      return <pkg.ToastRegion queue={queue} />;
    },
  },
  Toast: {
    scope: 'toast',
    element: () => {
      const queue = pkg.createToastQueue<pkg.ToastContent>({
        maxVisibleToasts: 5,
      });
      queue.add({ title: 'test' });
      return <pkg.ToastRegion queue={queue} />;
    },
  },
  // ── Accordion ────────────────────────────────────────────────────────
  Accordion: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionItem: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionTrigger: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionPanel: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  // ── Dialog ────────────────────────────────────────────────────────────
  // Dialog, DialogHeading, DialogBody, DialogActions render without a
  // modal wrapper (React Aria emits role=dialog on the div regardless).
  Dialog: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogHeading>H</pkg.DialogHeading>
          <pkg.DialogBody>B</pkg.DialogBody>
          <pkg.DialogActions>
            <pkg.Button composition="primaryAction">OK</pkg.Button>
          </pkg.DialogActions>
        </pkg.Dialog>
      );
    },
  },
  DialogHeading: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogHeading>H</pkg.DialogHeading>
        </pkg.Dialog>
      );
    },
  },
  DialogBody: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogBody>B</pkg.DialogBody>
        </pkg.Dialog>
      );
    },
  },
  DialogActions: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogActions>
            <pkg.Button composition="primaryAction">OK</pkg.Button>
          </pkg.DialogActions>
        </pkg.Dialog>
      );
    },
  },
  // DialogModal is a portal overlay — use defaultOpen via DialogTrigger.
  DialogModal: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.DialogTrigger defaultOpen>
          <pkg.Button>Open</pkg.Button>
          <pkg.DialogModal>
            <pkg.Dialog aria-label="test">content</pkg.Dialog>
          </pkg.DialogModal>
        </pkg.DialogTrigger>
      );
    },
  },
  // ConfirmationDialog wraps Dialog and overrides data-scope via the prop
  // added to Dialog. The dialog is closed on initial render; trigger click
  // opens it.
  ConfirmationDialog: {
    scope: 'confirmation-dialog',
    element: () => {
      return (
        <pkg.ConfirmationDialog
          trigger={<pkg.Button>open</pkg.Button>}
          title="Confirm?"
          onConfirm={() => {}}
        />
      );
    },
    open: () => {
      return fireEvent.click(screen.getByRole('button', { name: 'open' }));
    },
  },
  // ── Form ────────────────────────────────────────────────────────────────
  Form: {
    scope: 'form',
    element: () => {
      return <pkg.Form>x</pkg.Form>;
    },
  },
  FormActions: {
    scope: 'form',
    element: () => {
      return (
        <pkg.Form>
          <pkg.FormActions>
            <pkg.FormSubmit>Save</pkg.FormSubmit>
          </pkg.FormActions>
        </pkg.Form>
      );
    },
  },
  // FormSubmit delegates to Button but overrides data-scope="form-submit".
  FormSubmit: {
    scope: 'form-submit',
    element: () => {
      return (
        <pkg.Form>
          <pkg.FormSubmit>Save</pkg.FormSubmit>
        </pkg.Form>
      );
    },
  },
  // ── Menu / MenuItem ───────────────────────────────────────────────
  // Popover only renders when open. Use defaultOpen on MenuTrigger.
  Menu: {
    scope: 'menu',
    element: () => {
      return (
        <pkg.MenuTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Menu>
            <pkg.MenuItem>Item</pkg.MenuItem>
          </pkg.Menu>
        </pkg.MenuTrigger>
      );
    },
  },
  MenuItem: {
    scope: 'menu',
    element: () => {
      return (
        <pkg.MenuTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Menu>
            <pkg.MenuItem>Item</pkg.MenuItem>
          </pkg.Menu>
        </pkg.MenuTrigger>
      );
    },
  },
  // ── TextField ─────────────────────────────────────────────────────────
  TextField: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldLabel: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldControl: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldDescription: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldControl />
          <pkg.TextFieldDescription>Hint</pkg.TextFieldDescription>
        </pkg.TextField>
      );
    },
  },
  TextFieldError: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField isInvalid>
          <pkg.TextFieldControl />
          <pkg.TextFieldError>Required</pkg.TextFieldError>
        </pkg.TextField>
      );
    },
  },
  // ── Wizard ──────────────────────────────────────────────────────────────
  Wizard: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardNavigation />
        </pkg.Wizard>
      );
    },
  },
  WizardStep: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
        </pkg.Wizard>
      );
    },
  },
  // WizardSummary only renders when Wizard is complete (currentStep >= totalSteps).
  // With defaultStep=1 and exactly 1 WizardStep, isComplete=true on mount.
  WizardSummary: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test" defaultStep={1}>
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardSummary>
            <p>done</p>
          </pkg.WizardSummary>
        </pkg.Wizard>
      );
    },
  },
  WizardNavigation: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardNavigation />
        </pkg.Wizard>
      );
    },
  },
};

describe('contract: DOM data-attributes', () => {
  test.each(discoveredMetas)(
    '%s renders [data-scope][data-part] per meta',
    (_metaName, componentName, meta) => {
      const fixture = DOM_FIXTURES[componentName];
      if (fixture === undefined) {
        throw new Error(
          `No DOM fixture for "${componentName}". ` +
            `Add an entry to DOM_FIXTURES in components.contract.test.tsx.`
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
