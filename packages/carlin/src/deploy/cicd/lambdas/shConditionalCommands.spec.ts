import { shConditionalCommands } from './shConditionalCommands';

test.each([
  {
    conditionalCommands: ['conditional command 1', 'conditional command 2'],
  },
  {
    conditionalCommands: ['conditional command 1', 'conditional command 2'],
    successCommands: ['success command 1', 'success command 2'],
  },
  {
    conditionalCommands: ['conditional command 1', 'conditional command 2'],
    successCommands: ['success command 1', 'success command 2'],
    failureCommands: ['failure command 1', 'failure command 2'],
  },
  {
    conditionalCommands: ['conditional command 1', 'conditional command 2'],
    successCommands: ['success command 1', 'success command 2'],
    failureCommands: ['failure command 1', 'failure command 2'],
    finallyCommands: ['finally command 1', 'finally command 2'],
  },
])('should compile commands %#', (commands) => {
  const compiledCommands = shConditionalCommands(commands);

  expect(compiledCommands).toMatchSnapshot();
});
