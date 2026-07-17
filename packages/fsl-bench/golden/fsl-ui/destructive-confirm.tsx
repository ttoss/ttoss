/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { Button, ConfirmationDialog } from '@ttoss/fsl-ui';
import { useState } from 'react';

const App = () => {
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <p>Project deleted</p>;
  }

  return (
    <ConfirmationDialog
      trigger={<Button evaluation="negative">Delete project</Button>}
      title="Delete project?"
      consequence="destructive"
      confirmLabel="Confirm delete"
      armedLabel="Click again to confirm"
      cancelLabel="Cancel"
      onConfirm={() => {
        setDeleted(true);
      }}
    >
      This action cannot be undone.
    </ConfirmationDialog>
  );
};

export default App;
