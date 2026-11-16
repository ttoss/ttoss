import { defaultConfig, formatjsPlugin } from 'src/tsdown';

type RenderChunk = (
  code: string,
  chunk: { fileName: string }
) => Promise<{ code: string } | null>;

const renderChunk = formatjsPlugin.renderChunk as unknown as RenderChunk;

test('fails the build when the bundler renamed defineMessages', async () => {
  await expect(
    renderChunk(
      `import { defineMessages } from '@ttoss/react-i18n';
import { defineMessages as defineMessages$1 } from 'react-intl';
export const a = defineMessages({ a: { defaultMessage: 'A', description: 'd' } });
export const b = defineMessages$1({ b: { defaultMessage: 'B', description: 'd' } });`,
      { fileName: 'index.mjs' }
    )
  ).rejects.toThrow('index.mjs calls a renamed defineMessages');
});

test('leaves non-JavaScript chunks alone', async () => {
  await expect(
    renderChunk('defineMessages$1({})', { fileName: 'index.d.mts' })
  ).resolves.toBeNull();
});

const CHUNK = `/** banner */
import { defineMessages } from '@ttoss/react-i18n';
export const messages = defineMessages({
  title: { defaultMessage: 'Title', description: 'Page title' },
});
export const Title = () => React.createElement('h1', null, 'x');
`;

type PluginRenderChunk = (
  code: string,
  chunk: { fileName: string }
) => Promise<{ code: string; map?: unknown } | string | null>;

test.each(
  defaultConfig.plugins.map((plugin) => {
    return [plugin.name, plugin] as const;
  })
)('%s returns a source map with the code it changes', async (_name, plugin) => {
  const hook = plugin.renderChunk as unknown as PluginRenderChunk;
  const result = await hook(CHUNK, { fileName: 'index.js' });

  expect(result).toEqual({
    code: expect.not.stringMatching(/^$/),
    map: expect.objectContaining({ mappings: expect.any(String) }),
  });
});

test('formatjs leaves a chunk with no descriptor call alone', async () => {
  await expect(
    renderChunk('export const a = 1;\n', { fileName: 'index.mjs' })
  ).resolves.toBeNull();
});
