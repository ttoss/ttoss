import { lintSample } from '../../../src/gauntlet/lint.ts';

const rulesOf = (findings: { rule: string }[]) => {
  return findings.map((finding) => {
    return finding.rule;
  });
};

describe('lintSample — fsl profile', () => {
  test('flags style/className on fsl-ui components', () => {
    const code = `
      import { Button, Dialog } from '@ttoss/fsl-ui';
      const App = () => (
        <>
          <Button className="x">Save</Button>
          <Dialog style={{ width: 100 }}>content</Dialog>
        </>
      );
      export default App;
    `;

    const findings = lintSample({ code, profile: 'fsl' });
    expect(rulesOf(findings)).toEqual([
      'fsl/no-style-classname',
      'fsl/no-style-classname',
    ]);
    expect(findings[0].line).toBeGreaterThan(0);
  });

  test('does not flag style on non-fsl elements', () => {
    const code = `
      import { Button } from '@ttoss/fsl-ui';
      const App = () => (
        <div style={{ display: 'flex' }}>
          <Button>Save</Button>
        </div>
      );
      export default App;
    `;

    expect(lintSample({ code, profile: 'fsl' })).toEqual([]);
  });

  test('flags the invented size prop', () => {
    const code = `
      import { Button } from '@ttoss/fsl-ui';
      const App = () => <Button size="lg">Save</Button>;
      export default App;
    `;

    expect(rulesOf(lintSample({ code, profile: 'fsl' }))).toEqual([
      'fsl/no-size-prop',
    ]);
  });

  test('flags evaluation on data-entry surfaces (the canonical confusion)', () => {
    const code = `
      import { TextField } from '@ttoss/fsl-ui';
      const App = () => <TextField evaluation="negative" />;
      export default App;
    `;

    const findings = lintSample({ code, profile: 'fsl' });
    expect(rulesOf(findings)).toEqual(['fsl/no-negative-validation']);
    expect(findings[0].message).toContain('isInvalid');
  });

  test('flags raw color literals with no token-definition exception', () => {
    const code = `
      const theme = { primary: '#ff0000' };
      const App = () => <div style={{ color: 'rgb(0, 0, 0)' }} />;
      export default App;
    `;

    // fsl profile: colors come from fsl-theme tokens — no exception, both
    // literals are findings.
    expect(rulesOf(lintSample({ code, profile: 'fsl' }))).toEqual([
      'no-raw-colors',
      'no-raw-colors',
    ]);
  });
});

describe('lintSample — generic profile', () => {
  test('allows color literals inside token-definition constants', () => {
    const code = `
      const themeTokens = { '--color-primary': '#2563eb' };
      const App = () => <div style={{ color: 'var(--color-primary)' }} />;
      export default App;
    `;

    expect(lintSample({ code, profile: 'generic' })).toEqual([]);
  });

  test('allows color literals inside createTheme calls', () => {
    const code = `
      import { createTheme } from '@mui/material';
      const theme = createTheme({ palette: { primary: { main: '#2563eb' } } });
      export default theme;
    `;

    expect(lintSample({ code, profile: 'generic' })).toEqual([]);
  });

  test('flags colors hardcoded at the point of use', () => {
    const code = `
      const App = () => <button style={{ background: '#2563eb' }}>Go</button>;
      export default App;
    `;

    expect(rulesOf(lintSample({ code, profile: 'generic' }))).toEqual([
      'no-raw-colors',
    ]);
  });

  test('never applies the fsl prop rules', () => {
    const code = `
      import { Button } from '@ttoss/fsl-ui';
      const App = () => <Button className="x" size="lg">Save</Button>;
      export default App;
    `;

    expect(lintSample({ code, profile: 'generic' })).toEqual([]);
  });
});
