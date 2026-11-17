import { defineMessages } from '@ttoss/react-i18n';

export const messages = defineMessages({
  searchPlaceholder: {
    defaultMessage: 'Search…',
    description: 'OpenApiTable: placeholder of the free-text search input.',
  },
  searchLabel: {
    defaultMessage: 'Search records',
    description: 'OpenApiTable: accessible name of the search input.',
  },
  allStatuses: {
    defaultMessage: 'All',
    description: 'OpenApiTable: status filter chip that clears the filter.',
  },
  statusFilterLabel: {
    defaultMessage: 'Filter by {field}',
    description:
      'OpenApiTable: accessible name of the status filter chip group. {field} is the column name.',
  },
  refresh: {
    defaultMessage: 'Refresh',
    description: 'OpenApiTable: button that reloads the data from the API.',
  },
  emptyTitle: {
    defaultMessage: 'No records yet',
    description:
      'OpenApiTable: empty state title when the API returned no records.',
  },
  emptyFilteredTitle: {
    defaultMessage: 'No results found',
    description:
      'OpenApiTable: empty state title when search or filters hide every record.',
  },
  emptyFilteredHint: {
    defaultMessage: 'Try a different search or filter.',
    description:
      'OpenApiTable: empty state hint when search or filters hide every record.',
  },
  errorTitle: {
    defaultMessage: 'Could not load the data',
    description:
      'OpenApiTable: title of the error shown when the request fails.',
  },
  retry: {
    defaultMessage: 'Try again',
    description: 'OpenApiTable: button that retries a failed request.',
  },
  rangeOfTotal: {
    defaultMessage: '{from}–{to} of {total}',
    description: 'OpenApiTable: pagination summary when the total is known.',
  },
  rangeOnly: {
    defaultMessage: 'Showing {from}–{to}',
    description:
      'OpenApiTable: pagination summary when the API reports no total.',
  },
  pageOf: {
    defaultMessage: 'Page {page} of {pages}',
    description: 'OpenApiTable: current page indicator.',
  },
  previousPage: {
    defaultMessage: 'Previous page',
    description: 'OpenApiTable: accessible name of the previous page button.',
  },
  nextPage: {
    defaultMessage: 'Next page',
    description: 'OpenApiTable: accessible name of the next page button.',
  },
  yes: {
    defaultMessage: 'Yes',
    description: 'OpenApiTable: cell text for a true boolean value.',
  },
  no: {
    defaultMessage: 'No',
    description: 'OpenApiTable: cell text for a false boolean value.',
  },
  hidden: {
    defaultMessage: 'Hidden',
    description:
      'OpenApiTable: cell text replacing a sensitive value (secret, token).',
  },
  sortBy: {
    defaultMessage: 'Sort by {column}',
    description: 'OpenApiTable: accessible name of a sortable column header.',
  },
  loading: {
    defaultMessage: 'Loading',
    description: 'OpenApiTable: accessible label while the data loads.',
  },
});
