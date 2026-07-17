/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
} from 'react-aria-components';

const App = () => {
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return <p>Project deleted</p>;
  }

  return (
    <DialogTrigger>
      <Button>Delete project</Button>
      <Modal>
        <Dialog role="alertdialog">
          {({ close }) => {
            return (
              <>
                <Heading slot="title">Delete project?</Heading>
                <p>This action cannot be undone.</p>
                <Button onPress={close}>Cancel</Button>
                <Button
                  onPress={() => {
                    setDeleted(true);
                    close();
                  }}
                >
                  Confirm delete
                </Button>
              </>
            );
          }}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
};

export default App;
