import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import { extractRecord, findSiblingOperation } from '../core/detail';
import {
  type FormField,
  getFormFields,
  getRequestBody,
  type RequestBody,
} from '../core/form';
import {
  buildRequestBody,
  type FieldError,
  type FormValues,
  initFormValues,
  toFormData,
} from '../core/formValues';
import { findOperation } from '../core/operations';
import type {
  JsonObject,
  OpenApiSpec,
  OperationParams,
  ResolvedOperation,
} from '../core/types';
import { firstError, missingOperationError } from '../errors';
import { useOpenApi } from '../OpenApiProvider';
import { Button } from '../ui/Button';
import { Alert } from '../ui/fields';
import { Skeleton } from '../ui/Table';
import { useOperationMutation } from '../useOperationMutation';
import { useOperationQuery } from '../useOperationQuery';
import { type FieldRenderProps, FieldRow } from './FieldInput';
import { messages } from './messages';
import { extractServerFieldErrors } from './serverErrors';

/**
 * A field of `OpenApiForm`. Give only `name` to keep the schema-driven label
 * and control; add `label`, `description` or `render` to take over any of them.
 */
export type OpenApiFormField = {
  /** Property of the request body. */
  name: string;
  /** Label. Defaults to the schema `title`, else the humanized name. */
  label?: string;
  /** Help text under the label. Defaults to the schema `description`. */
  description?: string;
  /** Custom control. Receives the value, a change handler and validity. */
  render?: (props: FieldRenderProps) => React.ReactNode;
};

export type OpenApiFormProps = {
  /** `operationId` of the operation to submit (POST, PUT or PATCH). */
  operationId: string;
  /**
   * Path and query params for the request, as one flat object (e.g. the id
   * of the record being edited).
   */
  params?: OperationParams;
  /** Fields to show, in order. Omit to show every writable field of the body. */
  fields?: (string | OpenApiFormField)[];
  /**
   * The record being edited. Omit it on a PUT/PATCH and the form loads it
   * from the GET operation on the same path.
   */
  record?: JsonObject;
  /** Values that override the record and the schema defaults. */
  defaultValues?: JsonObject;
  /** Called with the response body after a successful submit. */
  onSuccess?: (data: unknown) => void;
  /** Shows a cancel button that calls this. */
  onCancel?: () => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
  /** Clears the form after a successful submit (useful for repeated creates). */
  resetOnSuccess?: boolean;
};

const FormSkeleton = () => {
  return (
    <div className="oa:flex oa:flex-col oa:gap-5" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => {
        return (
          <div key={i} className="oa:flex oa:flex-col oa:gap-2">
            <Skeleton className="oa:h-4 oa:w-24" />
            <Skeleton className="oa:h-9 oa:w-full" />
          </div>
        );
      })}
    </div>
  );
};

const FormBody = ({
  operation,
  requestBody,
  fields,
  renderers,
  record,
  params,
  onSuccess,
  onCancel,
  submitLabel,
  resetOnSuccess,
}: {
  operation: ResolvedOperation;
  requestBody?: RequestBody;
  fields: FormField[];
  renderers: Record<string, OpenApiFormField['render']>;
  record?: JsonObject;
  params?: OperationParams;
  onSuccess?: (data: unknown) => void;
  onCancel?: () => void;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) => {
  const { intl } = useI18n();
  const idPrefix = React.useId();
  const mutation = useOperationMutation({
    operationId: operation.operation.operationId,
  });
  const [initial] = React.useState<FormValues>(() => {
    return initFormValues({ fields, record });
  });
  const [values, setValues] = React.useState<FormValues>(initial);
  const [errors, setErrors] = React.useState<
    Record<string, FieldError | string>
  >({});
  const [status, setStatus] = React.useState<'idle' | 'invalid' | 'success'>(
    'idle'
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = buildRequestBody({
      fields,
      values,
      initial,
      patch: operation.method === 'patch',
    });
    if (!result.ok) {
      setErrors(result.errors);
      setStatus('invalid');
      return;
    }
    setErrors({});
    setStatus('idle');
    const body = !requestBody
      ? undefined
      : requestBody.contentType === 'multipart'
        ? toFormData(result.body)
        : result.body;
    mutation
      .mutate({ params, body })
      .then((data) => {
        setStatus('success');
        if (resetOnSuccess) {
          setValues(initial);
        }
        onSuccess?.(data);
      })
      .catch((error: unknown) => {
        setErrors(extractServerFieldErrors(error));
      });
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="oa:flex oa:flex-col oa:gap-5 oa:text-sm oa:text-foreground"
    >
      {fields.length === 0 && (
        <p className="oa:m-0 oa:text-muted-foreground">
          {intl.formatMessage(messages.noFields)}
        </p>
      )}
      {fields.map((field) => {
        return (
          <FieldRow
            key={field.name}
            id={`${idPrefix}-${field.name}`}
            field={field}
            value={values[field.name] ?? null}
            error={errors[field.name]}
            render={renderers[field.name]}
            onChange={(value) => {
              setValues((current) => {
                return { ...current, [field.name]: value };
              });
              setStatus('idle');
              if (errors[field.name]) {
                setErrors((current) => {
                  const { [field.name]: _removed, ...rest } = current;
                  return rest;
                });
              }
            }}
          />
        );
      })}
      {status === 'invalid' && (
        <Alert title={intl.formatMessage(messages.invalidForm)} />
      )}
      {mutation.error && (
        <Alert title={intl.formatMessage(messages.submitError)}>
          {mutation.error.message}
        </Alert>
      )}
      {status === 'success' && !mutation.error && (
        <Alert tone="success" title={intl.formatMessage(messages.success)} />
      )}
      <div className="oa:flex oa:items-center oa:gap-2">
        <Button type="submit" disabled={mutation.pending}>
          {mutation.pending
            ? intl.formatMessage(messages.submitting)
            : (submitLabel ?? intl.formatMessage(messages.submit))}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {intl.formatMessage(messages.cancel)}
          </Button>
        )}
      </div>
    </form>
  );
};

