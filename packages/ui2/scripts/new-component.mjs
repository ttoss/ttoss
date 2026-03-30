#!/usr/bin/env node

/**
 * Scaffold a new ui2 component or composite.
 *
 * Usage:
 *   node scripts/new-component.mjs <slug> --responsibility <R> [--kind composite] [--ark <primitive>] [--host <Host>] [--dry-run]
 *
 * Examples:
 *   node scripts/new-component.mjs alert --responsibility Feedback
 *   node scripts/new-component.mjs menu --responsibility Collection --kind composite --ark menu --host ItemFrame
 *   node scripts/new-component.mjs separator --responsibility Structure --dry-run
 *
 * What it generates/modifies:
 *   CREATE  src/{components|composites}/{slug}/{slug}.tsx
 *   CREATE  src/{components|composites}/{slug}/{slug}.css
 *   MODIFY  src/index.ts               (add export)
 *   MODIFY  src/styles.css              (add CSS import)
 *   MODIFY  src/_model/index.ts         (add componentContract entry)
 *   MODIFY  tests/unit/tests/componentRegistry.tsx  (add registry entry)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

/* ------------------------------------------------------------------ */
/*  CLI parsing                                                        */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);

const getFlag = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return args[idx + 1];
};

const hasFlag = (name) => {
  return args.includes(`--${name}`);
};

const slug = args[0];
const responsibility = getFlag('responsibility');
const kind = getFlag('kind') || 'component';
const arkPrimitive = getFlag('ark') || slug;
const host = getFlag('host');
const dryRun = hasFlag('dry-run');

if (!slug || !responsibility) {
  console.error(
    'Usage: node scripts/new-component.mjs <slug> --responsibility <Responsibility> [--kind composite] [--ark <primitive>] [--host <Host>] [--dry-run]'
  );
  console.error('');
  console.error(
    'Responsibilities: Action, Input, Selection, Collection, Overlay, Navigation, Disclosure, Feedback, Structure'
  );
  process.exit(1);
}

const VALID_RESPONSIBILITIES = [
  'Action',
  'Input',
  'Selection',
  'Collection',
  'Overlay',
  'Navigation',
  'Disclosure',
  'Feedback',
  'Structure',
];

if (!VALID_RESPONSIBILITIES.includes(responsibility)) {
  console.error(`Invalid responsibility: "${responsibility}"`);
  console.error(`Valid: ${VALID_RESPONSIBILITIES.join(', ')}`);
  process.exit(1);
}

const VALID_KINDS = ['component', 'composite'];
if (!VALID_KINDS.includes(kind)) {
  console.error(`Invalid kind: "${kind}". Must be "component" or "composite".`);
  process.exit(1);
}

