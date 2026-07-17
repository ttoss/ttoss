/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
} from 'react-aria-components';

const App = () => {
  return (
    <DialogTrigger>
      <Button>Open settings</Button>
      <Modal>
        <Dialog>
          {({ close }) => {
            return (
              <>
                <Heading slot="title">Settings</Heading>
                <p>Manage your workspace preferences.</p>
                <Button onPress={close}>Close</Button>
              </>
            );
          }}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
};

export default App;
