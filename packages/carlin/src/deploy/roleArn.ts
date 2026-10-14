import { getEnvVar, setEnvVar } from '../utils';

/**
 * Used by the CLI to set the CloudFormation service role from `--role-arn`.
 * A falsy value clears it.
 */
export const setRoleArn = (roleArn?: string) => {
  setEnvVar('ROLE_ARN', roleArn);
};

/**
 * The CloudFormation service role set by `--role-arn`, as the `RoleARN` key
 * of a CreateStack, UpdateStack, or DeleteStack request. Without the option
 * the key is left out, so the request is the same as before the option
 * existed and CloudFormation falls back to the role the stack remembers, if
 * any, or to the caller's credentials.
 */
export const getRoleArnParam = (): { RoleARN?: string } => {
  const roleArn = getEnvVar('ROLE_ARN');
  return roleArn ? { RoleARN: roleArn } : {};
};
