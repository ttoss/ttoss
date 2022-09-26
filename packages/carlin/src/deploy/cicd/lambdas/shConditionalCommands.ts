import type { Status } from './ecsTaskReport.handler';

export const compileCommands = (commands: string[]) => {
  return commands.map((c) => c.replace(/;$/, '')).join(' && ');
};

const approvedStatus: Status = 'Approved';

const rejectedStatus: Status = 'Rejected';

const defaultSuccessCommands = [
  `carlin cicd-ecs-task-report --status=${approvedStatus}`,
];

const defaultFailureCommands = [
  `carlin cicd-ecs-task-report --status=${rejectedStatus}`,
];

const defaultFinallyCommands = ['echo "Finally Command"'];

export const shConditionalCommands = ({
  conditionalCommands,
  successCommands = defaultSuccessCommands,
  failureCommands = defaultFailureCommands,
  finallyCommands = defaultFinallyCommands,
}: {
  conditionalCommands: string[];
  successCommands?: string[];
  failureCommands?: string[];
  finallyCommands?: string[];
}) => {
  const conditionalCommand = compileCommands(conditionalCommands);

  const successCommand = compileCommands([
    'echo "Success Command"',
    ...successCommands,
  ]);

  const failureCommand = compileCommands([
    'echo "Failure Command"',
    ...failureCommands,
  ]);

  const finallyCommand = compileCommands(finallyCommands);

  return `if ${conditionalCommand}; then ${successCommand}; else ${failureCommand}; fi; ${finallyCommand}`;
};
