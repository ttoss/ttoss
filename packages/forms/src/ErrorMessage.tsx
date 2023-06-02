import {
  FieldError,
  FieldErrors,
  FieldName,
  FieldValues,
  useFormContext,
} from 'react-hook-form';
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

  const error = name
    .split('.')
    .reduce<FieldErrors<FieldValues> | FieldError | string | undefined>(
      (rest, n) => {
        if (!rest) return undefined;
        return rest[n as keyof typeof rest];
      },
      errors
    );

  if (!error || typeof error === 'string') return null;

  const { message } = error;

  return (
    error && (
      <HelpText negative disabled={disabled}>
        {isMessageDescriptor(message) && !(typeof message === 'string') ? (
          <FormattedMessage {...message} />
        ) : (
          (message as string)
        )}
      </HelpText>
    )
  );
};
