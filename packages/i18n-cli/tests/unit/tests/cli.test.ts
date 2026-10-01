import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  formatjsBabelPlugin,
  I18N_ID_INTERPOLATION_PATTERN,
} from '@ttoss/config';
import {
  executeI18nCli,
  extractTranslationsFromSource,
  findDuplicateIds,
  getDependencyCatalogs,
  getI18nConfig,
  ID_INTERPOLATION_PATTERN,
  parseOptions,
  PRESERVE_WHITESPACE,
  runCheck,
} from 'src/index';

type Files = Record<string, unknown>;

let cwd: string;

const write = (root: string, files: Files) => {
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(
      target,
      typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    );
  }
};

const read = (file: string) => {
  return JSON.parse(fs.readFileSync(path.join(cwd, file), 'utf8'));
};

const source = (messages: Record<string, { id?: string; text: string }>) => {
  const entries = Object.entries(messages)
    .map(([key, { id, text }]) => {
      return `  ${key}: { ${id ? `id: '${id}', ` : ''}defaultMessage: '${text}', description: '${key}' },`;
    })
    .join('\n');
  return `import { defineMessages } from '@ttoss/i18n-core';\n\nexport const messages = defineMessages({\n${entries}\n});\n`;
};

/**
 * A published dependency: its package.json plus the catalogs it ships.
 */
const dependency = ({
  name,
  langs,
  sourceLocale,
  dependencies,
}: {
  name: string;
  langs: Record<string, Record<string, string>>;
  sourceLocale?: string;
  dependencies?: Record<string, string>;
}): Files => {
  const files: Files = {
    [`node_modules/${name}/package.json`]: { name, dependencies },
  };
  for (const [locale, messages] of Object.entries(langs)) {
    files[`node_modules/${name}/i18n/lang/${locale}.json`] = Object.fromEntries(
      Object.entries(messages).map(([id, defaultMessage]) => {
        return [id, { defaultMessage, description: id }];
      })
    );
  }
  if (sourceLocale) {
    files[`node_modules/${name}/i18n/manifest.json`] = { sourceLocale };
  }
  return files;
};

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'ttoss-i18n-test-'));
});

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
  process.exitCode = undefined;
});

describe('parseOptions', () => {
  test('defaults', () => {
    expect(parseOptions({ argv: { _: [] }, cwd })).toEqual({
      cwd,
      pattern: 'src/**/*.{ts,tsx}',
      ignore: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      sourceLocale: 'en',
      scopes: ['@ttoss'],
      ignoreDependencies: false,
      compile: true,
      explicitIds: [],
      locales: undefined,
    });
  });

  test('reads --no-compile, repeated and comma-separated lists', () => {
    expect(
      parseOptions({
        argv: {
          _: [],
          compile: false,
          scope: ['@ttoss', '@oneclickads'],
          locales: 'en,es',
          'explicit-ids': 'src/persisted/**',
          'source-locale': 'pt-BR',
          'ignore-ttoss-packages': true,
          ignore: '**/*.test.ts',
        },
        cwd,
      })
    ).toMatchObject({
      compile: false,
      scopes: ['@ttoss', '@oneclickads'],
      locales: ['en', 'es'],
      explicitIds: ['src/persisted/**'],
      sourceLocale: 'pt-BR',
      ignoreDependencies: true,
      ignore: ['**/*.test.ts'],
    });
  });
});

test('extracts with the canonical id pattern the build presets inject', () => {
  expect(ID_INTERPOLATION_PATTERN).toBe(I18N_ID_INTERPOLATION_PATTERN);
  expect(PRESERVE_WHITESPACE).toBe(formatjsBabelPlugin()[1].preserveWhitespace);
});

