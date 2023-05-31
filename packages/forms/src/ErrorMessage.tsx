import { FieldName, FieldValues, useFormContext } from 'react-hook-form';
import { HelpText } from '@ttoss/ui';
import { ErrorMessage as HookFormErrorMessage } from '@hookform/error-message';
import { messages } from './i18n';
import { useI18n } from '@ttoss/react-i18n';

export const ErrorMessage = <TFieldValues extends FieldValues = FieldValues>({
  name,
  disabled,
}: {
  name: FieldName<TFieldValues>;
  disabled?: boolean;
}) => {
  const {
    formState: { errors },
  } = useFormContext<TFieldValues>();
  const {
    intl: { formatMessage },
  } = useI18n();
  const error = errors[name];

  const formattedMessage = messages[error?.message as keyof typeof messages]
    ? formatMessage(messages[error?.message as keyof typeof messages])
    : error?.message;

  return <>{error && <div>{JSON.stringify(formattedMessage)}</div>}</>;
};
