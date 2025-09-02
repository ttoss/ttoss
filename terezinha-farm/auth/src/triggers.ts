import type { PostConfirmationTriggerHandler } from 'aws-lambda';

/**
 * @param event https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html
 */
export const postConfirmation: PostConfirmationTriggerHandler = async (
  event
) => {
  const email = event.request.userAttributes.email;

  // do something with the email
  // eslint-disable-next-line no-console
  console.log(email);

  return event;
};