describe('multi-line messages', () => {
  const MULTI_LINE = 'First paragraph.\n\n  - an indented item\n  - another';

  /**
   * babel-jest compiles this file with `@ttoss/config`'s `babelConfig`, whose
   * formatjs plugin recognizes the call by its name and injects the id the
   * build would: the other side of the contract under test.
   */
  const defineMessages = <T>(messages: T) => {
    return messages;
  };

  const built = defineMessages({
    multiLine: {
      // eslint-disable-next-line formatjs/no-multiple-whitespaces -- the whitespace is what this test is about
      defaultMessage: 'First paragraph.\n\n  - an indented item\n  - another',
      description: 'multiLine',
    },
  }) as unknown as { multiLine: { id: string } };

  const sourceFile = `import { defineMessages } from '@ttoss/i18n-core';

export const messages = defineMessages({
  multiLine: {
    defaultMessage: ${JSON.stringify(MULTI_LINE)},
    description: 'multiLine',
  },
});
`;

  test('extraction keeps the whitespace, under the id the build injects', async () => {
    write(cwd, { 'src/messages.ts': sourceFile });

    const extracted = await extractTranslationsFromSource({
      cwd,
      pattern: 'src/**/*.ts',
      ignore: [],
    });

    expect(extracted).toEqual({
      [built.multiLine.id]: {
        defaultMessage: MULTI_LINE,
        description: 'multiLine',
      },
    });
  });

  test('compilation keeps the whitespace', async () => {
    write(cwd, {
      'package.json': { name: 'app' },
      'src/messages.ts': sourceFile,
      'i18n/lang/pt-BR.json': {
        [built.multiLine.id]: {
          defaultMessage: 'Primeiro parágrafo.\n\n  - um item\n  - outro',
        },
      },
    });

    await executeI18nCli([], cwd);

    expect(read('i18n/compiled/en.json')[built.multiLine.id]).toEqual([
      { type: 0, value: MULTI_LINE },
    ]);
    expect(read('i18n/compiled/pt-BR.json')[built.multiLine.id]).toEqual([
      { type: 0, value: 'Primeiro parágrafo.\n\n  - um item\n  - outro' },
    ]);
  });
});

describe('getI18nConfig', () => {
  test('names the source file after the source locale', () => {
    expect(getI18nConfig({ cwd, sourceLocale: 'pt-BR' }).extractFile).toBe(
      path.join(cwd, 'i18n/lang/pt-BR.json')
    );
    expect(getI18nConfig({ cwd }).extractFile).toBe(
      path.join(cwd, 'i18n/lang/en.json')
    );
  });
});

