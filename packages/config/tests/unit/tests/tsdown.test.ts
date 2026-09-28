import { formatjsPlugin } from 'src/tsdown';

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
