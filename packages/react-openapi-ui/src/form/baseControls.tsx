import type { FormField } from '../core/form';
import type { FormValue } from '../core/formValues';
import { Input } from '../ui/Input';

/**
 * Props a custom field renderer receives (see `OpenApiFormField.render`).
 */
export type FieldRenderProps = {
  id: string;
  field: FormField;
  value: FormValue;
  onChange: (value: FormValue) => void;
  invalid: boolean;
};

const INPUT_TYPES: Partial<Record<FormField['kind'], string>> = {
  email: 'email',
  url: 'url',
  password: 'password',
  date: 'date',
  datetime: 'datetime-local',
  integer: 'number',
  number: 'number',
};

export type ControlProps = FieldRenderProps & { describedBy?: string };

export const commonProps = ({
  id,
  field,
  invalid,
  describedBy,
}: ControlProps) => {
  return {
    id,
    name: field.name,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
    'aria-required': field.required || undefined,
  };
};

export const asText = (value: FormValue): string => {
  return typeof value === 'string' ? value : '';
};

export const InputControl = (props: ControlProps) => {
  const { field } = props;
  const { example } = field.schema;
  return (
    <Input
      {...commonProps(props)}
      type={INPUT_TYPES[field.kind] ?? 'text'}
      step={field.kind === 'number' ? 'any' : undefined}
      min={field.schema.minimum}
      max={field.schema.maximum}
      autoComplete={field.kind === 'password' ? 'new-password' : undefined}
      placeholder={example === undefined ? undefined : String(example)}
      value={asText(props.value)}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    />
  );
};
