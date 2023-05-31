import { FieldName, FieldValues, useFormContext } from 'react-hook-form';
import { HelpText } from '@ttoss/ui';
import { ErrorMessage as HookFormErrorMessage } from '@hookform/error-message';
import { MessageDescriptor, useI18n } from '@ttoss/react-i18n';

const isMessageDescriptor = (
  possibleMessageDescriptor: unknown
): possibleMessageDescriptor is MessageDescriptor => {
  return (
    possibleMessageDescriptor !== undefined &&
    (possibleMessageDescriptor as MessageDescriptor).defaultMessage !==
      undefined
  );
};

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

  if (!error) return null;

  const { message } = error;

  const i18nMessage = isMessageDescriptor(message)
    ? formatMessage(message)
    : error;

  const singleErrorMessage: any = {};
  singleErrorMessage[name] = i18nMessage;

  return (
    <HookFormErrorMessage
      name={name as any}
      errors={singleErrorMessage}
      message={i18nMessage as string}
      as={<HelpText negative disabled={disabled} />}
    />
  );
};
