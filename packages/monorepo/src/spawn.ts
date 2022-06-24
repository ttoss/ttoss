import { spawn as childProcessSpawn } from 'child_process';

export const spawn = (command: string, args: string[] = []) => {
  return childProcessSpawn(command, args, {
    stdio: 'inherit',
  });
};
