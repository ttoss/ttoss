/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';

const App = () => {
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button">Actions</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content>
            <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                setRenaming(true);
              }}
            >
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item>Delete</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {renaming ? <p>Renaming item</p> : null}
    </>
  );
};

export default App;
