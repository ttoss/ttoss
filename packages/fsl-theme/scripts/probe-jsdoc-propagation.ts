/* eslint-disable */
/**
 * JSDoc Propagation Probe — dist verification
 *
 * Validates that JSDoc placed on semantic-leaf properties in `src/families/`
 * survives into the consumer-facing `dist/vars.d.ts` after a build, so that
 * IDE hover and LLM inference context both see it.
 *
 * Target: `dist/vars.d.ts` (what a consumer gets after `npm install`).
 * Tool:   ts-morph — parses the emitted declarations without recompiling source.
 *
 * Strategy:
 *   1. Open `dist/vars.d.ts` with ts-morph (follows `Types-*.d.ts` imports).
 *   2. Walk the `vars` type recursively; string leaves are the probe targets.
 *   3. For each leaf, resolve its declaration back to the original interface
 *      property and read the JSDoc description.
 *   4. Assert specific paths carry expected description text.
 *   5. Assert total JSDoc-bearing leaves ≥ MIN_JSDOC_LEAVES.
 *   6. Assert @warning anti-pattern notes survive in the emitted declarations.
 *
 * Wire:   `pnpm run build:verify` (runs build + this script).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Node, Project } from 'ts-morph';
import type { Type } from 'ts-morph';

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

/** Minimum number of semantic leaves that must carry JSDoc description text. */
const MIN_JSDOC_LEAVES = 30;

/**
 * Specific path → expected JSDoc substring.
 * Each entry is an authoritative cross-check that a known semantic leaf
 * carries the correct description after a build.
 */
const EXPECTED_PATHS: Array<{ path: string[]; substring: string }> = [
  {
    path: ['colors', 'action', 'primary', 'background', 'default'],
    substring: 'Resting / base state',
  },
  {
    path: ['colors', 'input', 'negative', 'border', 'default'],
    substring: 'Resting / base state',
  },
  {
    path: ['colors', 'feedback', 'positive', 'text', 'default'],
    substring: 'Resting / base state',
  },
  {
    path: ['colors', 'action', 'primary'],
    substring: 'most important action',
  },
  {
    path: ['colors', 'action', 'primary', 'background'],
    substring: 'Fills and surface backgrounds',
  },
];

/**
 * JSDoc text that must appear verbatim in the emitted Types-*.d.ts to confirm
 * anti-pattern notes survive compilation.
 * These correspond to ISSUES.md ISS-1 @warning requirements:
 *   - `opacity.disabled` ownership disambiguation
 *   - `feedback.*`, not here  (action.negative look-alike)
 *   - `Do not confuse` or equivalent state-law notes
 */
