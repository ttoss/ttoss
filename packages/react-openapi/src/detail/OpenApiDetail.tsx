import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import {
  type DetailField,
  extractRecord,
  getDetailFields,
  getRecordSchema,
  recordLabel,
} from '../core/detail';
import { getCellKind } from '../core/table';
import type {
  JsonObject,
  JsonValue,
  OpenApiSchema,
  OperationParams,
} from '../core/types';
import { useOpenApi } from '../OpenApiProvider';
import { CellValue, EmptyValue } from '../table/CellValue';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { Alert } from '../ui/fields';
import { Skeleton } from '../ui/Table';
import { useOperationQuery } from '../useOperationQuery';
import { messages } from './messages';

/**
 * A field of `OpenApiDetail`. Give only `key` to keep the schema-driven label
 * and formatting; add `label` or `render` to take over either.
 */
export type OpenApiDetailField = {
  /** Property of the record. */
  key: string;
  /** Label. Defaults to the schema `title`, else the humanized key. */
  label?: string;
  /** Custom value content. */
  render?: (args: {
    value: JsonValue | undefined;
    record: JsonObject;
  }) => React.ReactNode;
};

export type OpenApiDetailProps = {
  /** `operationId` of the GET operation that returns one record. */
  operationId: string;
  /** Path and query params, e.g. the id of the record. */
  params?: OperationParams;
  /** Fields to show, in order. Omit to show every field of the record. */
  fields?: (string | OpenApiDetailField)[];
  /**
   * Heading. Defaults to the record's name, title, label, email or id. Pass
   * a function to build it from the record, or `null` to hide it.
   */
  title?: React.ReactNode | ((record: JsonObject) => React.ReactNode);
  /**
   * Content next to the heading, e.g. edit and delete buttons. A function
   * receives the record and a `refetch` to reload it after a change.
   */
  actions?:
    | React.ReactNode
    | ((args: { record: JsonObject; refetch: () => void }) => React.ReactNode);
  /** Hides fields whose value is empty. Defaults to false. */
  hideEmpty?: boolean;
};

/** Stands in for a hidden secret; not a word, so it needs no translation. */
const MASK = '••••••••';

const isEmpty = (value: JsonValue | undefined) => {
  return value === undefined || value === null || value === '';
};

const SensitiveValue = ({
  field,
  value,
}: {
  field: DetailField;
  value: JsonValue | undefined;
}) => {
  const { intl } = useI18n();
  const [revealed, setRevealed] = React.useState(false);
  if (isEmpty(value)) {
    return <EmptyValue />;
  }
  return (
    <span className="oa:inline-flex oa:items-center oa:gap-2">
      <span className="oa:font-mono oa:text-xs">
        {revealed ? String(value) : MASK}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="oa:h-6 oa:px-2"
        aria-label={
          revealed
            ? undefined
            : intl.formatMessage(messages.revealLabel, { field: field.label })
        }
        onClick={() => {
          setRevealed((r) => {
            return !r;
          });
        }}
      >
        {intl.formatMessage(revealed ? messages.conceal : messages.reveal)}
      </Button>
    </span>
  );
};

const isWide = ({
  field,
  value,
}: {
  field: DetailField;
  value: JsonValue | undefined;
}) => {
  if (typeof value === 'string') {
    return value.length > 120;
  }
  return (
    getCellKind({ key: field.key, value, schema: field.schema }) === 'json'
  );
};

