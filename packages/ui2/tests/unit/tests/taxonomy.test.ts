/**
 * Taxonomy Invariants — Layer 1 structural guarantees.
 *
 * These tests verify the runtime integrity of the semantic taxonomy.
 * No rendering, no theme-v2, no Ark UI.
 *
 * Design: tests are structural, not content-snapshots.
 * They catch corruption (duplicates, empty strings, missing entries)
 * without requiring updates when new Responsibilities are legitimately
 * added to the vocabulary.
 *
 * INVARIANTS ENFORCED:
 *   1. RESPONSIBILITIES has no duplicates or empty strings
 *   2. EVALUATIONS has no duplicates or empty strings
 *   3. CONSEQUENCES has no duplicates or empty strings
 */

import {
  CONSEQUENCES,
  EVALUATIONS,
  RESPONSIBILITIES,
} from 'src/_model/taxonomy';

/* ================================================================== */
/*  1. RESPONSIBILITIES — structural integrity                         */
/* ================================================================== */

describe('RESPONSIBILITIES', () => {
  test('has no duplicate values', () => {
    expect(new Set(RESPONSIBILITIES).size).toBe(RESPONSIBILITIES.length);
  });

  test('contains no empty strings', () => {
    for (const r of RESPONSIBILITIES) {
      expect(r.length).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== */
/*  2. EVALUATIONS — structural integrity                              */
/* ================================================================== */

describe('EVALUATIONS', () => {
  test('has no duplicate values', () => {
    expect(new Set(EVALUATIONS).size).toBe(EVALUATIONS.length);
  });

  test('contains no empty strings', () => {
    for (const e of EVALUATIONS) {
      expect(e.length).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== */
/*  3. CONSEQUENCES — structural integrity                             */
/* ================================================================== */

describe('CONSEQUENCES', () => {
  test('has no duplicate values', () => {
    expect(new Set(CONSEQUENCES).size).toBe(CONSEQUENCES.length);
  });

  test('contains no empty strings', () => {
    for (const c of CONSEQUENCES) {
      expect(c.length).toBeGreaterThan(0);
    }
  });
});
