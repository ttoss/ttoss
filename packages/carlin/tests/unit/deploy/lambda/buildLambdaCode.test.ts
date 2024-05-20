import { buildLambdaCode } from 'src/deploy/lambda/buildLambdaCode';
import fs from 'node:fs';

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
