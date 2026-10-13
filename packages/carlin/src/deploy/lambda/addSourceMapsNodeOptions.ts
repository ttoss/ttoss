import { type CloudFormationTemplate } from '@ttoss/cloudformation';

const FLAG = '--enable-source-maps';

/**
 * Sets `NODE_OPTIONS=--enable-source-maps` on every Lambda function, the flag
 * that makes Node read the source map `buildLambdaCode` ships. A string
 * `NODE_OPTIONS` already set keeps its flags; one set with an intrinsic
 * function is left alone, since it cannot be read before deploy.
 */
export const addSourceMapsNodeOptions = (template: CloudFormationTemplate) => {
  for (const resource of Object.values(template.Resources)) {
    if (
      !['AWS::Lambda::Function', 'AWS::Serverless::Function'].includes(
        resource.Type
      )
    ) {
      continue;
    }

    resource.Properties = resource.Properties ?? {};
    resource.Properties.Environment = resource.Properties.Environment ?? {};
    const variables = resource.Properties.Environment.Variables ?? {};
    resource.Properties.Environment.Variables = variables;

    const current = variables.NODE_OPTIONS;

    if (current === undefined) {
      variables.NODE_OPTIONS = FLAG;
    } else if (typeof current === 'string' && !current.includes(FLAG)) {
      variables.NODE_OPTIONS = `${current} ${FLAG}`.trim();
    }
  }
};
