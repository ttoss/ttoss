/* eslint-disable no-console */
import { baseTheme as defaultTheme } from '../../../../src/baseTheme';
import { buildTheme } from '../../../../src/createTheme';
import { validateRefs } from '../../../../src/roots/validateRefs';

describe('validateRefs', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('does not warn for a fully valid theme', () => {
    validateRefs(defaultTheme);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('warns and suggests the closest path for a typo with same prefix', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.colorz.brand.500}' as any,
            },
          },
        },
      },
    });

    // buildTheme already calls validateRefs in non-prod; clear and re-run
    // explicitly so we assert against this call alone.
    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{core\.colorz\.brand\.500\}'/
    );
    expect(message).toMatch(/at path 'semantic\.elevation\.surface\.flat'/);
    expect(message).toMatch(/Did you mean '\{core\.colors\.brand\.500\}'\?/);
  });

  test('warns for a broken ref embedded in a compound expression', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          spacing: {
            gutter: {
              page: 'clamp({core.spacing.4}, {core.spacing.nope}, {core.spacing.12})',
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{core\.spacing\.nope\}'/
    );
    expect(message).toMatch(/at path 'semantic\.spacing\.gutter\.page'/);
  });

  test('omits suggestion when the broken prefix has no candidates', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{nonexistent.namespace.foo}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(
      /Invalid token reference '\{nonexistent\.namespace\.foo\}'/
    );
    expect(message).not.toMatch(/Did you mean/);
  });

  test('omits suggestion when the closest candidate is too distant', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.x}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toMatch(/Invalid token reference '\{core\.x\}'/);
    expect(message).not.toMatch(/Did you mean/);
  });

  test('reports each broken ref independently', () => {
    const theme = buildTheme({
      overrides: {
        semantic: {
          elevation: {
            surface: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              flat: '{core.colorz.brand.500}' as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              raised: '{core.spacingz.4}' as any,
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).toHaveBeenCalledTimes(2);
    const messages = warnSpy.mock.calls.map((call) => {
      return call[0] as string;
    });
    expect(
      messages.some((m) => {
        return m.includes('core.colorz.brand.500');
      })
    ).toBe(true);
    expect(
      messages.some((m) => {
        return m.includes('core.spacingz.4');
      })
    ).toBe(true);
  });

  test('accepts refs to paths added by overrides (validates after merge)', () => {
    // Add a new color family via override and reference it in semantic.
    // The ref is only valid because validation runs against the merged theme.
    const theme = buildTheme({
      overrides: {
        core: {
          colors: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cyan: { 500: '#06b6d4' } as any,
          },
        },
        semantic: {
          colors: {
            informational: {
              accent: {
                background: { default: '{core.colors.cyan.500}' },
              },
            },
          },
        },
      },
    });

    warnSpy.mockClear();
    validateRefs(theme);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
