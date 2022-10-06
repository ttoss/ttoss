import * as pipelinesModule from './pipelines';

test('pipelines', () => {
  expect(pipelinesModule.pipelines).toMatchObject(
    expect.arrayContaining(['pr', 'main', 'tag'])
  );
});

test('set +x', () => {
  const branch = 'some-branch';

  const tag = 'some-tag';

  expect(pipelinesModule.getPrCommands({ branch })).toMatchObject(
    expect.arrayContaining([
      'set -e',
      `git checkout ${branch} || (echo 'branch not found, probably deleted'; exit 0)`,
      'yarn install --frozen-lockfile',
      `sh -e ${pipelinesModule.getCommandFileDir('pr')}`,
    ])
  );

  expect(pipelinesModule.getMainCommands()).toMatchObject(
    expect.arrayContaining([
      'set -e',
      'yarn install --frozen-lockfile',
      `sh -e ${pipelinesModule.getCommandFileDir('main')}`,
    ])
  );

  expect(pipelinesModule.getTagCommands({ tag })).toMatchObject(
    expect.arrayContaining([
      'set -e',
      'yarn install --frozen-lockfile',
      `sh -e ${pipelinesModule.getCommandFileDir('tag')}`,
    ])
  );

  expect(pipelinesModule.getClosedPrCommands({ branch })).not.toMatchObject(
    expect.arrayContaining(['set -e'])
  );

  expect(pipelinesModule.getClosedPrCommands({ branch })).toMatchObject(
    expect.arrayContaining([
      `[ ! -f "./.cicd/commands/closed-pr.sh" ] && echo 'closed-pr command not found' || sh ./.cicd/commands/closed-pr.sh`,
    ])
  );
});
