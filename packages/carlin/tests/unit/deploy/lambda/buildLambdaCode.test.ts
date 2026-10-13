import fs from 'node:fs';

import { buildLambdaCode } from 'src/deploy/lambda/buildLambdaCode';

const lambdaOutdir = 'tests/dist/buildLambdaCode';

beforeAll(() => {
  if (fs.existsSync(lambdaOutdir)) {
    fs.rmSync(lambdaOutdir, { recursive: true });
  }
});

test('build lambda code properly as esm', () => {
  const lambdaEntryPoints = ['lambda.ts', 'module1/method1.ts'];

  const outDir = `${lambdaOutdir}/esm`;

  buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints,
    lambdaEntryPointsBaseDir: 'tests/fixtures/lambdaCodeExample',
    lambdaOutdir: outDir,
  });

  for (const entryPoint of lambdaEntryPoints) {
    const filePath = `${outDir}/${entryPoint}`.replace('.ts', '.mjs');
    expect(fs.existsSync(filePath)).toBe(true);
  }
});

test('build lambda code properly as cjs', () => {
  const lambdaEntryPoints = ['lambda.ts', 'module1/method1.ts'];

  const outDir = `${lambdaOutdir}/cjs`;

  buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints,
    lambdaEntryPointsBaseDir: 'tests/fixtures/lambdaCodeExample',
    lambdaFormat: 'cjs',
    lambdaOutdir: outDir,
  });

  for (const entryPoint of lambdaEntryPoints) {
    const filePath = `${outDir}/${entryPoint}`.replace('.ts', '.cjs');
    expect(fs.existsSync(filePath)).toBe(true);
  }
});

test('writes a linked source map without sources when lambdaSourceMaps is true', () => {
  const outDir = `${lambdaOutdir}/sourcemap`;

  buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints: ['lambda.ts'],
    lambdaEntryPointsBaseDir: 'tests/fixtures/lambdaCodeExample',
    lambdaFormat: 'cjs',
    lambdaOutdir: outDir,
    lambdaSourceMaps: true,
  });

  const code = fs.readFileSync(`${outDir}/lambda.cjs`, 'utf8');
  expect(code).toContain('//# sourceMappingURL=lambda.cjs.map');
  const map = JSON.parse(fs.readFileSync(`${outDir}/lambda.cjs.map`, 'utf8'));
  expect(map.sources.length).toBeGreaterThan(0);
  expect(map.sourcesContent).toBeUndefined();
});

test('writes no source map by default', () => {
  const outDir = `${lambdaOutdir}/nosourcemap`;

  buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints: ['lambda.ts'],
    lambdaEntryPointsBaseDir: 'tests/fixtures/lambdaCodeExample',
    lambdaFormat: 'cjs',
    lambdaOutdir: outDir,
  });

  expect(fs.existsSync(`${outDir}/lambda.cjs.map`)).toBe(false);
});
