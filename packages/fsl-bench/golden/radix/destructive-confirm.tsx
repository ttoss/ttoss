/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { useState } from 'react';

const App = () => {
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <p>Project deleted</p>;
  }

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <button type="button">Delete project</button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay />
        <AlertDialog.Content>
          <AlertDialog.Title>Delete project?</AlertDialog.Title>
          <AlertDialog.Description>
            This action cannot be undone.
          </AlertDialog.Description>
          <AlertDialog.Cancel asChild>
            <button type="button">Cancel</button>
          </AlertDialog.Cancel>
          <AlertDialog.Action asChild>
            <button
              type="button"
              onClick={() => {
                setDeleted(true);
              }}
            >
              Confirm delete
            </button>
          </AlertDialog.Action>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};

export default App;
