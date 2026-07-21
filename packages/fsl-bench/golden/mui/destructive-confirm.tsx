/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useState } from 'react';

const App = () => {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <p>Project deleted</p>;
  }

  return (
    <>
      <Button
        color="error"
        onClick={() => {
          setOpen(true);
        }}
      >
        Delete project
      </Button>
      <Dialog
        open={open}
        aria-labelledby="confirm-title"
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle id="confirm-title">Delete project?</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              setDeleted(true);
            }}
          >
            Confirm delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default App;
