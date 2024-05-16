import { buildLambdaCode } from '../../../src/deploy/lambda/buildLambdaCode';
import fs from 'node:fs';

const lambdaOutdir = 'tests/dist/buildLambdaCode';

beforeAll(() => {
  if (fs.existsSync(lambdaOutdir)) {
    fs.rmSync(lambdaOutdir, { recursive: true });
  }
});

test('build lambda code properly', () => {
  const lambdaEntryPoints = ['lambda.ts', 'module1/method1.ts'];

  buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints,
    lambdaEntryPointsBaseDir: 'tests/__fixtures__/lambdaCodeExample',
    lambdaOutdir,
  });

  for (const entryPoint of lambdaEntryPoints) {
    const filePath = `${lambdaOutdir}/${entryPoint}`.replace('.ts', '.js');
    expect(fs.existsSync(filePath)).toBe(true);
  }
});
