import {
  auroraWithDataviz,
  bruttalWithDataviz,
  defaultWithDataviz,
  neonWithDataviz,
  ocaWithDataviz,
  terraWithDataviz,
} from '../../../../src/dataviz/themes';

/**
 * **Phase 6.12 - Dataviz Family Validation Tests**
 *
 * Tests for themes extended with dataviz tokens (via `withDataviz`).
 *
 * **Test coverage:**
 * - Core palette completeness (qualitative 1-8, sequential 1-7, diverging 1-7)
 * - Semantic dataviz refs resolve to `core.dataviz.*` (structure check only - resolution happens at runtime)
 * - Shape/pattern/stroke/opacity completeness
 */

// Dataviz theme entries for parameterized testing
const datavizThemeEntries = [
  ['default+dataviz', defaultWithDataviz],
  ['aurora+dataviz', auroraWithDataviz],
  ['bruttal+dataviz', bruttalWithDataviz],
  ['neon+dataviz', neonWithDataviz],
  ['oca+dataviz', ocaWithDataviz],
  ['terra+dataviz', terraWithDataviz],
] as const;

// ---------------------------------------------------------------------------
// Core Dataviz Palette Completeness
// ---------------------------------------------------------------------------

describe.each(datavizThemeEntries)(
  'Dataviz: Core palette completeness — %s',
  (name, theme) => {
    test('qualitative palette has colors 1-8', () => {
      const { core } = theme;
      expect(core.dataviz?.color.qualitative).toBeDefined();

      const qualitative = core.dataviz!.color.qualitative;
      expect(qualitative[1]).toBeDefined();
      expect(qualitative[2]).toBeDefined();
      expect(qualitative[3]).toBeDefined();
      expect(qualitative[4]).toBeDefined();
      expect(qualitative[5]).toBeDefined();
      expect(qualitative[6]).toBeDefined();
      expect(qualitative[7]).toBeDefined();
      expect(qualitative[8]).toBeDefined();

      // All values should be color strings (hex, rgb, etc.)
      for (const value of Object.values(qualitative)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('sequential palette has colors 1-7', () => {
      const { core } = theme;
      expect(core.dataviz?.color.sequential).toBeDefined();

      const sequential = core.dataviz!.color.sequential;
      expect(sequential[1]).toBeDefined();
      expect(sequential[2]).toBeDefined();
      expect(sequential[3]).toBeDefined();
      expect(sequential[4]).toBeDefined();
      expect(sequential[5]).toBeDefined();
      expect(sequential[6]).toBeDefined();
      expect(sequential[7]).toBeDefined();

      // All values should be color strings
      for (const value of Object.values(sequential)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('diverging palette has colors 1-7', () => {
      const { core } = theme;
      expect(core.dataviz?.color.diverging).toBeDefined();

      const diverging = core.dataviz!.color.diverging;
      expect(diverging[1]).toBeDefined();
      expect(diverging[2]).toBeDefined();
      expect(diverging[3]).toBeDefined();
      expect(diverging[4]).toBeDefined();
      expect(diverging[5]).toBeDefined();
      expect(diverging[6]).toBeDefined();
      expect(diverging[7]).toBeDefined();

      // All values should be color strings
      for (const value of Object.values(diverging)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('shape encodings 1-8 are defined', () => {
      const { core } = theme;
      expect(core.dataviz?.shape).toBeDefined();

      const shape = core.dataviz!.shape;
      expect(shape[1]).toBeDefined();
      expect(shape[2]).toBeDefined();
      expect(shape[3]).toBeDefined();
      expect(shape[4]).toBeDefined();
      expect(shape[5]).toBeDefined();
      expect(shape[6]).toBeDefined();
      expect(shape[7]).toBeDefined();
      expect(shape[8]).toBeDefined();

      // All values should be strings
      for (const value of Object.values(shape)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('pattern encodings 1-6 are defined', () => {
      const { core } = theme;
      expect(core.dataviz?.pattern).toBeDefined();

      const pattern = core.dataviz!.pattern;
      expect(pattern[1]).toBeDefined();
      expect(pattern[2]).toBeDefined();
      expect(pattern[3]).toBeDefined();
      expect(pattern[4]).toBeDefined();
      expect(pattern[5]).toBeDefined();
      expect(pattern[6]).toBeDefined();

      // All values should be strings
      for (const value of Object.values(pattern)) {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('stroke encodings (solid, dashed, dotted) are defined', () => {
      const { core } = theme;
      expect(core.dataviz?.stroke).toBeDefined();

      const stroke = core.dataviz!.stroke;
      expect(stroke.solid).toBeDefined();
      expect(stroke.dashed).toBeDefined();
      expect(stroke.dotted).toBeDefined();

      // All values should be strings
      expect(typeof stroke.solid).toBe('string');
      expect(typeof stroke.dashed).toBe('string');
      expect(typeof stroke.dotted).toBe('string');
    });

    test('opacity encodings (context, muted, uncertainty) are defined', () => {
      const { core } = theme;
      expect(core.dataviz?.opacity).toBeDefined();

      const opacity = core.dataviz!.opacity;
      expect(opacity.context).toBeDefined();
      expect(opacity.muted).toBeDefined();
      expect(opacity.uncertainty).toBeDefined();

      // All values should be numbers between 0 and 1
      expect(typeof opacity.context).toBe('number');
      expect(opacity.context).toBeGreaterThanOrEqual(0);
      expect(opacity.context).toBeLessThanOrEqual(1);

      expect(typeof opacity.muted).toBe('number');
      expect(opacity.muted).toBeGreaterThanOrEqual(0);
      expect(opacity.muted).toBeLessThanOrEqual(1);

      expect(typeof opacity.uncertainty).toBe('number');
      expect(opacity.uncertainty).toBeGreaterThanOrEqual(0);
      expect(opacity.uncertainty).toBeLessThanOrEqual(1);
    });
  }
);

// ---------------------------------------------------------------------------
// Semantic Dataviz Token References
// ---------------------------------------------------------------------------

describe.each(datavizThemeEntries)(
  'Dataviz: Semantic tokens reference core.dataviz.* — %s',
  (name, theme) => {
    test('semantic.dataviz.color.series.* references core.dataviz.color.qualitative.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.series).toBeDefined();

      const series = semantic.dataviz!.color.series;
      expect(series[1]).toBeDefined();
      expect(series[2]).toBeDefined();
      expect(series[3]).toBeDefined();
      expect(series[4]).toBeDefined();
      expect(series[5]).toBeDefined();
      expect(series[6]).toBeDefined();
      expect(series[7]).toBeDefined();
      expect(series[8]).toBeDefined();

      // All values should be token references to core.dataviz
      for (const value of Object.values(series)) {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\{core\.dataviz\./);
      }
    });

    test('semantic.dataviz.color.scale.sequential.* references core.dataviz.color.sequential.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.scale.sequential).toBeDefined();

      const sequential = semantic.dataviz!.color.scale.sequential;
      expect(sequential[1]).toBeDefined();
      expect(sequential[2]).toBeDefined();
      expect(sequential[3]).toBeDefined();
      expect(sequential[4]).toBeDefined();
      expect(sequential[5]).toBeDefined();
      expect(sequential[6]).toBeDefined();
      expect(sequential[7]).toBeDefined();

      // All values should be token references to core.dataviz
      for (const value of Object.values(sequential)) {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\{core\.dataviz\./);
      }
    });

    test('semantic.dataviz.color.scale.diverging.* references core.dataviz.color.diverging.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.scale.diverging).toBeDefined();

      const diverging = semantic.dataviz!.color.scale.diverging;
      expect(diverging.neg3).toBeDefined();
      expect(diverging.neg2).toBeDefined();
      expect(diverging.neg1).toBeDefined();
      expect(diverging.neutral).toBeDefined();
      expect(diverging.pos1).toBeDefined();
      expect(diverging.pos2).toBeDefined();
      expect(diverging.pos3).toBeDefined();

      // All values should be token references to core.dataviz
      for (const value of Object.values(diverging)) {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\{core\.dataviz\./);
      }
    });

    test('semantic.dataviz.encoding.shape.series.* references core.dataviz.shape.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.encoding.shape.series).toBeDefined();

      const shape = semantic.dataviz!.encoding.shape.series;
      expect(shape[1]).toBeDefined();
      expect(shape[2]).toBeDefined();
      expect(shape[3]).toBeDefined();
      expect(shape[4]).toBeDefined();
      expect(shape[5]).toBeDefined();
      expect(shape[6]).toBeDefined();
      expect(shape[7]).toBeDefined();
      expect(shape[8]).toBeDefined();

      // All values should be token references to core.dataviz
      for (const value of Object.values(shape)) {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\{core\.dataviz\./);
      }
    });

    test('semantic.dataviz.encoding.pattern.series.* references core.dataviz.pattern.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.encoding.pattern.series).toBeDefined();

      const pattern = semantic.dataviz!.encoding.pattern.series;
      expect(pattern[1]).toBeDefined();
      expect(pattern[2]).toBeDefined();
      expect(pattern[3]).toBeDefined();
      expect(pattern[4]).toBeDefined();
      expect(pattern[5]).toBeDefined();
      expect(pattern[6]).toBeDefined();

      // All values should be token references to core.dataviz
      for (const value of Object.values(pattern)) {
        expect(typeof value).toBe('string');
        expect(value).toMatch(/^\{core\.dataviz\./);
      }
    });

    test('semantic.dataviz.encoding.stroke.* references core.dataviz.stroke.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.encoding.stroke).toBeDefined();

      const stroke = semantic.dataviz!.encoding.stroke;
      expect(stroke.reference).toBeDefined();
      expect(stroke.forecast).toBeDefined();
      expect(stroke.uncertainty).toBeDefined();

      // All values should be token references to core.dataviz
      expect(typeof stroke.reference).toBe('string');
      expect(stroke.reference).toMatch(/^\{core\.dataviz\./);
      expect(typeof stroke.forecast).toBe('string');
      expect(stroke.forecast).toMatch(/^\{core\.dataviz\./);
      expect(typeof stroke.uncertainty).toBe('string');
      expect(stroke.uncertainty).toMatch(/^\{core\.dataviz\./);
    });

    test('semantic.dataviz.encoding.opacity.* references core.dataviz.opacity.*', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.encoding.opacity).toBeDefined();

      const opacity = semantic.dataviz!.encoding.opacity;
      expect(opacity.context).toBeDefined();
      expect(opacity.muted).toBeDefined();
      expect(opacity.uncertainty).toBeDefined();

      // All values should be token references to core.dataviz
      expect(typeof opacity.context).toBe('string');
      expect(opacity.context).toMatch(/^\{core\.dataviz\./);
      expect(typeof opacity.muted).toBe('string');
      expect(opacity.muted).toMatch(/^\{core\.dataviz\./);
      expect(typeof opacity.uncertainty).toBe('string');
      expect(opacity.uncertainty).toMatch(/^\{core\.dataviz\./);
    });

    test('semantic.dataviz.color.reference.* has valid token references', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.reference).toBeDefined();

      const reference = semantic.dataviz!.color.reference;
      expect(reference.baseline).toBeDefined();
      expect(reference.target).toBeDefined();

      // Values should be token references (to core.colors or core.dataviz)
      expect(typeof reference.baseline).toBe('string');
      expect(reference.baseline).toContain('{core.');
      expect(typeof reference.target).toBe('string');
      expect(reference.target).toContain('{core.');
    });

    test('semantic.dataviz.color.state.* has valid token references', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.state).toBeDefined();

      const state = semantic.dataviz!.color.state;
      expect(state.highlight).toBeDefined();
      expect(state.muted).toBeDefined();
      expect(state.selected).toBeDefined();

      // Values should be token references
      expect(typeof state.highlight).toBe('string');
      expect(state.highlight).toContain('{core.');
      expect(typeof state.muted).toBe('string');
      expect(state.muted).toContain('{core.');
      expect(typeof state.selected).toBe('string');
      expect(state.selected).toContain('{core.');
    });

    test('semantic.dataviz.color.status.* has valid token references', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.color.status).toBeDefined();

      const status = semantic.dataviz!.color.status;
      expect(status.missing).toBeDefined();
      expect(status.suppressed).toBeDefined();
      expect(status['not-applicable']).toBeDefined();

      // Values should be token references
      expect(typeof status.missing).toBe('string');
      expect(status.missing).toContain('{core.');
      expect(typeof status.suppressed).toBe('string');
      expect(status.suppressed).toContain('{core.');
      expect(typeof status['not-applicable']).toBe('string');
      expect(status['not-applicable']).toContain('{core.');
    });

    test('semantic.dataviz.geo.context.* has valid token references', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.geo.context).toBeDefined();

      const geo = semantic.dataviz!.geo.context;
      expect(geo.muted).toBeDefined();
      expect(geo.boundary).toBeDefined();
      expect(geo.label).toBeDefined();

      // Values should be token references
      expect(typeof geo.muted).toBe('string');
      expect(geo.muted).toContain('{core.');
      expect(typeof geo.boundary).toBe('string');
      expect(geo.boundary).toContain('{core.');
      expect(typeof geo.label).toBe('string');
      expect(geo.label).toContain('{core.');
    });

    test('semantic.dataviz.geo.state.* has valid token references', () => {
      const { semantic } = theme;
      expect(semantic.dataviz?.geo.state).toBeDefined();

      const geo = semantic.dataviz!.geo.state;
      expect(geo.selection).toBeDefined();
      expect(geo.focus).toBeDefined();

      // Values should be token references
      expect(typeof geo.selection).toBe('string');
      expect(geo.selection).toContain('{core.');
      expect(typeof geo.focus).toBe('string');
      expect(geo.focus).toContain('{core.');
    });
  }
);