const DetailSkeleton = () => {
  return (
    <div className="oa:flex oa:flex-col oa:gap-6" aria-busy="true">
      <Skeleton className="oa:h-7 oa:w-56" />
      <div className="oa:grid oa:gap-6 oa:sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => {
          return (
            <div key={i} className="oa:flex oa:flex-col oa:gap-2">
              <Skeleton className="oa:h-3 oa:w-20" />
              <Skeleton className="oa:h-4 oa:w-40" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

type ShownField = { field: DetailField; def?: OpenApiDetailField };

/** The fields to show, chosen and relabelled by the caller's definitions. */
const resolveFields = ({
  schema,
  record,
  fields,
  hideEmpty,
}: {
  schema?: OpenApiSchema;
  record: JsonObject;
  fields?: (string | OpenApiDetailField)[];
  hideEmpty: boolean;
}): ShownField[] => {
  const defs = fields?.map((f) => {
    return typeof f === 'string' ? { key: f } : f;
  });
  const keys = defs?.map((d) => {
    return d.key;
  });
  return getDetailFields({ schema, record, keys })
    .map((field) => {
      const def = defs?.find((d) => {
        return d.key === field.key;
      });
      return { field: { ...field, label: def?.label ?? field.label }, def };
    })
    .filter(({ field }) => {
      return !hideEmpty || !isEmpty(record[field.key]);
    });
};

const FieldValue = ({
  shown: { field, def },
  record,
}: {
  shown: ShownField;
  record: JsonObject;
}) => {
  const value = record[field.key];
  if (def?.render) {
    return <>{def.render({ value, record })}</>;
  }
  if (field.sensitive) {
    return <SensitiveValue field={field} value={value} />;
  }
  return (
    <CellValue columnKey={field.key} value={value} schema={field.schema} full />
  );
};

const DetailHeader = ({
  heading,
  actions,
}: {
  heading: React.ReactNode;
  actions: React.ReactNode;
}) => {
  if (!heading && !actions) {
    return null;
  }
  return (
    <div className="oa:flex oa:flex-wrap oa:items-start oa:justify-between oa:gap-4">
      {heading ? (
        <h2 className="oa:m-0 oa:min-w-0 oa:truncate oa:text-xl oa:font-semibold">
          {heading}
        </h2>
      ) : (
        <span />
      )}
      {actions && (
        <div className="oa:flex oa:items-center oa:gap-2">{actions}</div>
      )}
    </div>
  );
};

const LoadError = ({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) => {
  const { intl } = useI18n();
  return (
    <div className="oa:flex oa:flex-col oa:items-start oa:gap-3">
      <Alert title={intl.formatMessage(messages.loadError)}>
        {error.message}
      </Alert>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {intl.formatMessage(messages.retry)}
      </Button>
    </div>
  );
};

const NotFound = () => {
  const { intl } = useI18n();
  return (
    <p className="oa:m-0 oa:text-sm oa:text-muted-foreground">
      {intl.formatMessage(messages.notFound)}
    </p>
  );
};

const resolveHeading = ({
  title,
  record,
}: {
  title: OpenApiDetailProps['title'];
  record: JsonObject;
}): React.ReactNode => {
  if (title === null) {
    return null;
  }
  if (typeof title === 'function') {
    return title(record);
  }
  return title ?? recordLabel(record);
};

/**
 * A read-only view of one record, loaded from an OpenAPI GET operation. Each
 * field is labelled and formatted from the response schema; long text and
 * objects take the full width, and sensitive fields are masked behind a
 * "Show" toggle. Must be rendered inside an `OpenApiProvider`.
 */
export const OpenApiDetail = ({
  operationId,
  params,
  fields,
  title,
  actions,
  hideEmpty = false,
}: OpenApiDetailProps) => {
  const { spec } = useOpenApi();
  const query = useOperationQuery({ operationId, params });
  const record = extractRecord(query.data);

  const schema = React.useMemo(() => {
    return spec && query.operation
      ? getRecordSchema({ operation: query.operation, spec })
      : undefined;
  }, [spec, query.operation]);

  if (query.loading) {
    return <DetailSkeleton />;
  }
  if (query.error) {
    return <LoadError error={query.error} onRetry={query.refetch} />;
  }
  if (!record) {
    return <NotFound />;
  }

  return (
    <div
      className={cn(
        'oa:flex oa:flex-col oa:gap-6 oa:text-sm oa:text-foreground oa:transition-opacity',
        query.fetching && 'oa:opacity-60'
      )}
      aria-busy={query.fetching}
    >
      <DetailHeader
        heading={resolveHeading({ title, record })}
        actions={
          typeof actions === 'function'
            ? actions({ record, refetch: query.refetch })
            : actions
        }
      />
      <dl className="oa:m-0 oa:grid oa:gap-x-8 oa:gap-y-5 oa:rounded-lg oa:border oa:border-solid oa:border-border oa:bg-background oa:p-6 oa:sm:grid-cols-2">
        {resolveFields({ schema, record, fields, hideEmpty }).map((shown) => {
          const { field } = shown;
          return (
            <div
              key={field.key}
              className={cn(
                'oa:flex oa:min-w-0 oa:flex-col oa:gap-1.5',
                isWide({ field, value: record[field.key] }) &&
                  'oa:sm:col-span-2'
              )}
            >
              <dt className="oa:text-xs oa:font-medium oa:uppercase oa:tracking-wide oa:text-muted-foreground">
                {field.label}
              </dt>
              <dd className="oa:m-0 oa:min-w-0">
                <FieldValue shown={shown} record={record} />
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
};
