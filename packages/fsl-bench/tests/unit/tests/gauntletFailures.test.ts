/**
 * The gauntlet must fail at the RIGHT level with repair-loop-usable errors —
 * these are the negative calibrations of the pipeline.
 */
import { stop as stopEsbuild } from 'esbuild';

import { runGauntlet } from '../../../src/gauntlet/index.ts';
import { getLibrary } from '../../../src/libraries.ts';
import { getScenario } from '../../../src/scenarios/index.ts';

const scenario = getScenario('dialog');
const library = getLibrary('react-aria');

// esbuild keeps a service child process alive; stop it so the jest worker
// exits cleanly.
afterAll(async () => {
  await stopEsbuild();
});

describe('runGauntlet failure levels', () => {
  test('type errors fail at compile with file/line diagnostics', async () => {
    const result = await runGauntlet({
      code: `
        const App = () => {
          const n: number = 'not a number';
          return <button>{n}</button>;
        };
        export default App;
      `,
      scenario,
      library,
    });

    expect(result.passed).toBe(false);
    expect(result.failedLevel).toBe('compile');
    expect(result.errors.join('\n')).toContain('TS2322');
  });

  test('a missing component export fails at render', async () => {
    // A named `App` export is tolerated (the gauntlet measures UI ability,
    // not export pedantry) — but no component at all is a render failure.
    const result = await runGauntlet({
      code: `export const Widget = () => { return <p>hello</p>; };`,
      scenario,
      library,
    });

    expect(result.passed).toBe(false);
    expect(result.failedLevel).toBe('render');
    expect(result.errors.join('\n')).toContain('export default');
  });

  test('a crash during mount fails at render', async () => {
    const result = await runGauntlet({
      code: `
        const App = (): never => {
          throw new Error('boom at mount');
        };
        export default App;
      `,
      scenario,
      library,
    });

    expect(result.passed).toBe(false);
    expect(result.failedLevel).toBe('render');
    expect(result.errors.join('\n')).toContain('boom at mount');
  });

  test('wrong behavior fails at behavior with the failed check', async () => {
    const result = await runGauntlet({
      code: `
        const App = () => {
          return <button>Open settings</button>;
        };
        export default App;
      `,
      scenario,
      library,
    });

    expect(result.passed).toBe(false);
    expect(result.failedLevel).toBe('behavior');
    // The error is repair-loop-usable: it names what could not be found.
    expect(result.errors.join('\n')).toContain('role="dialog"');
  });

  test('lint findings are reported even when the sample fails early', async () => {
    const result = await runGauntlet({
      code: `
        const App = () => {
          const broken: number = 'x';
          return <div style={{ color: '#123456' }}>{broken}</div>;
        };
        export default App;
      `,
      scenario,
      library,
    });

    expect(result.failedLevel).toBe('compile');
    expect(result.lintFindings).toHaveLength(1);
    expect(result.lintFindings[0].rule).toBe('no-raw-colors');
  });
});
