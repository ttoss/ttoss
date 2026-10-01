import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { interpolateName, transform } from '@formatjs/ts-transformer';
import {
  babelConfig,
  formatjsBabelPlugin,
  formatjsSwcPlugin,
  I18N_ID_INTERPOLATION_PATTERN,
} from 'src/index';
import { formatjsPlugin as tsdownFormatjsPlugin } from 'src/tsdown';
import { defaultConfig as tsupDefaultConfig } from 'src/tsup';
import ts from 'typescript';

type CompiledMessage = {
  id: string;
  defaultMessage: Array<{ value?: string }>;
};

const OPTIONS = {
  idInterpolationPattern: I18N_ID_INTERPOLATION_PATTERN,
  ast: true,
  preserveWhitespace: true,
};

const MULTI_LINE = 'First paragraph.\n\n  - an indented item\n  - another';

const DESCRIPTION = 'Multi-line copy';

/**
 * Compiled by babel-jest with `babelConfig` (`tests/unit/babel.config.cjs`),
 * which recognizes the call by its name — the Jest compile path under test.
 */
const defineMessages = <T>(messages: T) => {
  return messages;
};

const jestCompiled = defineMessages({
  multiLine: {
    // eslint-disable-next-line formatjs/no-multiple-whitespaces -- the whitespace is what this test is about
    defaultMessage: 'First paragraph.\n\n  - an indented item\n  - another',
    description: 'Multi-line copy',
  },
}) as unknown as { multiLine: CompiledMessage };

const CJS_SOURCE = `const { defineMessages } = require('@ttoss/react-i18n');
module.exports = defineMessages({
  multiLine: {
    defaultMessage: ${JSON.stringify(MULTI_LINE)},
    description: ${JSON.stringify(DESCRIPTION)},
  },
});
`;

/**
 * The id `ttoss-i18n` extraction (`@formatjs/cli-lib`) computes for a message:
 * the pattern interpolated over `defaultMessage#description`.
 */
const extractedId = interpolateName(
  { resourcePath: 'messages.ts' },
  I18N_ID_INTERPOLATION_PATTERN,
  { content: `${MULTI_LINE}#${DESCRIPTION}` }
);

/**
 * With `ast: true` a compiled `defaultMessage` is the parsed message, so the
 * text it keeps is the concatenation of its literal parts.
 */
const literalText = (ast: CompiledMessage['defaultMessage']) => {
  return ast
    .map(({ value }) => {
      return value;
    })
    .join('');
};

const evaluate = (code: string) => {
  const module = { exports: {} as { multiLine?: CompiledMessage } };
  new Function('module', 'require', code)(module, () => {
    return {
      defineMessages: (messages: unknown) => {
        return messages;
      },
    };
  });
  return module.exports.multiLine!;
};

test('the presets carry the canonical id pattern and keep whitespace', () => {
  expect(I18N_ID_INTERPOLATION_PATTERN).toBe('[sha512:contenthash:base64:6]');
  expect(formatjsBabelPlugin()).toEqual(['formatjs', OPTIONS]);
  expect(formatjsSwcPlugin()).toEqual(['@swc/plugin-formatjs', OPTIONS]);
});

test('babel.config.cjs, which cannot import them, uses the same options', () => {
  const plugins = babelConfig().overrides.flatMap(
    (override: { plugins: unknown[] }) => {
      return override.plugins;
    }
  );

  expect(plugins).toContainEqual(formatjsBabelPlugin());
});

test('babelConfig (Jest) keeps line breaks and indentation, under the id extraction computes', () => {
  expect(literalText(jestCompiled.multiLine.defaultMessage)).toBe(MULTI_LINE);
  expect(jestCompiled.multiLine.id).toBe(extractedId);
});

test('the tsdown plugin keeps whitespace, under the id extraction computes', async () => {
  const renderChunk = tsdownFormatjsPlugin.renderChunk as unknown as (
    code: string,
    chunk: { fileName: string }
  ) => Promise<{ code: string }>;

  const { code } = await renderChunk(CJS_SOURCE, { fileName: 'index.cjs' });
  const multiLine = evaluate(code);

  expect(literalText(multiLine.defaultMessage)).toBe(MULTI_LINE);
  expect(multiLine.id).toBe(extractedId);
});

test('the tsup plugin keeps whitespace, under the id extraction computes', async () => {
  let onEnd: (result: unknown) => Promise<void> = async () => {};
  tsupDefaultConfig.esbuildPlugins[0].setup({
    onEnd: (callback: typeof onEnd) => {
      onEnd = callback;
    },
  });

  const outputFile = {
    path: 'index.cjs',
    text: CJS_SOURCE,
    contents: Buffer.from(CJS_SOURCE),
  };

  // The tsup plugin also loads the project's Babel config, and this package's
  // own one pulls an ESM-only plugin Jest cannot import: run from elsewhere.
  const cwd = process.cwd();
  process.chdir(os.tmpdir());
  try {
    await onEnd({ outputFiles: [outputFile] });
  } finally {
    process.chdir(cwd);
  }
  const multiLine = evaluate(outputFile.contents.toString());

  expect(literalText(multiLine.defaultMessage)).toBe(MULTI_LINE);
  expect(multiLine.id).toBe(extractedId);
});

test('the tsconfig ts-transformer plugin keeps whitespace too', () => {
  const tsconfig = ts.parseConfigFileTextToJson(
    'tsconfig.json',
    fs.readFileSync(path.join(__dirname, '../../../tsconfig.json'), 'utf8')
  ).config;
  // ts-patch hands the whole entry to the transformer, `transform` included.
  const pluginOptions = tsconfig.compilerOptions.plugins[0];

  expect(pluginOptions).toMatchObject({
    overrideIdFn: I18N_ID_INTERPOLATION_PATTERN,
    ast: true,
    preserveWhitespace: true,
  });

  const messages: Array<{ id?: string; defaultMessage?: string }> = [];
  ts.transpileModule(CJS_SOURCE, {
    fileName: 'messages.ts',
    transformers: {
      before: [
        transform({
          ...pluginOptions,
          onMsgExtracted: (_file, extracted) => {
            messages.push(...extracted);
          },
        }),
      ],
    },
  });

  expect(messages).toEqual([
    expect.objectContaining({ id: extractedId, defaultMessage: MULTI_LINE }),
  ]);
});
