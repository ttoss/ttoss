import { build } from 'esbuild';

import { findPackageRoot } from '../libraries.ts';

/**
 * Bundles a sample TSX file to a requireable CJS artifact.
 *
 * Everything except React itself is bundled (fsl-ui ships TS source via its
 * `exports` map, so it must go through esbuild); react/react-dom stay
 * external so the sample shares the harness's React instance.
 */
export interface BundleResult {
  ok: boolean;
  errors: string[];
}

export const bundleSample = async ({
  entry,
  outfile,
}: {
  entry: string;
  outfile: string;
}): Promise<BundleResult> => {
  try {
    await build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      format: 'cjs',
      platform: 'browser',
      target: 'es2022',
      jsx: 'automatic',
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/client',
      ],
      define: { 'process.env.NODE_ENV': '"test"' },
      absWorkingDir: findPackageRoot(),
      logLevel: 'silent',
      sourcemap: false,
    });

    return { ok: true, errors: [] };
  } catch (error) {
    const messages =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.errors?.map((e: { text: string }) => {
        return e.text;
      }) ?? [String(error)];

    return { ok: false, errors: messages };
  }
};
