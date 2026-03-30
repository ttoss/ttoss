/**
 * ============================================================
 * GENERIC CONTRACT TESTS FOR @ttoss/ui2
 * ============================================================
 *
 * These tests verify architectural invariants that ALL ui2
 * components must satisfy. They iterate over the component
 * registry — no per-component test files needed.
 *
 * GUARDRAILS ENFORCED:
 *   1. Registry ↔ export sync — every index.ts export has a
 *      registry entry (catches forgotten test coverage)
 *   2. Render safety — every component renders without crashing
 *   3. CSS class presence — expected ui2-* classes are in the DOM
 *   4. className merging — custom className is added, not replaced
 *   5. BEM convention — all ui2-* classes match ui2-{slug}[__{el}]
 *   6. CSS token compliance — CSS files only use --tt-* namespaces
 *      declared in the component's contract (Model→CSS enforcement)
 *
 * TO ADD A NEW COMPONENT:
 *   Only edit componentRegistry.tsx. These tests run automatically.
 * ============================================================
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { render } from '@ttoss/test-utils/react';
import { componentContracts } from 'src/_model/index';
import * as ui2Exports from 'src/index';

import {
  type ClassNameTarget,
  type ComponentEntry,
  componentRegistry,
} from './componentRegistry';

/* ================================================================== */
/*  1. Registry ↔ Export sync                                          */
/* ================================================================== */

describe('Registry completeness', () => {
  const exportedComponents = Object.keys(ui2Exports).filter((key) => {
    return !key.startsWith('__');
  });
  const registeredNames = componentRegistry.map((e) => {
    return e.name;
  });

  test.each(exportedComponents)(
    'exported "%s" has a registry entry',
    (name) => {
      expect(registeredNames).toContain(name);
    }
  );
});

/* ================================================================== */
/*  2. Render safety — renders without crashing                        */
/* ================================================================== */

describe.each(
  componentRegistry.map((e) => {
    return [e.name, e] as const;
  })
)('%s', (_name, entry) => {
  test('renders without crashing', () => {
    expect(() => {
      return render((entry as ComponentEntry).render());
    }).not.toThrow();
  });
});

/* ================================================================== */
/*  3. CSS class presence                                              */
/* ================================================================== */

const classPresenceTable = componentRegistry.flatMap((entry) => {
  return entry.expectedClasses.map((cls) => {
    return [entry.name, cls, entry] as [string, string, ComponentEntry];
  });
});

describe.each(classPresenceTable)('%s — class "%s"', (_name, cls, entry) => {
  test('is present in DOM', () => {
    const { baseElement } = render(entry.render());
    expect(baseElement.ownerDocument.querySelector(`.${cls}`)).not.toBeNull();
  });
});

/* ================================================================== */
/*  4. className merging                                               */
/* ================================================================== */

const classNameTargets = componentRegistry.flatMap((e) => {
  return e.classNameTargets.map((t) => {
    return [t.name, t] as [string, ClassNameTarget];
  });
});

if (classNameTargets.length > 0) {
  describe.each(classNameTargets)('%s — className merging', (_name, target) => {
    test('keeps base class and adds custom className', () => {
      const t = target as ClassNameTarget;
      const { baseElement } = render(t.render('custom-test-class'));
      const el = baseElement.ownerDocument.querySelector(t.selector);
      expect(el).not.toBeNull();
      expect(el).toHaveClass(t.baseClass);
      expect(el).toHaveClass('custom-test-class');
    });
  });
}

/* ================================================================== */
/*  5. BEM convention — all ui2-* classes follow naming convention      */
/* ================================================================== */

describe.each(
  componentRegistry.map((e) => {
    return [e.name, e] as const;
  })
)('%s — BEM convention', (_name, entry) => {
  test('all ui2-* classes follow ui2-{slug}[__{element}] pattern', () => {
    const { baseElement } = render((entry as ComponentEntry).render());
    const slug = (entry as ComponentEntry).cssSlug;

    const allUi2Classes = Array.from(
      baseElement.ownerDocument.querySelectorAll('[class]')
    ).flatMap((el) => {
      return Array.from(el.classList).filter((c) => {
        return c.startsWith('ui2-');
      });
    });

    const pattern = new RegExp(`^ui2-${slug}(__[a-z][a-z0-9-]*)?$`);

    for (const cls of allUi2Classes) {
      expect(cls).toMatch(pattern);
    }
  });
});

/* ================================================================== */
/*  6. CSS token compliance — Model→CSS enforcement                    */
/* ================================================================== */

const SRC_DIR = path.resolve(__dirname, '../../../src');

/** Maps first --tt-* segment to a controlled TokenNamespace. Unmapped = universal (ignored). */
const NAMESPACE_MAP: Record<string, string> = {
  action: 'action',
  content: 'content',
  color: 'color',
  elevation: 'elevation',
  feedback: 'feedback',
  input: 'input',
  navigation: 'navigation',
  radii: 'radii',
  space: 'spacing',
  spacing: 'spacing',
};

/** Extract unique --tt-* var references from CSS, ignoring comments. */
const extractTokenVars = (css: string): string[] => {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

  return [...new Set(stripped.match(/--tt-[a-z][a-z0-9-]*/g) || [])];
};

describe.each(
  componentContracts.map((c) => {
    return [c.name, c] as const;
  })
)('%s — CSS token compliance', (_name, contract) => {
  test('only uses --tt-* namespaces declared in contract.tokens', () => {
    const folder = contract.kind === 'component' ? 'components' : 'composites';
    const cssPath = path.join(
      SRC_DIR,
      folder,
      contract.cssSlug,
      `${contract.cssSlug}.css`
    );
    const css = fs.readFileSync(cssPath, 'utf8');
    const vars = extractTokenVars(css);
    const allowed = new Set(contract.tokens);

    const violations = vars
      .map((v) => {
        const seg = v.replace('--tt-', '').split('-')[0];
        const ns = NAMESPACE_MAP[seg];

        return ns && !allowed.has(ns)
          ? `${v} → namespace "${ns}" not in [${contract.tokens.join(', ')}]`
          : null;
      })
      .filter(Boolean);

    expect(violations).toEqual([]);
  });
});
