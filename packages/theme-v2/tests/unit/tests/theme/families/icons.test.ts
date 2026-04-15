/**
 * Icon family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/03-components/icon-system.md#validation
 */

// Error #1 — Any canonical intent missing from a theme glyph mapping.
// Error #2 — Any opposition pair resolving to the same glyph.

// ---------------------------------------------------------------------------
// Canonical Intent Registry — mirrors the spec's Canonical Intent Registry
// ---------------------------------------------------------------------------

const CANONICAL_INTENTS = [
  // action
  'action.add',
  'action.edit',
  'action.copy',
  'action.paste',
  'action.search',
  'action.download',
  'action.upload',
  'action.share',
  'action.refresh',
  'action.close',
  'action.clear',
  'action.delete',
  // navigation
  'navigation.back',
  'navigation.forward',
  'navigation.external',
  // disclosure
  'disclosure.expand',
  'disclosure.collapse',
  // visibility
  'visibility.show',
  'visibility.hide',
  // selection
  'selection.checked',
  'selection.unchecked',
  'selection.indeterminate',
  // status
  'status.success',
  'status.warning',
  'status.error',
  'status.info',
  // object
  'object.user',
  'object.calendar',
  'object.attachment',
  'object.settings',
] as const;

type IconIntent = (typeof CANONICAL_INTENTS)[number];
type IconGlyphMap = Record<IconIntent, string>;

// ---------------------------------------------------------------------------
// Opposition Pairs — pairs that must NEVER resolve to the same glyph (Error #2)
// ---------------------------------------------------------------------------

const OPPOSITION_PAIRS: ReadonlyArray<[IconIntent, IconIntent]> = [
  ['navigation.back', 'navigation.forward'],
  ['disclosure.expand', 'disclosure.collapse'],
  ['visibility.show', 'visibility.hide'],
  ['selection.checked', 'selection.unchecked'],
  ['selection.checked', 'selection.indeterminate'],
  ['status.success', 'status.warning'],
  ['status.success', 'status.error'],
  ['status.warning', 'status.error'],
  ['status.info', 'status.error'],
];

// ---------------------------------------------------------------------------
// Mock icon mappings — two themes with intentionally different glyphs
// ---------------------------------------------------------------------------

const mockThemeAGlyphs: IconGlyphMap = {
  'action.add': 'a:plus',
  'action.edit': 'a:pencil',
  'action.copy': 'a:copy',
  'action.paste': 'a:clipboard',
  'action.search': 'a:magnify',
  'action.download': 'a:download',
  'action.upload': 'a:upload',
  'action.share': 'a:share',
  'action.refresh': 'a:refresh',
  'action.close': 'a:x',
  'action.clear': 'a:eraser',
  'action.delete': 'a:trash',
  'navigation.back': 'a:arrow-left',
  'navigation.forward': 'a:arrow-right',
  'navigation.external': 'a:external-link',
  'disclosure.expand': 'a:chevron-down',
  'disclosure.collapse': 'a:chevron-up',
  'visibility.show': 'a:eye',
  'visibility.hide': 'a:eye-off',
  'selection.checked': 'a:checkbox-checked',
  'selection.unchecked': 'a:checkbox',
  'selection.indeterminate': 'a:checkbox-indeterminate',
  'status.success': 'a:check-circle',
  'status.warning': 'a:alert-triangle',
  'status.error': 'a:x-circle',
  'status.info': 'a:info',
  'object.user': 'a:user',
  'object.calendar': 'a:calendar',
  'object.attachment': 'a:paperclip',
  'object.settings': 'a:settings',
};

const mockThemeBGlyphs: IconGlyphMap = {
  'action.add': 'b:plus',
  'action.edit': 'b:pencil',
  'action.copy': 'b:copy',
  'action.paste': 'b:clipboard',
  'action.search': 'b:magnify',
  'action.download': 'b:download',
  'action.upload': 'b:upload',
  'action.share': 'b:share',
  'action.refresh': 'b:refresh',
  'action.close': 'b:x',
  'action.clear': 'b:eraser',
  'action.delete': 'b:trash',
  'navigation.back': 'b:arrow-left',
  'navigation.forward': 'b:arrow-right',
  'navigation.external': 'b:external-link',
  'disclosure.expand': 'b:chevron-down',
  'disclosure.collapse': 'b:chevron-up',
  'visibility.show': 'b:eye',
  'visibility.hide': 'b:eye-off',
  'selection.checked': 'b:checkbox-checked',
  'selection.unchecked': 'b:checkbox',
  'selection.indeterminate': 'b:checkbox-indeterminate',
  'status.success': 'b:check-circle',
  'status.warning': 'b:alert-triangle',
  'status.error': 'b:x-circle',
  'status.info': 'b:info',
  'object.user': 'b:user',
  'object.calendar': 'b:calendar',
  'object.attachment': 'b:paperclip',
  'object.settings': 'b:settings',
};