describe('ttoss-i18n (build)', () => {
  test('extracts, compiles and reports missing and unused translations', async () => {
    write(cwd, {
      'package.json': { name: 'app' },
      'src/messages.ts': source({
        hello: { text: 'Hello' },
        bye: { text: 'Bye' },
      }),
      'src/messages.test.ts': source({ ignored: { text: 'Ignored' } }),
    });

    await executeI18nCli([], cwd);

    const extracted = read('i18n/lang/en.json');
    const [helloId, byeId] = ['Hello', 'Bye'].map((text) => {
      return Object.keys(extracted).find((id) => {
        return extracted[id].defaultMessage === text;
      })!;
    });

    expect(Object.keys(extracted)).toHaveLength(2);

    write(cwd, {
      'i18n/lang/pt-BR.json': {
        [helloId]: { defaultMessage: 'Olá' },
        stale: { defaultMessage: 'Velho' },
      },
    });

    await executeI18nCli([], cwd);

    expect(read('i18n/compiled/pt-BR.json')[helloId]).toEqual([
      { type: 0, value: 'Olá' },
    ]);
    expect(Object.keys(read('i18n/missing/pt-BR.json'))).toEqual([byeId]);
    expect(read('i18n/unused/pt-BR.json')).toEqual({
      stale: { defaultMessage: 'Velho' },
    });
    expect(read('i18n/lang/pt-BR.json')).toEqual({
      [helloId]: { defaultMessage: 'Olá' },
    });
    expect(fs.existsSync(path.join(cwd, 'i18n/manifest.json'))).toBe(false);
  });

  test('--no-compile writes the source catalog only', async () => {
    write(cwd, {
      'package.json': { name: 'app' },
      'src/messages.ts': source({ hello: { text: 'Hello' } }),
    });

    await executeI18nCli(['--no-compile'], cwd);

    expect(Object.keys(read('i18n/lang/en.json'))).toHaveLength(1);
    expect(fs.existsSync(path.join(cwd, 'i18n/compiled'))).toBe(false);
  });

  test('--source-locale writes the source file under that locale and records it', async () => {
    write(cwd, {
      'package.json': { name: 'app' },
      'src/messages.ts': source({ hello: { text: 'Olá' } }),
    });

    await executeI18nCli(['--source-locale', 'pt-BR'], cwd);

    expect(Object.values(read('i18n/lang/pt-BR.json'))).toEqual([
      expect.objectContaining({ defaultMessage: 'Olá' }),
    ]);
    expect(read('i18n/manifest.json')).toEqual({ sourceLocale: 'pt-BR' });
    expect(fs.existsSync(path.join(cwd, 'i18n/lang/en.json'))).toBe(false);

    await executeI18nCli([], cwd);

    expect(fs.existsSync(path.join(cwd, 'i18n/manifest.json'))).toBe(false);
  });

  test('merges every locale a dependency ships, own entries winning', async () => {
    write(cwd, {
      'package.json': {
        name: 'app',
        dependencies: { '@ttoss/forms': '1', lodash: '1' },
      },
      'src/messages.ts': source({ hello: { id: 'app.hello', text: 'Olá' } }),
      ...dependency({
        name: '@ttoss/forms',
        langs: {
          en: { required: 'Required', optional: 'Optional' },
          'pt-BR': { required: 'Obrigatório' },
        },
      }),
      ...dependency({ name: 'lodash', langs: { en: { x: 'Not in scope' } } }),
      'i18n/lang/en.json': {},
      'i18n/lang/es.json': { required: { defaultMessage: 'Requerido' } },
      'i18n/lang/pt-BR.json': {},
    });

    await executeI18nCli(['--source-locale', 'pt-BR'], cwd);

    // The source catalog carries dependency text in the source locale where
    // the dependency ships it, and in its own language otherwise.
    expect(read('i18n/lang/pt-BR.json')).toEqual({
      'app.hello': { defaultMessage: 'Olá', description: 'hello' },
      required: {
        defaultMessage: 'Obrigatório',
        description: 'required',
        module: '@ttoss/forms',
      },
      optional: {
        defaultMessage: 'Optional',
        description: 'optional',
        module: '@ttoss/forms',
      },
    });

    // en comes from the dependency's source; es from the app's own file.
    expect(read('i18n/compiled/en.json')).toMatchObject({
      required: [{ type: 0, value: 'Required' }],
      optional: [{ type: 0, value: 'Optional' }],
    });
    expect(read('i18n/compiled/es.json')).toEqual({
      required: [{ type: 0, value: 'Requerido' }],
    });

    // Only what nobody translates is missing.
    expect(Object.keys(read('i18n/missing/en.json'))).toEqual(['app.hello']);
    expect(Object.keys(read('i18n/missing/es.json')).sort()).toEqual([
      'app.hello',
      'optional',
    ]);
  });

  test('--explicit-ids fails the build on a hashed id in a persisted file', async () => {
    write(cwd, {
      'package.json': { name: 'app' },
      'src/persisted/messages.ts': source({
        ok: { id: 'notifications.ok', text: 'Fine' },
        bad: { text: 'Hashed' },
      }),
    });

    await expect(
      executeI18nCli(['--explicit-ids', 'src/persisted/**'], cwd)
    ).rejects.toThrow(/must have an explicit id[\s\S]*"Hashed"/);
    expect(fs.existsSync(path.join(cwd, 'i18n'))).toBe(false);
  });

  test('a malformed dependency catalog fails loudly', async () => {
    write(cwd, {
      'package.json': { name: 'app', dependencies: { '@ttoss/ui': '1' } },
      'src/messages.ts': source({ hello: { text: 'Hello' } }),
      'node_modules/@ttoss/ui/package.json': { name: '@ttoss/ui' },
      'node_modules/@ttoss/ui/i18n/lang/en.json': '{ not json',
    });

    await expect(executeI18nCli([], cwd)).rejects.toThrow('@ttoss/ui catalog');
  });
});

describe('getDependencyCatalogs', () => {
  test('follows in-scope dependencies transitively, nearest first', () => {
    write(cwd, {
      'package.json': {
        name: 'runner',
        dependencies: { '@oneclickads/core': '1', '@ttoss/forms': '1' },
      },
      ...dependency({
        name: '@oneclickads/core',
        sourceLocale: 'pt-BR',
        langs: { 'pt-BR': { a: 'A' } },
        dependencies: { '@ttoss/ui': '1', '@ttoss/no-catalog': '1' },
      }),
      ...dependency({
        name: '@ttoss/forms',
        langs: { en: { f: 'F' } },
        dependencies: { '@ttoss/ui': '1' },
      }),
      ...dependency({ name: '@ttoss/ui', langs: { en: { u: 'U' } } }),
      'node_modules/@ttoss/no-catalog/package.json': {
        name: '@ttoss/no-catalog',
      },
    });

    expect(
      getDependencyCatalogs({ cwd, scopes: ['@ttoss', '@oneclickads'] }).map(
        ({ module, sourceLocale }) => {
          return `${module}:${sourceLocale}`;
        }
      )
    ).toEqual(['@oneclickads/core:pt-BR', '@ttoss/forms:en', '@ttoss/ui:en']);

    expect(
      getDependencyCatalogs({ cwd, scopes: ['@ttoss'] }).map(({ module }) => {
        return module;
      })
    ).toEqual(['@ttoss/forms', '@ttoss/ui']);
  });
  test('skips dependencies that are not installed or ship no source catalog', () => {
    write(cwd, {
      'package.json': {
        name: 'app',
        dependencies: {
          '@ttoss/missing': '1',
          '@ttoss/translations-only': '1',
          '@ttoss/ui': '1',
        },
      },
      ...dependency({
        name: '@ttoss/translations-only',
        langs: { 'pt-BR': { a: 'A' } },
      }),
      ...dependency({ name: '@ttoss/ui', langs: { en: { u: 'U' } } }),
      'node_modules/@ttoss/ui/i18n/lang/README.md': 'not a catalog',
    });

    expect(getDependencyCatalogs({ cwd, scopes: ['@ttoss'] })).toEqual([
      {
        module: '@ttoss/ui',
        sourceLocale: 'en',
        locales: {
          en: {
            u: { defaultMessage: 'U', description: 'u', module: '@ttoss/ui' },
          },
        },
      },
    ]);
  });
});