const VALID_HOSTS = ['ActionSet', 'FieldFrame', 'ItemFrame', 'SurfaceFrame'];
if (host && !VALID_HOSTS.includes(host)) {
  console.error(`Invalid host: "${host}". Valid: ${VALID_HOSTS.join(', ')}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/*  Derived names                                                      */
/* ------------------------------------------------------------------ */

/** "alert-dialog" → "AlertDialog" */
const Name = slug
  .split('-')
  .map((s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
  })
  .join('');

const folder = kind === 'component' ? 'components' : 'composites';
const dir = path.join(ROOT, 'src', folder, slug);

/* ------------------------------------------------------------------ */
/*  Token resolution (mirrors responsibilityDefaults)                  */
/* ------------------------------------------------------------------ */

const RESPONSIBILITY_DEFAULTS = {
  Action: {
    color: 'action.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
    sizing: 'hit.default',
    radii: 'control',
  },
  Input: {
    color: 'input.primary',
    textStyle: 'body.md',
    spacing: 'inset.control',
    sizing: 'hit.default',
    radii: 'control',
  },
  Selection: {
    color: 'input.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
  },
  Collection: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
  },
  Navigation: {
    color: 'navigation.primary',
    textStyle: 'label.md',
    spacing: 'inset.control',
  },
  Disclosure: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.control',
  },
  Overlay: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
    elevation: 'modal',
    radii: 'surface',
  },
  Feedback: {
    color: 'feedback.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
    radii: 'surface',
  },
  Structure: {
    color: 'content.primary',
    textStyle: 'body.md',
    spacing: 'inset.surface',
  },
};

const tokens = RESPONSIBILITY_DEFAULTS[responsibility];
const colorPrefix = tokens.color.replace('.', '-');

/** Derive token namespaces from the default TokenSpec */
const deriveNamespaces = (spec) => {
  const ns = new Set();
  if (spec.color) {
    const ux = spec.color.split('.')[0]; // 'action', 'input', 'content', etc.
    ns.add(ux);
  }
  if (spec.spacing) ns.add('spacing');
  if (spec.radii) ns.add('radii');
  if (spec.elevation) ns.add('elevation');
  return [...ns].sort();
};

const tokenNamespaces = deriveNamespaces(tokens);

/* ------------------------------------------------------------------ */
/*  Templates                                                          */
/* ------------------------------------------------------------------ */

const componentTsx = () => {
  return `import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Responsibility: **${responsibility}**
 * Token resolution: \`resolveTokens({ responsibility: '${responsibility}' })\`
 */
export interface ${Name}Props
  extends React.HTMLAttributes<HTMLDivElement> {}

export const ${Name} = React.forwardRef<HTMLDivElement, ${Name}Props>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('ui2-${slug}', className)}
        {...props}
      />
    );
  }
);

${Name}.displayName = '${Name}';
`;
};

const compositeTsx = () => {
  return `import * as React from 'react';

import { cn } from '../../_shared/cn';

/**
 * Responsibility: **${responsibility}**
 * Token resolution: \`resolveTokens({ responsibility: '${responsibility}' })\`
 */

const ${Name}Root = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('ui2-${slug}', className)}
        {...props}
      />
    );
  }
);
${Name}Root.displayName = '${Name}.Root';

export const ${Name} = Object.assign(${Name}Root, {
  Root: ${Name}Root,
});
`;
};

const cssTemplate = () => {
  const spacingVar = tokens.spacing
    ? `--tt-spacing-${tokens.spacing.replace('.', '-')}-md`
    : '--tt-spacing-inset-control-md';
  const radiiVar = tokens.radii ? `--tt-radii-semantic-${tokens.radii}` : null;
  const elevationVar = tokens.elevation
    ? `--tt-elevation-${tokens.elevation}`
    : null;

  let rules = `  font-family: var(--tt-font-sans);
  color: var(--tt-${colorPrefix}-text-default);
  padding: var(${spacingVar});`;

  if (radiiVar) {
    rules += `\n  border-radius: var(${radiiVar});`;
  }
  if (elevationVar) {
    rules += `\n  box-shadow: var(${elevationVar});`;
  }

  const headerTokens = [`color: ${tokens.color}`, `spacing: ${tokens.spacing}`];
  if (tokens.radii) headerTokens.push(`radii: ${tokens.radii}`);
  if (tokens.elevation) headerTokens.push(`elevation: ${tokens.elevation}`);

  return `/* ---------------------------------------------------------------------------
 * ${Name} — Responsibility: ${responsibility}
 * Token resolution: resolveTokens({ responsibility: '${responsibility}' })
 *   → ${headerTokens.join(', ')}
 * ------------------------------------------------------------------------- */

.ui2-${slug} {
${rules}
}
`;
};

/* ------------------------------------------------------------------ */
/*  File operations                                                    */
/* ------------------------------------------------------------------ */

const operations = [];

const createFile = (filePath, content) => {
  operations.push({ type: 'create', filePath, content });
};

const insertInFile = (filePath, { after, before, content, sectionComment }) => {
  operations.push({
    type: 'insert',
    filePath,
    after,
    before,
    content,
    sectionComment,
  });
};

/* ---- 1. Create TSX ---- */
createFile(
  path.join(dir, `${slug}.tsx`),
  kind === 'composite' ? compositeTsx() : componentTsx()
);

/* ---- 2. Create CSS ---- */
createFile(path.join(dir, `${slug}.css`), cssTemplate());

/* ---- 3. Modify src/index.ts ---- */
const indexExport =
  kind === 'composite'
    ? `\n// ${responsibility}\nexport { ${Name} } from './${folder}/${slug}/${slug}';\n`
    : `\n// ${responsibility}\nexport type { ${Name}Props } from './${folder}/${slug}/${slug}';\nexport { ${Name} } from './${folder}/${slug}/${slug}';\n`;

insertInFile(path.join(ROOT, 'src/index.ts'), {
  content: indexExport,
});

/* ---- 4. Modify src/styles.css ---- */
const cssImportLine = `@import './${folder}/${slug}/${slug}.css';`;
insertInFile(path.join(ROOT, 'src/styles.css'), {
  sectionComment: kind === 'composite' ? 'Composites' : 'Components',
  content: cssImportLine,
});

/* ---- 5. Modify src/_model/index.ts ---- */
const hostLine = host ? `\n    host: '${host}',` : '';
const contractEntry = `  {
    name: '${Name}',
    kind: '${kind}',
    responsibility: '${responsibility}',
    cssSlug: '${slug}',
    tokens: [${tokenNamespaces
      .map((n) => {
        return `'${n}'`;
      })
      .join(', ')}],
    arkPrimitive: '${arkPrimitive}',${hostLine}
  },`;
insertInFile(path.join(ROOT, 'src/_model/index.ts'), {
  before: '];',
  content: contractEntry,
});

/* ---- 6. Modify tests/unit/tests/componentRegistry.tsx ---- */
const registryImportLine = kind === 'composite' ? `  ${Name},` : `  ${Name},`;

const registryEntry =
  kind === 'composite'
    ? `
  /* ── ${Name} ──${'─'.repeat(Math.max(0, 55 - Name.length))} */
  {
    name: '${Name}',
    cssSlug: '${slug}',
    responsibility: '${responsibility}',
    render: () => {
      return (
        <${Name}.Root>
          Content
        </${Name}.Root>
      );
    },
    expectedClasses: ['ui2-${slug}'],
    classNameTargets: [
      {
        name: '${Name}.Root',
        baseClass: 'ui2-${slug}',
        selector: '.ui2-${slug}',
        render: (cn) => {
          return (
            <${Name}.Root className={cn}>
              C
            </${Name}.Root>
          );
        },
      },
    ],
  },`
    : `
  /* ── ${Name} ──${'─'.repeat(Math.max(0, 55 - Name.length))} */
  {
    name: '${Name}',
    cssSlug: '${slug}',
    responsibility: '${responsibility}',
    render: () => {
      return <${Name}>Test</${Name}>;
    },
    expectedClasses: ['ui2-${slug}'],
    classNameTargets: [
      {
        name: '${Name}',
        baseClass: 'ui2-${slug}',
        selector: '.ui2-${slug}',
        render: (cn) => {
          return <${Name} className={cn}>T</${Name}>;
        },
      },
    ],
  },`;

insertInFile(path.join(ROOT, 'tests/unit/tests/componentRegistry.tsx'), {
  after: 'REGISTRY_IMPORT_MARKER',
  content: registryImportLine,
});

insertInFile(path.join(ROOT, 'tests/unit/tests/componentRegistry.tsx'), {
  before: 'REGISTRY_ENTRY_MARKER',
  content: registryEntry,
});

/* ------------------------------------------------------------------ */
/*  Execute operations                                                 */
/* ------------------------------------------------------------------ */

const executeCreate = (op) => {
  if (fs.existsSync(op.filePath)) {
    console.log(`  SKIP (exists): ${path.relative(ROOT, op.filePath)}`);
    return true;
  }
  const dir = path.dirname(op.filePath);
  if (!fs.existsSync(dir)) {
    if (dryRun) {
      console.log(`  MKDIR ${path.relative(ROOT, dir)}`);
    } else {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  if (dryRun) {
    console.log(`  CREATE ${path.relative(ROOT, op.filePath)}`);
    console.log(op.content);
    return true;
  }
  fs.writeFileSync(op.filePath, op.content, 'utf8');
  console.log(`  CREATE ${path.relative(ROOT, op.filePath)}`);
  return true;
};

const executeInsert = (op) => {
  const rel = path.relative(ROOT, op.filePath);
  let content = fs.readFileSync(op.filePath, 'utf8');

  if (
    op.filePath.endsWith('index.ts') &&
    op.filePath.includes('src/') &&
    !op.filePath.includes('_model/')
  ) {
    // Append export to end of src/index.ts
    if (content.includes(`./${folder}/${slug}/${slug}`)) {
      console.log(`  SKIP (already exported): ${rel}`);
      return true;
    }
    const newContent = content.trimEnd() + '\n' + op.content;
    if (dryRun) {
      console.log(`  MODIFY ${rel} (append export)`);
      return true;
    }
    fs.writeFileSync(op.filePath, newContent, 'utf8');
    console.log(`  MODIFY ${rel} (append export)`);
    return true;
  }

  if (op.filePath.endsWith('styles.css')) {
    // Insert CSS import alphabetically in the correct section
    if (content.includes(op.content)) {
      console.log(`  SKIP (already imported): ${rel}`);
      return true;
    }
    const sectionHeader =
      kind === 'composite'
        ? '/* Composites (multi-part) */'
        : '/* Components (primitives) */';
    const lines = content.split('\n');
    const sectionIdx = lines.findIndex((l) => {
      return l.includes(sectionHeader);
    });
    if (sectionIdx === -1) {
      console.error(`  ERROR: section "${sectionHeader}" not found in ${rel}`);
      return false;
    }
    // Find the import lines in this section and insert alphabetically
    let insertIdx = sectionIdx + 1;
    while (
      insertIdx < lines.length &&
      lines[insertIdx].startsWith("@import './" + folder)
    ) {
      if (lines[insertIdx] > op.content) break;
      insertIdx++;
    }
    lines.splice(insertIdx, 0, op.content);
    const newContent = lines.join('\n');
    if (dryRun) {
      console.log(`  MODIFY ${rel} (insert import at line ${insertIdx + 1})`);
      return true;
    }
    fs.writeFileSync(op.filePath, newContent, 'utf8');
    console.log(`  MODIFY ${rel} (insert import)`);
    return true;
  }

  if (op.filePath.endsWith('_model/index.ts')) {
    // Insert contract entry before closing '];'
    if (content.includes(`name: '${Name}'`)) {
      console.log(`  SKIP (contract exists): ${rel}`);
      return true;
    }
    const marker = '\n];';
    const idx = content.lastIndexOf(marker);
    if (idx === -1) {
      console.error(`  ERROR: closing '];\' not found in ${rel}`);
      return false;
    }
    const newContent =
      content.slice(0, idx) +
      '\n' +
      op.content +
      marker +
      content.slice(idx + marker.length);
    if (dryRun) {
      console.log(`  MODIFY ${rel} (add contract entry)`);
      return true;
    }
    fs.writeFileSync(op.filePath, newContent, 'utf8');
    console.log(`  MODIFY ${rel} (add contract entry)`);
    return true;
  }

  if (op.filePath.endsWith('componentRegistry.tsx')) {
    if (op.after === 'REGISTRY_IMPORT_MARKER') {
      // Add import to the existing import block
      if (content.includes(`  ${Name},\n`) || content.includes(`  ${Name}\n`)) {
        console.log(`  SKIP (import exists): ${rel}`);
        return true;
      }
      // Find the import block from 'src/index' and add before its closing
      const importMatch = content.match(
        /import\s*\{([^}]+)\}\s*from\s*'src\/index';/s
      );
      if (!importMatch) {
        console.error(`  ERROR: import from 'src/index' not found in ${rel}`);
        return false;
      }
      const oldImportBlock = importMatch[0];
      const importNames = importMatch[1]
        .split(',')
        .map((s) => {
          return s.trim();
        })
        .filter(Boolean);
      importNames.push(Name);
      importNames.sort();
      const newImportBlock = `import {\n  ${importNames.join(',\n  ')},\n} from 'src/index';`;
      const newContent = content.replace(oldImportBlock, newImportBlock);
      if (dryRun) {
        console.log(`  MODIFY ${rel} (add import: ${Name})`);
        return true;
      }
      fs.writeFileSync(op.filePath, newContent, 'utf8');
      console.log(`  MODIFY ${rel} (add import: ${Name})`);
      return true;
    }

    if (op.before === 'REGISTRY_ENTRY_MARKER') {
      // Add registry entry before the closing '];'
      if (content.includes(`name: '${Name}'`)) {
        console.log(`  SKIP (registry entry exists): ${rel}`);
        return true;
      }
      const marker = '\n];';
      const idx = content.lastIndexOf(marker);
      if (idx === -1) {
        console.error(`  ERROR: closing '];' not found in ${rel}`);
        return false;
      }
      const newContent =
        content.slice(0, idx) +
        '\n' +
        op.content +
        marker +
        content.slice(idx + marker.length);
      if (dryRun) {
        console.log(`  MODIFY ${rel} (add registry entry)`);
        return true;
      }
      fs.writeFileSync(op.filePath, newContent, 'utf8');
      console.log(`  MODIFY ${rel} (add registry entry)`);
      return true;
    }
  }

  console.error(`  ERROR: unhandled insert for ${rel}`);
  return false;
};

console.log(`\nScaffolding: ${Name} (${kind}, ${responsibility})`);
console.log(`  Slug: ${slug}`);
console.log(`  Folder: src/${folder}/${slug}/`);
console.log(`  Tokens: ${tokenNamespaces.join(', ')}`);
console.log(`  Ark primitive: ${arkPrimitive}`);
if (host) console.log(`  Host: ${host}`);
if (dryRun) console.log(`  Mode: DRY RUN\n`);
else console.log('');

let success = true;
for (const op of operations) {
  const result = op.type === 'create' ? executeCreate(op) : executeInsert(op);
  if (!result) success = false;
}

if (success) {
  console.log(`\n✓ ${Name} scaffolded successfully.`);
  if (!dryRun) {
    console.log('\nNext steps:');
    console.log(
      `  1. Edit src/${folder}/${slug}/${slug}.tsx — add Ark UI integration and props`
    );
    console.log(
      `  2. Edit src/${folder}/${slug}/${slug}.css — refine token usage`
    );
    console.log(
      `  3. Edit tests/unit/tests/componentRegistry.tsx — refine render and expectedClasses`
    );
    console.log('  4. Run: pnpm run test');
    console.log('  5. Run: cd ../.. && pnpm run -w lint');
  }
} else {
  console.error('\n✗ Some operations failed. Check output above.');
  process.exit(1);
}
