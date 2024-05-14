import { type CloudFormationTemplate } from '../../utils';

export const getLambdaEntryPointsFromTemplate = (
  template: CloudFormationTemplate
) => {
  /**
   * If no lambdaEntryPoints are defined, use the Handler property from the
   * CloudFormation template.
   */
  const lambdaResources = Object.keys(template.Resources).filter((key) => {
    return ['AWS::Lambda::Function', 'AWS::Serverless::Function'].includes(
      template.Resources[key].Type
    );
  });

  const handlers = lambdaResources.map((key) => {
    return template.Resources[key].Properties.Handler;
  });

  const handlersPaths = handlers.map((handler) => {
    return handler.split('.')[0] + '.ts';
  });

  return handlersPaths;
};
