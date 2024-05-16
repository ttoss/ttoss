/**
 * Besides saving the deploy information in the `$STACK_NAME.json` file,
 * we also save in a "latest-deploy.json" file to be used by tests and other
 * packages that need to know the latest deploy information.
 */
export const LATEST_DEPLOY_OUTPUTS_FILENAME = 'latest-deploy.json';
