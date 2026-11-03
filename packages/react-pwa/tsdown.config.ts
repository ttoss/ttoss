import { tsdownConfig } from '@ttoss/config';

export default [
  tsdownConfig({ format: ['esm'] }),
  /**
   * The service worker ships as one classic script that apps copy to their
   * public folder, so it is bundled as an IIFE with no imports left.
   */
  tsdownConfig(
    {
      entry: { sw: 'src/serviceWorker/sw.ts' },
      format: ['iife'],
      platform: 'browser',
      dts: false,
      clean: false,
      outputOptions: { entryFileNames: '[name].js' },
    },
    { arrayMerge: 'overwrite' }
  ),
];
