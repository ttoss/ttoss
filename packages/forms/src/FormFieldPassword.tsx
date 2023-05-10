import { FieldPath, FieldValues } from 'react-hook-form';

import { FormFieldInput, type FormFieldInputProps } from './FormFieldInput';
import { useHidePassInput } from './useHidePassInput';

type FormFieldPasswordProps<TName> = Omit<
  FormFieldInputProps<TName>,
  'type' | 'trailingIcon' | 'onTrailingIconClick'
> & {
  showPasswordByDefault?: boolean;
};

export const FormFieldPassword = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  showPasswordByDefault,
  ...passwordProps
}: FormFieldPasswordProps<TName>) => {
  const { handleClick, icon, inputType } = useHidePassInput(
    !showPasswordByDefault
  );

  return (
    <FormFieldInput
      {...passwordProps}
      trailingIcon={icon}
      onTrailingIconClick={handleClick}
      type={inputType}
    />
  );
};