describe('extraction edge cases', () => {
  test('a package with no source files and no persisted files', async () => {
    write(cwd, { 'package.json': { name: 'empty' } });

    await executeI18nCli(['--explicit-ids', 'src/persisted/**'], cwd);

    expect(read('i18n/lang/en.json')).toEqual({});
  });
});

describe('findDuplicateIds', () => {
  test('reports an id declared with different text by two packages', () => {
    expect(
      findDuplicateIds([
        { module: '.', messages: { a: { defaultMessage: 'A' } } },
        {
          module: '@ttoss/forms',
          messages: {
            a: { defaultMessage: 'Other A' },
            b: { defaultMessage: 'B', module: '@ttoss/ui' },
          },
        },
        { module: '@ttoss/ui', messages: { b: { defaultMessage: 'B' } } },
        { module: '@ttoss/x', messages: { a: { defaultMessage: 'Third A' } } },
      ])
    ).toEqual([{ id: 'a', modules: ['.', '@ttoss/forms', '@ttoss/x'] }]);
  });
});

describe('ttoss-i18n check', () => {
  const log = { log: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    write(cwd, {
      'package.json': { name: 'app', dependencies: { '@ttoss/forms': '1' } },
      'src/messages.ts': source({ hello: { id: 'app.hello', text: 'Olá' } }),
      ...dependency({
        name: '@ttoss/forms',
        langs: {
          en: { required: 'Required' },
          'pt-BR': { required: 'Obrigatório' },
        },
      }),
    });
  });

  test('passes when every required locale is covered', async () => {
    write(cwd, {
      'i18n/lang/en.json': { 'app.hello': { defaultMessage: 'Hello' } },
    });

    const result = await runCheck(
      parseOptions({ argv: { _: ['check'], 'source-locale': 'pt-BR' }, cwd }),
      log
    );

    expect(result.ok).toBe(true);
    expect(log.log).toHaveBeenCalledWith(
      expect.stringContaining('no problems')
    );
  });

  test('fails on missing translations, duplicates and hashed persisted ids', async () => {
    write(cwd, {
      'src/persisted/messages.ts': source({
        required: { id: 'required', text: 'Campo obrigatório' },
        hashed: { text: 'Sem id' },
      }),
    });

    const result = await runCheck(
      parseOptions({
        argv: {
          _: ['check'],
          'source-locale': 'pt-BR',
          locales: 'en,es,pt-BR',
          'explicit-ids': 'src/persisted/**',
        },
        cwd,
      }),
      log
    );

    expect(result.ok).toBe(false);
    expect(Object.keys(result.missing)).toEqual(['en', 'es']);
    expect(result.missing.es).toEqual(
      expect.arrayContaining(['app.hello', 'required'])
    );
    expect(result.duplicates).toEqual([
      { id: 'required', modules: ['.', '@ttoss/forms'] },
    ]);
    expect(result.generatedIds).toEqual([
      expect.objectContaining({ defaultMessage: 'Sem id' }),
    ]);
    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining('missing a es translation')
    );
    expect(fs.existsSync(path.join(cwd, 'i18n'))).toBe(false);
  });

  test('sets a failing exit code from the CLI', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });

    await executeI18nCli(
      ['check', '--source-locale', 'pt-BR', '--locales', 'en'],
      cwd
    );

    expect(process.exitCode).toBe(1);
  });
});
