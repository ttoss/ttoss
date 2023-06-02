import {
  FieldError,
  FieldErrors,
  FieldName,
  FieldValues,
  useFormContext,
} from 'react-hook-form';
import { FormattedMessage, MessageDescriptor } from '@ttoss/react-i18n';
import { HelpText } from '@ttoss/ui';
import { ErrorMessage as HookformErrorMessage } from '@hookform/error-message';

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

  return (
    <HookformErrorMessage
      name={name as any}
      errors={errors}
      render={({ message }: { message: FieldError | string }) => {
        return (
          <HelpText negative disabled={disabled}>
            {(() => {
              if (typeof message === 'string') return message;

              if (isMessageDescriptor(message))
                return <FormattedMessage {...message} />;

              return JSON.stringify(message);
            })()}
          </HelpText>
        );
      }}
    />
  );
};
