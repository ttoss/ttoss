import { useI18n } from '@ttoss/react-i18n';
import * as React from 'react';

import type { OperationParams } from '../core/types';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Alert } from '../ui/fields';
import { useOperationMutation } from '../useOperationMutation';
import { messages } from './messages';

export type OpenApiDeleteButtonProps = {
  /** `operationId` of the DELETE operation. */
  operationId: string;
  /** Path and query params, e.g. the id of the record to delete. */
  params?: OperationParams;
  /** Names the record in the confirmation title ("Delete Ana Silva?"). */
  recordName?: string;
  /** Called with the response body after the record is deleted. */
  onSuccess?: (data: unknown) => void;
  /** Button label. Defaults to "Delete". */
  label?: string;
};

/**
 * A button that calls an OpenAPI DELETE operation after the user confirms in
 * a dialog. Shows the API error inside the dialog when the request fails.
 */
export const OpenApiDeleteButton = ({
  operationId,
  params,
  recordName,
  onSuccess,
  label,
}: OpenApiDeleteButtonProps) => {
  const { intl } = useI18n();
  const [open, setOpen] = React.useState(false);
  const mutation = useOperationMutation({ operationId });

  const close = () => {
    setOpen(false);
    mutation.reset();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="oa:text-destructive oa:hover:bg-red-50"
        onClick={() => {
          setOpen(true);
        }}
      >
        {label ?? intl.formatMessage(messages.delete)}
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title={
          recordName
            ? intl.formatMessage(messages.confirmTitle, { name: recordName })
            : intl.formatMessage(messages.confirmTitleGeneric)
        }
        description={intl.formatMessage(messages.confirmDescription)}
      >
        {mutation.error && (
          <Alert title={intl.formatMessage(messages.deleteError)}>
            {mutation.error.message}
          </Alert>
        )}
        <div className="oa:flex oa:justify-end oa:gap-2">
          <Button variant="outline" onClick={close} disabled={mutation.pending}>
            {intl.formatMessage(messages.cancel)}
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.pending}
            onClick={() => {
              mutation
                .mutate({ params })
                .then((data) => {
                  setOpen(false);
                  onSuccess?.(data);
                })
                .catch(() => {
                  // The error is shown in the dialog.
                });
            }}
          >
            {mutation.pending
              ? intl.formatMessage(messages.deleting)
              : (label ?? intl.formatMessage(messages.delete))}
          </Button>
        </div>
      </Dialog>
    </>
  );
};
