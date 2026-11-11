import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import type { FormField } from '../core/form';
import type { FieldError, FormValue } from '../core/formValues';
import { humanizeKey } from '../core/table';
import { cn } from '../ui/cn';
import {
  Checkbox,
  controlClassName,
  Label,
  Select,
  Textarea,
} from '../ui/fields';
import { Input } from '../ui/Input';
import { messages } from './messages';

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

type MessageKey = keyof typeof messages;

const ERROR_MESSAGES: Record<FieldError['code'], MessageKey> = {
  required: 'errorRequired',
  invalidNumber: 'errorInvalidNumber',
  notInteger: 'errorNotInteger',
  minimum: 'errorMinimum',
  maximum: 'errorMaximum',
  minLength: 'errorMinLength',
  maxLength: 'errorMaxLength',
  pattern: 'errorPattern',
  invalidJson: 'errorInvalidJson',
  jsonType: 'errorJsonType',
};

/**
 * Turns a validation error into its message. A string (an error the server
 * returned) is shown as is.
 */
export const useFieldErrorMessage = () => {
  const { intl } = useI18n();
  return (error: FieldError | string): string => {
    if (typeof error === 'string') {
      return error;
    }
    const { code, ...values } = error;
    return intl.formatMessage(messages[ERROR_MESSAGES[code]], values);
  };
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

type ControlProps = FieldRenderProps & { describedBy?: string };

const commonProps = ({ id, field, invalid, describedBy }: ControlProps) => {
  return {
    id,
    name: field.name,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
    'aria-required': field.required || undefined,
  };
};

const asText = (value: FormValue): string => {
  return typeof value === 'string' ? value : '';
};

const BooleanControl = (props: ControlProps) => {
  return (
    <Checkbox
      {...commonProps(props)}
      checked={props.value === true}
      onChange={(event) => {
        props.onChange(event.target.checked);
      }}
    />
  );
};

const EnumControl = (props: ControlProps) => {
  const { intl } = useI18n();
  return (
    <Select
      {...commonProps(props)}
      value={asText(props.value)}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    >
      <option value="" disabled={props.field.required}>
        {intl.formatMessage(messages.selectPlaceholder)}
      </option>
      {(props.field.schema.enum ?? []).map((option) => {
        return (
          <option key={String(option)} value={String(option)}>
            {humanizeKey(String(option))}
          </option>
        );
      })}
    </Select>
  );
};

const MultiEnumControl = ({
  id,
  field,
  value,
  onChange,
  describedBy,
}: ControlProps) => {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      className="oa:flex oa:flex-wrap oa:gap-x-4 oa:gap-y-2"
    >
      {(field.schema.items?.enum ?? []).map((option) => {
        const optionValue = String(option);
        const optionId = `${id}-${optionValue}`;
        return (
          <div key={optionValue} className="oa:flex oa:items-center oa:gap-2">
            <Checkbox
              id={optionId}
              checked={selected.includes(optionValue)}
              onChange={(event) => {
                onChange(
                  event.target.checked
                    ? [...selected, optionValue]
                    : selected.filter((v) => {
                        return v !== optionValue;
                      })
                );
              }}
            />
            <Label htmlFor={optionId} className="oa:font-normal">
              {humanizeKey(optionValue)}
            </Label>
          </div>
        );
      })}
    </div>
  );
};

const TextareaControl = (props: ControlProps) => {
  const isJson = props.field.kind === 'json';
  const jsonPlaceholder = props.field.schema.type === 'array' ? '[]' : '{}';
  return (
    <Textarea
      {...commonProps(props)}
      rows={isJson ? 6 : 4}
      spellCheck={!isJson}
      className={isJson ? 'oa:font-mono oa:text-xs' : undefined}
      value={asText(props.value)}
      placeholder={isJson ? jsonPlaceholder : undefined}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    />
  );
};

const FileControl = (props: ControlProps) => {
  return (
    <input
      {...commonProps(props)}
      type="file"
      className={cn(
        controlClassName,
        'oa:h-9 oa:py-1.5 oa:file:mr-3 oa:file:border-0 oa:file:bg-transparent oa:file:text-sm oa:file:font-medium oa:file:text-foreground'
      )}
      onChange={(event) => {
        props.onChange(event.target.files?.[0] ?? null);
      }}
    />
  );
};

const InputControl = (props: ControlProps) => {
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

const CONTROLS: Partial<
  Record<FormField['kind'], (props: ControlProps) => React.ReactElement>
> = {
  boolean: BooleanControl,
  enum: EnumControl,
  multiEnum: MultiEnumControl,
  textarea: TextareaControl,
  json: TextareaControl,
  file: FileControl,
};

/**
 * The default control for a field, chosen by its kind.
 */
export const FieldControl = (props: ControlProps): React.ReactElement => {
  const Control = CONTROLS[props.field.kind] ?? InputControl;
  return <Control {...props} />;
};

const REQUIRED_MARK = '*';

const FieldLabel = ({ id, field }: { id: string; field: FormField }) => {
  const { intl } = useI18n();
  const requiredText = ` (${intl.formatMessage(messages.required)})`;
  return (
    <Label
      id={`${id}-label`}
      htmlFor={field.kind === 'multiEnum' ? undefined : id}
    >
      {field.label}
      {field.required && (
        <>
          <span className="oa:ml-0.5 oa:text-destructive" aria-hidden="true">
            {REQUIRED_MARK}
          </span>
          <span className="oa:sr-only">{requiredText}</span>
        </>
      )}
    </Label>
  );
};

const joinIds = (...ids: (string | undefined)[]): string | undefined => {
  return ids.filter(Boolean).join(' ') || undefined;
};

/**
 * Label, description, control and error message for one field.
 */
export const FieldRow = ({
  id,
  field,
  value,
  onChange,
  error,
  render,
}: {
  id: string;
  field: FormField;
  value: FormValue;
  onChange: (value: FormValue) => void;
  error?: FieldError | string;
  render?: (props: FieldRenderProps) => React.ReactNode;
}) => {
  const errorMessage = useFieldErrorMessage();
  const descriptionId = field.description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const props: FieldRenderProps = {
    id,
    field,
    value,
    onChange,
    invalid: !!error,
  };
  const control = render ? (
    render(props)
  ) : (
    <FieldControl {...props} describedBy={joinIds(descriptionId, errorId)} />
  );
  const label = <FieldLabel id={id} field={field} />;

  return (
    <div className="oa:flex oa:flex-col oa:gap-2">
      {field.kind === 'boolean' && !render ? (
        <div className="oa:flex oa:items-center oa:gap-2">
          {control}
          {label}
        </div>
      ) : (
        <>
          {label}
          {control}
        </>
      )}
      {field.description && (
        <p
          id={descriptionId}
          className="oa:m-0 oa:text-xs oa:text-muted-foreground"
        >
          {field.description}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="oa:m-0 oa:text-xs oa:font-medium oa:text-destructive"
        >
          {errorMessage(error)}
        </p>
      )}
    </div>
  );
};