const normalizeFieldDefs = (
  fields: OpenApiFormProps['fields']
): OpenApiFormField[] => {
  return (fields ?? []).map((f) => {
    return typeof f === 'string' ? { name: f } : f;
  });
};

/** The body's fields, chosen and relabelled by the caller's definitions. */
const resolveFields = ({
  requestBody,
  fieldDefs,
}: {
  requestBody?: RequestBody;
  fieldDefs: OpenApiFormField[];
}): FormField[] => {
  if (!requestBody) {
    return [];
  }
  const names =
    fieldDefs.length > 0
      ? fieldDefs.map((f) => {
          return f.name;
        })
      : undefined;
  return getFormFields({ schema: requestBody.schema, names }).map((field) => {
    const def = fieldDefs.find((f) => {
      return f.name === field.name;
    });
    return {
      ...field,
      label: def?.label ?? field.label,
      description: def?.description ?? field.description,
    };
  });
};

/** The GET that loads the record an update (PUT/PATCH) edits. */
const findRecordOperation = ({
  spec,
  operation,
}: {
  spec: OpenApiSpec;
  operation: ResolvedOperation;
}): ResolvedOperation | undefined => {
  const isUpdate = operation.method === 'put' || operation.method === 'patch';
  return isUpdate
    ? findSiblingOperation({ spec, operation, method: 'get' })
    : undefined;
};

/**
 * The operation a form submits, its request body and, for an update without
 * a `record`, the record loaded from the GET on the same path.
 */
const useFormTarget = ({
  operationId,
  params,
  recordProp,
}: {
  operationId: string;
  params?: OperationParams;
  recordProp?: JsonObject;
}) => {
  const { spec, loading: specLoading, error: specError } = useOpenApi();

  const operation = React.useMemo(() => {
    return spec ? findOperation({ spec, operationId }) : undefined;
  }, [spec, operationId]);

  const requestBody = React.useMemo(() => {
    return spec && operation ? getRequestBody({ operation, spec }) : undefined;
  }, [spec, operation]);

  const recordOperation =
    spec && operation && !recordProp
      ? findRecordOperation({ spec, operation })
      : undefined;

  const recordQuery = useOperationQuery({
    operationId: recordOperation?.operation.operationId ?? '',
    params,
    enabled: !!recordOperation,
  });

  return {
    operation,
    requestBody,
    record: extractRecord(recordQuery.data),
    loading: specLoading || recordQuery.loading,
    error: firstError([
      specError,
      missingOperationError({ spec, operation, operationId }),
      recordQuery.error,
    ]),
  };
};

/**
 * A form generated from an OpenAPI operation's request body: one control per
 * writable field (text, number, select, checkbox, date, file, JSON…), with
 * labels, help text and validation from the schema. Editing operations
 * (PUT/PATCH) load the current record from the GET on the same path, and a
 * PATCH sends only the changed fields. Must be rendered inside an
 * `OpenApiProvider`.
 */
export const OpenApiForm = ({
  operationId,
  params,
  fields: fieldsProp,
  record: recordProp,
  defaultValues,
  onSuccess,
  onCancel,
  submitLabel,
  resetOnSuccess = false,
}: OpenApiFormProps) => {
  const { intl } = useI18n();
  const target = useFormTarget({ operationId, params, recordProp });
  const fieldDefs = normalizeFieldDefs(fieldsProp);

  if (target.loading) {
    return <FormSkeleton />;
  }

  if (target.error || !target.operation) {
    return (
      <Alert title={intl.formatMessage(messages.loadError)}>
        {target.error?.message}
      </Alert>
    );
  }

  const record = { ...(recordProp ?? target.record), ...defaultValues };

  return (
    <FormBody
      // Remount when the loaded record changes so the inputs restart from it.
      key={JSON.stringify(record)}
      operation={target.operation}
      requestBody={target.requestBody}
      fields={resolveFields({ requestBody: target.requestBody, fieldDefs })}
      renderers={Object.fromEntries(
        fieldDefs.map((def) => {
          return [def.name, def.render];
        })
      )}
      record={record}
      params={params}
      onSuccess={onSuccess}
      onCancel={onCancel}
      submitLabel={submitLabel}
      resetOnSuccess={resetOnSuccess}
    />
  );
};
