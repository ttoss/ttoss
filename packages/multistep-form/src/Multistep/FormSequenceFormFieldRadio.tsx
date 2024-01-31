import { Button, Flex, Label, Radio } from '@ttoss/ui';
import { FormField } from '@ttoss/forms';
import { MultistepFormFieldsBase } from './types';

export type MultistepFormFieldRadioProps = MultistepFormFieldsBase & {
  variant: 'radio';
  defaultValue?: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
};

export const MultistepFormFieldRadio = ({
  options,
  defaultValue,
  fieldName,
}: MultistepFormFieldRadioProps) => {
  return (
    <FormField
      name={fieldName}
      defaultValue={defaultValue}
      render={({ field }) => {
        return (
          <Flex
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              rowGap: 'xl',
              '& > button:nth-child(2n)': {
                marginLeft: 'auto',
              },
            }}
          >
            {options.map((option) => {
              const id = `${fieldName}-option-${option.value}`;

              return (
                <Button
                  key={id}
                  variant="secondary"
                  disabled={option.disabled}
                  onClick={() => {
                    field.onChange(option.value);
                  }}
                >
                  <Label aria-disabled={option.disabled} htmlFor={id}>
                    <Radio
                      id={id}
                      value={option.value}
                      aria-disabled={option.disabled}
                      sx={{
                        '& > input[aria-disabled="true"]': {
                          color: 'blue',
                        },
                      }}
                      name={fieldName}
                      defaultChecked={option.value === defaultValue}
                      checked={field.value === option.value}
                    />
                    {option.label}
                  </Label>
                </Button>
              );
            })}
          </Flex>
        );
      }}
    />
  );
};
