import { FieldName, FieldValues, useFormContext } from 'react-hook-form';
import { FormattedMessage, MessageDescriptor } from '@ttoss/react-i18n';
import { HelpText } from '@ttoss/ui';

type ModifiedDescriptor = MessageDescriptor & { values?: any };

const isMessageDescriptor = (
  possibleMessageDescriptor: unknown
): possibleMessageDescriptor is ModifiedDescriptor => {
  return (
    possibleMessageDescriptor !== undefined &&
    (possibleMessageDescriptor as ModifiedDescriptor).defaultMessage !==
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

  const error = errors[name];

  if (!error) return null;

  const { message } = error;

  return (
    error && (
      <HelpText negative disabled={disabled}>
        {isMessageDescriptor(message) ? (
          <FormattedMessage {...message} />
        ) : (
          (message as string)
        )}
      </HelpText>
    )
  );
};
