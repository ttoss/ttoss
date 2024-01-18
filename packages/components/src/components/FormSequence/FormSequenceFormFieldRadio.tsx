import { Flex, Label, Radio } from '@ttoss/ui';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldRadioProps = FormSequenceFormFieldsBase & {
  type: 'radio';
  defaultValue?: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
};

export const FormSequenceFormFieldRadio = ({
  options,
  defaultValue,
  fieldName,
}: FormSequenceFormFieldRadioProps) => {
  return (
    <Flex
      sx={{
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: 'xl',
        marginTop: 'lg',
      }}
    >
      {options.map((option) => {
        return (
          <Label key={option.value}>
            <Radio
              defaultChecked={!!defaultValue && defaultValue === option.value}
              disabled={option.disabled}
              value={option.value}
              name={fieldName}
            />
            {option.label}
          </Label>
        );
      })}
    </Flex>
  );
};
