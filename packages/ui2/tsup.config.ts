import { tsupConfig } from '@ttoss/config';

export const tsup = {
  ...tsupConfig(),
  entryPoints: ['src/index.ts', 'src/model.ts'],
  format: ['esm'],
  external: ['react', 'react-dom', '@ark-ui/react', '@ttoss/theme2'],
  onSuccess: 'cp src/styles.css dist/styles.css',
};
