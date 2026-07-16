/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  DialogModal,
  DialogTrigger,
} from '@ttoss/fsl-ui';

const App = () => {
  return (
    <DialogTrigger>
      <Button evaluation="primary">Open settings</Button>
      <DialogModal>
        <Dialog>
          {({ close }) => {
            return (
              <>
                <DialogHeading>Settings</DialogHeading>
                <DialogBody>Manage your workspace preferences.</DialogBody>
                <DialogActions>
                  <Button composition="dismissAction" onPress={close}>
                    Close
                  </Button>
                </DialogActions>
              </>
            );
          }}
        </Dialog>
      </DialogModal>
    </DialogTrigger>
  );
};

export default App;
