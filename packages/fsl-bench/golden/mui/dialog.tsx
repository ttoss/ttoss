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

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Open settings
      </Button>
      <Dialog
        open={open}
        aria-labelledby="settings-title"
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle id="settings-title">Settings</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Manage your workspace preferences.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default App;
