import { FieldName, FieldValues, useFormContext } from 'react-hook-form';
import { ErrorMessage as HookFormErrorMessage } from '@hookform/error-message';
import { Text } from '@ttoss/ui';

export const ErrorMessage = <TFieldValues extends FieldValues = FieldValues>({
  name,
}: {
  name: FieldName<TFieldValues>;
}) => {
  const {
    formState: { errors },
  } = useFormContext<TFieldValues>();

  return (
    <HookFormErrorMessage
      errors={errors}
      name={name as any}
      as={
        <Text
          variant="text.error"
          role="alert"
          sx={{ fontFamily: 'caption', fontSize: 'xs' }}
        />
      }
    />
  );
};
