/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { Button, Menu, MenuItem, MenuTrigger } from '@ttoss/fsl-ui';
import { useState } from 'react';

const App = () => {
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      <MenuTrigger>
        <Button evaluation="secondary">Actions</Button>
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
      </MenuTrigger>
      {renaming ? <p>Renaming item</p> : null}
    </>
  );
};

export default App;
