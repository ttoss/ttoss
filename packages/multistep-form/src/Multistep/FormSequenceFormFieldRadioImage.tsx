import { Flex, Grid, Image, Label, Radio, Text } from '@ttoss/ui';
import { FormField } from '@ttoss/forms';
import { MultistepFormFieldsBase } from './types';

export type MultistepFormFieldRadioImageProps = MultistepFormFieldsBase & {
  variant: 'radio-image';
  defaultValue?: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
    src: string;
  }[];
};

export const MultistepFormFieldRadioImage = ({
  options,
  defaultValue,
  fieldName,
}: MultistepFormFieldRadioImageProps) => {
  return (
    <FormField
      name={fieldName}
      defaultValue={defaultValue}
      render={({ field }) => {
        return (
          <Grid
            sx={{
              gridTemplateColumns: '1fr 1fr 1fr',
              columnGap: 'xs',
              rowGap: 'lg',
            }}
          >
            {options.map((option) => {
              const id = `${fieldName}-option-${option.value}`;
              const checked = field.value === option.value;

              return (
                <Label
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: checked ? 'default' : 'none',
                    borderColor: 'accent',
                    borderRadius: '9px',
                    overflow: 'hidden',
                    padding: 'sm',
                    gap: 'md',
                    boxShadow: checked
                      ? '1px 1px 2px 0px rgba(4, 105, 227, 0.24), -1px -1px 2px 0px rgba(4, 105, 227, 0.24)'
                      : '',
                    transitionDuration: '0.3s',
                    ':hover': {
                      boxShadow:
                        '1px 1px 2px 0px rgba(4, 105, 227, 0.24), -1px -1px 2px 0px rgba(4, 105, 227, 0.24)',
                    },
                  }}
                  key={id}
                  htmlFor={id}
                >
                  <Image
                    src={option.src}
                    alt={`Option image ${option.label}`}
                    draggable={false}
                    sx={{ borderRadius: 'default' }}
                  />

                  <Flex sx={{ alignSelf: 'start' }}>
                    <Radio
                      id={id}
                      name={fieldName}
                      value={field.value}
                      onChange={() => {
                        return field.onChange(option.value);
                      }}
                      defaultChecked={defaultValue === option.value}
                      checked={checked}
                    />
                    <Text>{option.label}</Text>
                  </Flex>
                </Label>
              );
            })}
          </Grid>
        );
      }}
    />
  );
};