const REQUIRED_DIST_STRINGS: string[] = [
  'opacity.disabled',          // disabled ownership anti-pattern note
  'feedback.*`, not here',     // look-alike: action.negative vs feedback.*
  'Do not confuse',            // state-law disambiguation (hover vs active etc.)
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const varsDistPath = path.join(distDir, 'vars.d.ts');

if (!fs.existsSync(varsDistPath)) {
  console.error(
    `\n[probe] dist/vars.d.ts not found. Run "pnpm run build" first.\n` +
      `  Expected: ${varsDistPath}\n`
  );
  process.exit(2);
}

// Find the Types-*.d.ts chunk (content-hashed filename).
const typesChunk = fs
  .readdirSync(distDir)
  .find((f) => /^Types-[^/]+\.d\.ts$/.test(f));

if (!typesChunk) {
  console.error('[probe] No Types-*.d.ts chunk found in dist/. Build may be incomplete.');
  process.exit(2);
}

const typesChunkPath = path.join(distDir, typesChunk);

// ---------------------------------------------------------------------------
// ts-morph project — dist declarations only, no source
// ---------------------------------------------------------------------------

const project = new Project({ skipAddingFilesFromTsConfig: true });
const sf = project.addSourceFileAtPath(varsDistPath);

// vars declaration
const varsDeclNode = sf.getVariableDeclaration('vars');
if (!varsDeclNode) {
  console.error('[probe] Could not find `vars` declaration in dist/vars.d.ts.');
  process.exit(2);
}

const varsRootType = varsDeclNode.getType();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip `| undefined` from a union type. */
function unwrap(t: Type): Type {
  if (t.isUnion()) {
    return t.getUnionTypes().find((u) => !u.isUndefined()) ?? t;
  }
  return t;
}

/** Read JSDoc description from a symbol's declarations. */
function getJsDoc(sym: ReturnType<Type['getProperty']>): string {
  if (!sym) return '';
  for (const decl of sym.getDeclarations()) {
    if (Node.isJSDocable(decl)) {
      const jsdocs = decl.getJsDocs();
      if (jsdocs.length > 0) {
        const desc = jsdocs.map((d) => d.getDescription().trim()).join(' ');
        if (desc) return desc;
      }
    }
  }
  return '';
}

/** Resolve a property path on a type, unwrapping optionals at each step. */
function resolvePath(type: Type, segments: string[]): Type | undefined {
  let current: Type = type;
  for (const seg of segments) {
    const prop = current.getProperty(seg);
    if (!prop) return undefined;
    current = unwrap(prop.getTypeAtLocation(sf));
  }
  return current;
}

// ---------------------------------------------------------------------------
// Walk vars recursively, collecting all string-leaf JSDoc
// ---------------------------------------------------------------------------

interface LeafResult {
  pathStr: string;
  jsDoc: string;
}

const leaves: LeafResult[] = [];

function walk(type: Type, pathParts: string[]): void {
  const props = type.getProperties();
  for (const prop of props) {
    const name = prop.getName();
    if (name.startsWith('$')) continue; // skip metadata keys

    const propType = unwrap(prop.getTypeAtLocation(sf));
    const fullPath = [...pathParts, name];

    if (propType.isString() || propType.getText() === 'string') {
      // Leaf: a CSS var reference
      const jsDoc = getJsDoc(prop);
      leaves.push({ pathStr: fullPath.join('.'), jsDoc });
    } else {
      walk(propType, fullPath);
    }
  }
}

walk(varsRootType, []);

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

const leavesWithJsDoc = leaves.filter((l) => l.jsDoc.length > 0);
const leavesWithout = leaves.filter((l) => l.jsDoc.length === 0);

console.log('\n=== JSDoc Propagation Probe (dist) ===\n');
console.log(`Total semantic leaves : ${leaves.length}`);
console.log(`With JSDoc description: ${leavesWithJsDoc.length}`);
console.log(`Without JSDoc         : ${leavesWithout.length}`);

if (leavesWithout.length > 0 && leavesWithout.length <= 20) {
  console.log('\nLeaves missing JSDoc:');
  for (const l of leavesWithout) {
    console.log('  ', l.pathStr);
  }
}

// ---------------------------------------------------------------------------
// Specific path assertions
// ---------------------------------------------------------------------------

console.log('\n--- Path assertions ---');
const pathFailures: string[] = [];

for (const { path: segments, substring } of EXPECTED_PATHS) {
  const pathStr = segments.join('.');
  const type = resolvePath(varsRootType, segments.slice(0, -1));
  if (!type) {
    const msg = `FAIL  ${pathStr}  (path not found)`;
    console.log(msg);
    pathFailures.push(msg);
    continue;
  }
  // For the last segment, get the property JSDoc directly
  const lastSeg = segments[segments.length - 1];
  const prop = type.getProperty(lastSeg);
  const jsDoc = getJsDoc(prop);
  const ok = jsDoc.includes(substring);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${pathStr}`);
  if (!ok) {
    const msg = `FAIL  ${pathStr}: expected "${substring}", got: "${jsDoc}"`;
    pathFailures.push(msg);
  }
}

// ---------------------------------------------------------------------------
// @warning / anti-pattern note assertions (raw dist text)
// ---------------------------------------------------------------------------

console.log('\n--- @warning / anti-pattern note assertions ---');
const distText = fs.readFileSync(typesChunkPath, 'utf8');
const warningFailures: string[] = [];

for (const required of REQUIRED_DIST_STRINGS) {
  const ok = distText.includes(required);
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${required}" in ${typesChunk}`);
  if (!ok) warningFailures.push(required);
}

// ---------------------------------------------------------------------------
// Count assertion
// ---------------------------------------------------------------------------

console.log('\n--- Count assertion ---');
const countOk = leavesWithJsDoc.length >= MIN_JSDOC_LEAVES;
console.log(
  `${countOk ? 'PASS' : 'FAIL'}  JSDoc leaves ${leavesWithJsDoc.length} >= ${MIN_JSDOC_LEAVES}`
);

// ---------------------------------------------------------------------------
// Final verdict
// ---------------------------------------------------------------------------

const failures = [
  ...pathFailures,
  ...warningFailures.map((s) => `missing in dist: "${s}"`),
  ...(countOk ? [] : [`JSDoc leaf count ${leavesWithJsDoc.length} < ${MIN_JSDOC_LEAVES}`]),
];

console.log(
  `\nVerdict: ${
    failures.length === 0
      ? 'JSDoc PROPAGATES to dist ✅  — co-located JSDoc strategy is sufficient.'
      : `PROPAGATION FAILURES ❌\n${failures.map((f) => '  ' + f).join('\n')}`
  }\n`
);

process.exit(failures.length === 0 ? 0 : 1);
