/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import * as Dialog from '@radix-ui/react-dialog';

const App = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button">Open settings</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>Settings</Dialog.Title>
          <Dialog.Description>
            Manage your workspace preferences.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button type="button">Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default App;
