import { Box, BoxProps, Label, LabelProps, Radio, RadioProps } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import { FieldValues, Path, useController } from 'react-hook-form';

type FormRadioOption = {
  value: string | number;
  label: string;
};

export const FormFieldRadio = <TFieldValues extends FieldValues = FieldValues>({
  label,
  name,
  options,
  containerProps,
  containerOptionsProps,
  labelProps,
  radioLabelProps,
  radioProps,
}: {
  label?: string;
  name: Path<TFieldValues>;
  options: FormRadioOption[];
  containerProps?: BoxProps;
  containerOptionsProps?: BoxProps;
  labelProps?: LabelProps;
  radioLabelProps?: LabelProps;
  radioProps?: RadioProps;
}) => {
  const {
    field: { onChange, onBlur, value, ref },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  return (
    <Box {...containerProps}>
      {label && <Label {...labelProps}>{label}</Label>}
      <Box {...containerOptionsProps}>
        {options.map((option) => {
          const id = `form-field-radio-${name}-${option.value}`;

          return (
            <Label {...radioLabelProps} key={id} htmlFor={id}>
              <Radio
                {...radioProps}
                ref={ref}
                onChange={onChange}
                onBlur={onBlur}
                value={option.value}
                defaultChecked={value === option.value}
                name={name}
                id={id}
              />
              {option.label}
            </Label>
          );
        })}
      </Box>

      <ErrorMessage name={name} />
    </Box>
  );
};
