import { useI18n } from '@ttoss/react-i18n';
import type * as React from 'react';

import {
  type CellKind,
  getCellKind,
  humanizeKey,
  statusTone,
} from '../core/table';
import type { JsonValue, OpenApiSchema } from '../core/types';
import { Badge } from '../ui/Badge';
import { messages } from './messages';

const MAX_TEXT = 80;

/** What an empty value shows. Not a word, so it needs no translation. */
const EMPTY_MARK = '—';

/** A placeholder for a missing value. */
export const EmptyValue = () => {
  return <span className="oa:text-muted-foreground">{EMPTY_MARK}</span>;
};

const truncate = (text: string): string => {
  return text.length <= MAX_TEXT ? text : `${text.slice(0, MAX_TEXT - 1)}…`;
};

const Truncated = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const shown = truncate(text);
  return (
    <span className={className} title={shown === text ? undefined : text}>
      {shown}
    </span>
  );
};

type KindProps = {
  value: JsonValue | undefined;
  schema?: OpenApiSchema;
  full: boolean;
};

const isPresent = (item: JsonValue): boolean => {
  return item !== null && item !== '';
};

const Sensitive = () => {
  const { intl } = useI18n();
  return (
    <span className="oa:italic oa:text-muted-foreground">
      {intl.formatMessage(messages.hidden)}
    </span>
  );
};

const BooleanValue = ({ value }: KindProps) => {
  const { intl } = useI18n();
  return <span>{intl.formatMessage(value ? messages.yes : messages.no)}</span>;
};

const NumberValue = ({ value }: KindProps) => {
  const { intl } = useI18n();
  return (
    <span className="oa:tabular-nums">{intl.formatNumber(Number(value))}</span>
  );
};

const DateValue = ({ value }: KindProps) => {
  const { intl } = useI18n();
  return (
    <span className="oa:whitespace-nowrap">
      {intl.formatDate(String(value), { dateStyle: 'medium', timeZone: 'UTC' })}
    </span>
  );
};

const DatetimeValue = ({ value }: KindProps) => {
  const { intl } = useI18n();
  return (
    <span className="oa:whitespace-nowrap">
      {intl.formatDate(String(value), {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}
    </span>
  );
};

const StatusValue = ({ value }: KindProps) => {
  return (
    <Badge tone={statusTone(String(value))}>{humanizeKey(String(value))}</Badge>
  );
};

const ListValue = ({ value, schema }: KindProps) => {
  const items = (value as JsonValue[]).filter(isPresent);
  if (items.length === 0) {
    return <EmptyValue />;
  }
  const label = (item: JsonValue) => {
    return schema?.items?.enum ? humanizeKey(String(item)) : String(item);
  };
  return (
    <span className="oa:inline-flex oa:flex-wrap oa:gap-1">
      {items.map((item, index) => {
        return <Badge key={`${String(item)}-${index}`}>{label(item)}</Badge>;
      })}
    </span>
  );
};

const RecordValue = ({ value, full }: KindProps) => {
  const entries = Object.entries(value as Record<string, JsonValue>);
  if (!full) {
    const text = entries
      .filter(([, item]) => {
        return isPresent(item);
      })
      .map(([, item]) => {
        return String(item);
      })
      .join(' · ');
    return <Truncated text={text} />;
  }
  return (
    <span className="oa:inline-flex oa:flex-wrap oa:gap-x-4 oa:gap-y-1">
      {entries.map(([key, item]) => {
        const keyLabel = `${humanizeKey(key)} `;
        return (
          <span key={key}>
            <span className="oa:text-muted-foreground">{keyLabel}</span>
            {item === null ? <EmptyValue /> : String(item)}
          </span>
        );
      })}
    </span>
  );
};

const JsonValueView = ({ value, full }: KindProps) => {
  if (!full) {
    return (
      <Truncated
        text={JSON.stringify(value)}
        className="oa:font-mono oa:text-xs oa:text-muted-foreground"
      />
    );
  }
  return (
    <pre className="oa:m-0 oa:max-h-80 oa:overflow-auto oa:rounded-md oa:bg-muted oa:p-3 oa:font-mono oa:text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

const TextValue = ({ value, full }: KindProps) => {
  if (full) {
    return (
      <span className="oa:whitespace-pre-wrap oa:break-words">
        {String(value)}
      </span>
    );
  }
  return <Truncated text={String(value)} />;
};

const VIEWS: Record<CellKind, (props: KindProps) => React.ReactElement> = {
  sensitive: Sensitive,
  empty: EmptyValue,
  boolean: BooleanValue,
  number: NumberValue,
  date: DateValue,
  datetime: DatetimeValue,
  status: StatusValue,
  list: ListValue,
  record: RecordValue,
  json: JsonValueView,
  text: TextValue,
};

/**
 * Renders one value, formatted by what the field's schema says it is: dates
 * and numbers in the user's locale, booleans as Yes/No, enums and status
 * fields as tonal badges, objects as JSON, and sensitive fields masked. In a
 * table cell long text is truncated; with `full` (detail views) it is shown
 * whole and objects are pretty-printed.
 */
export const CellValue = ({
  columnKey,
  value,
  schema,
  full = false,
}: {
  columnKey: string;
  value: JsonValue | undefined;
  schema?: OpenApiSchema;
  full?: boolean;
}): React.ReactElement => {
  const View = VIEWS[getCellKind({ key: columnKey, value, schema })];
  return <View value={value} schema={schema} full={full} />;
};
