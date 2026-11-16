import { useI18n } from '@ttoss/react-i18n';

import type { FormField } from '../core/form';
import {
  type ApiResource,
  findResourceByRef,
  getRefName,
  toRefOption,
} from '../core/resources';
import { extractItems } from '../core/table';
import {
  useResources,
  useResourcesContext,
} from '../resources/ResourcesContext';
import { Checkbox, Label, Select, Textarea } from '../ui/fields';
import { useOperationQuery } from '../useOperationQuery';
import {
  asText,
  commonProps,
  type ControlProps,
  InputControl,
} from './baseControls';
import { messages } from './messages';

/** How many records a reference picker loads, when its list op pages. */
const REF_OPTIONS_LIMIT = 100;

/**
 * The picker options: the loaded records, plus the current values beyond
 * them (saved ids outside the loaded page stay selectable).
 */
const refOptions = ({
  target,
  data,
  current,
}: {
  target?: ApiResource;
  data: unknown;
  current: string[];
}): { value: string; label: string }[] => {
  const options = extractItems(data).flatMap((record) => {
    const option = target && toRefOption({ resource: target, record });
    return option ? [option] : [];
  });
  const unknown = current
    .filter((value) => {
      return (
        value &&
        !options.some((option) => {
          return option.value === value;
        })
      );
    })
    .map((value) => {
      return { value, label: value };
    });
  return [...unknown, ...options];
};

/**
 * The records an `x-ref` field can point to, loaded from the referenced
 * resource's list operation. `usable` is false when the spec has no such
 * list or it fails to load; the field then falls back to text.
 */
const useRefOptions = ({
  schema,
  current,
}: {
  schema: FormField['schema'];
  current: string[];
}) => {
  const resources = useResources();
  const context = useResourcesContext();
  const target = findResourceByRef({
    resources,
    ref: getRefName(schema) ?? '',
  });
  const list = target?.list;
  const query = useOperationQuery({
    operationId: list ? list.operation.operationId : '',
    params: { ...context?.params, limit: REF_OPTIONS_LIMIT },
    enabled: !!list,
  });
  return {
    options: refOptions({ target, data: query.data, current }),
    loading: query.loading,
    usable: !!list && !query.error,
  };
};

export const RefControl = (props: ControlProps) => {
  const { intl } = useI18n();
  const current = asText(props.value);
  const { options, loading, usable } = useRefOptions({
    schema: props.field.schema,
    current: [current],
  });
  if (!usable) {
    return <InputControl {...props} />;
  }
  return (
    <Select
      {...commonProps(props)}
      value={current}
      disabled={loading}
      onChange={(event) => {
        props.onChange(event.target.value);
      }}
    >
      <option value="" disabled={props.field.required}>
        {intl.formatMessage(
          loading ? messages.refLoading : messages.selectPlaceholder
        )}
      </option>
      {options.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </Select>
  );
};

/** One id per line, for an array of ids whose resource has no list. */
const IdLinesControl = (props: ControlProps) => {
  const lines = Array.isArray(props.value) ? props.value.join('\n') : '';
  return (
    <Textarea
      {...commonProps(props)}
      rows={3}
      className="oa:font-mono oa:text-xs"
      value={lines}
      onChange={(event) => {
        props.onChange(
          event.target.value.split('\n').map((line) => {
            return line.trim();
          })
        );
      }}
    />
  );
};

/**
 * Checkboxes of the records an array-of-ids field (`x-ref` on the array or
 * its items) can point to.
 */
export const RefListControl = (props: ControlProps) => {
  const { intl } = useI18n();
  const { id, value, onChange, describedBy } = props;
  const selected = (Array.isArray(value) ? value : []).filter(Boolean);
  const { options, loading, usable } = useRefOptions({
    schema: props.field.schema,
    current: selected,
  });
  if (!usable) {
    return <IdLinesControl {...props} />;
  }
  if (loading || options.length === 0) {
    return (
      <p className="oa:m-0 oa:text-sm oa:text-muted-foreground">
        {intl.formatMessage(loading ? messages.refLoading : messages.refEmpty)}
      </p>
    );
  }
  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      className="oa:flex oa:max-h-48 oa:flex-col oa:gap-2 oa:overflow-y-auto oa:rounded-md oa:border oa:border-input oa:p-3"
    >
      {options.map((option) => {
        const optionId = `${id}-${option.value}`;
        return (
          <div key={option.value} className="oa:flex oa:items-center oa:gap-2">
            <Checkbox
              id={optionId}
              checked={selected.includes(option.value)}
              onChange={(event) => {
                onChange(
                  event.target.checked
                    ? [...selected, option.value]
                    : selected.filter((v) => {
                        return v !== option.value;
                      })
                );
              }}
            />
            <Label htmlFor={optionId} className="oa:font-normal">
              {option.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
};
