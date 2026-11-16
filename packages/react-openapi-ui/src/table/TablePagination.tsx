import { useI18n } from '@ttoss/react-i18n';

import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/icons';
import { messages } from './messages';

export const TablePagination = ({
  pageIndex,
  pageSize,
  pageCount,
  total,
  rowCount,
  hasNextPage,
  onPageChange,
}: {
  pageIndex: number;
  pageSize: number;
  pageCount?: number;
  total?: number;
  rowCount: number;
  hasNextPage: boolean;
  onPageChange: (pageIndex: number) => void;
}) => {
  const { intl } = useI18n();
  if (rowCount === 0) {
    return null;
  }
  const from = pageIndex * pageSize + 1;
  const to = pageIndex * pageSize + rowCount;
  const summary =
    total !== undefined
      ? intl.formatMessage(messages.rangeOfTotal, {
          from: intl.formatNumber(from),
          to: intl.formatNumber(to),
          total: intl.formatNumber(total),
        })
      : intl.formatMessage(messages.rangeOnly, {
          from: intl.formatNumber(from),
          to: intl.formatNumber(to),
        });
  const singlePage = pageIndex === 0 && !hasNextPage;

  return (
    <div className="oa:flex oa:items-center oa:justify-between oa:gap-4 oa:text-sm oa:text-muted-foreground">
      <span className="oa:tabular-nums">{summary}</span>
      {!singlePage && (
        <div className="oa:flex oa:items-center oa:gap-2">
          {pageCount !== undefined && (
            <span className="oa:tabular-nums">
              {intl.formatMessage(messages.pageOf, {
                page: pageIndex + 1,
                pages: pageCount,
              })}
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label={intl.formatMessage(messages.previousPage)}
            disabled={pageIndex === 0}
            onClick={() => {
              onPageChange(pageIndex - 1);
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={intl.formatMessage(messages.nextPage)}
            disabled={!hasNextPage}
            onClick={() => {
              onPageChange(pageIndex + 1);
            }}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  );
};
