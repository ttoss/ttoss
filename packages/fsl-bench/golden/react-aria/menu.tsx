/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';

const App = () => {
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      <MenuTrigger>
        <Button>Actions</Button>
        <Popover>
          <Menu
            onAction={(key) => {
              if (key === 'rename') {
                setRenaming(true);
              }
            }}
          >
            <MenuItem id="duplicate">Duplicate</MenuItem>
            <MenuItem id="rename">Rename</MenuItem>
            <MenuItem id="delete">Delete</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
      {renaming ? <p>Renaming item</p> : null}
    </>
  );
};

export default App;