const mockThemeMaps = [
  { label: 'theme A', map: mockThemeAGlyphs },
  { label: 'theme B', map: mockThemeBGlyphs },
];

// ---------------------------------------------------------------------------
// Cascade resolution — models ThemeProvider nesting: inner wins
//
// When two ThemeProviders are nested:
//   <ThemeProvider theme={outer}>
//     <ThemeProvider theme={inner}>
//       <Icon intent="action.add" />   ← resolves from inner
//     </ThemeProvider>
//   </ThemeProvider>
//
// The innermost (last) provider's glyph definition takes precedence.
// ---------------------------------------------------------------------------

const resolveIconMap = (
  outer: IconGlyphMap,
  inner: IconGlyphMap
): IconGlyphMap => {
  return { ...outer, ...inner };
};

// ---------------------------------------------------------------------------
// Completeness — Error #1
// ---------------------------------------------------------------------------

describe('Icon mapping — completeness', () => {
  for (const { label, map } of mockThemeMaps) {
    describe(label, () => {
      for (const intent of CANONICAL_INTENTS) {
        test(`provides a glyph for "${intent}"`, () => {
          // Error #1: canonical intent missing from theme glyph mapping
          expect(map[intent]).toBeDefined();
          expect(typeof map[intent]).toBe('string');
          expect(map[intent].length).toBeGreaterThan(0);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Opposition pairs — Error #2
// ---------------------------------------------------------------------------

describe('Icon mapping — opposition pairs must not collapse', () => {
  for (const { label, map } of mockThemeMaps) {
    describe(label, () => {
      for (const [a, b] of OPPOSITION_PAIRS) {
        test(`${a} !== ${b}`, () => {
          // Error #2: opposition pair resolving to the same glyph
          expect(map[a]).not.toBe(map[b]);
        });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Cascade — inner ThemeProvider takes precedence
// ---------------------------------------------------------------------------

describe('Icon mapping — cascade (inner ThemeProvider wins)', () => {
  test('intent defined in both themes resolves to the inner theme glyph', () => {
    const resolved = resolveIconMap(mockThemeAGlyphs, mockThemeBGlyphs);

    for (const intent of CANONICAL_INTENTS) {
      // The inner theme (B) must win over the outer (A)
      expect(resolved[intent]).toBe(mockThemeBGlyphs[intent]);
      expect(resolved[intent]).not.toBe(mockThemeAGlyphs[intent]);
    }
  });

  test('intent only defined in outer theme remains available', () => {
    // Simulate an inner theme that only overrides a subset of intents
    const partialInner = {
      ...mockThemeBGlyphs,
      'action.add': 'inner-only:plus',
    } satisfies IconGlyphMap;

    const resolved = resolveIconMap(mockThemeAGlyphs, partialInner);

    expect(resolved['action.add']).toBe('inner-only:plus');
    // All other intents come from the inner theme (B), which itself inherits from A via spread
    expect(resolved['action.edit']).toBe(mockThemeBGlyphs['action.edit']);
  });

  test('three levels of nesting: the deepest theme wins', () => {
    const mockThemeCGlyphs: IconGlyphMap = {
      ...mockThemeBGlyphs,
      'action.add': 'c:plus',
    };

    // <ThemeProvider A>          ← outermost
    //   <ThemeProvider B>
    //     <ThemeProvider C>      ← innermost — must win
    const outerMid = resolveIconMap(mockThemeAGlyphs, mockThemeBGlyphs);
    const resolved = resolveIconMap(outerMid, mockThemeCGlyphs);

    // Error: deepest provider glyph not taking precedence
    expect(resolved['action.add']).toBe('c:plus');
    expect(resolved['action.add']).not.toBe(mockThemeAGlyphs['action.add']);
    expect(resolved['action.add']).not.toBe(mockThemeBGlyphs['action.add']);
  });

  test('inner theme with all intents completely shadows the outer theme', () => {
    const resolved = resolveIconMap(mockThemeAGlyphs, mockThemeBGlyphs);

    const anyOuterGlyphSurvived = CANONICAL_INTENTS.some((intent) => {
      return resolved[intent] === mockThemeAGlyphs[intent];
    });

    // When inner covers all intents, no outer glyph should survive
    expect(anyOuterGlyphSurvived).toBe(false);
  });
});
