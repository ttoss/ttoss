import { tsdownConfig } from '@ttoss/config';

/**
 * Replace `let ClassName = class ClassName` with `var ClassName = class ClassName`
 * in CJS output to avoid temporal dead zone errors in circular decorator references.
 * tsdown/rolldown uses `let` for class declarations, which causes TDZ when circular
 * decorator metadata (emitDecoratorMetadata) references a class before it is declared.
 */
const cjsLetToVar = {
  name: 'cjs-let-to-var',
  renderChunk: (code: string, chunk: { fileName: string }) => {
    if (!chunk.fileName.endsWith('.cjs')) {
      return null;
    }
    return {
      code: code.replace(/\blet (\w+) = class \1\b/g, 'var $1 = class $1'),
    };
  },
};

export default tsdownConfig({
  entry: ['src/index.ts'],
  plugins: [cjsLetToVar],
});
