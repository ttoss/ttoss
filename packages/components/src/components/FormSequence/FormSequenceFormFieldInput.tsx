import { Flex, Input, Label } from '@ttoss/ui';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldInputProps = FormSequenceFormFieldsBase & {
  type: 'input';
  label: string;
  defaultValue?: string;
};

export const FormSequenceFormFieldInput = ({
  defaultValue,
  label,
  fieldName,
}: FormSequenceFormFieldInputProps) => {
  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Label>{label}</Label>

      <Input
        sx={{ width: '100%' }}
        defaultValue={defaultValue}
        name={fieldName}
      />
    </Flex>
  );
};
