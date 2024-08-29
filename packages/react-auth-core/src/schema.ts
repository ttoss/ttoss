import { PASSWORD_MINIMUM_LENGTH } from './config';
import { yup } from '@ttoss/forms';
import type { IntlShape } from '@ttoss/react-i18n';

export const password = ({
  intl,
  passwordMinimumLength = PASSWORD_MINIMUM_LENGTH,
}: {
  intl: IntlShape;
  passwordMinimumLength?: number;
}) => {
  return yup
    .string()
    .required(
      intl.formatMessage({
        description: 'Password is required.',
        defaultMessage: 'Password field is required',
      })
    )
    .min(
      passwordMinimumLength,
      intl.formatMessage(
        {
          description: 'Password must be at least {value} characters long.',
          defaultMessage: 'Password requires {value} characters',
        },
        { value: passwordMinimumLength }
      )
    )
    .trim();
};
