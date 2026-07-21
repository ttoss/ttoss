/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { Button, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

const App = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [renaming, setRenaming] = useState(false);

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
      >
        Actions
      </Button>
      <Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={closeMenu}>
        <MenuItem onClick={closeMenu}>Duplicate</MenuItem>
        <MenuItem
          onClick={() => {
            setRenaming(true);
            closeMenu();
          }}
        >
          Rename
        </MenuItem>
        <MenuItem onClick={closeMenu}>Delete</MenuItem>
      </Menu>
      {renaming ? <p>Renaming item</p> : null}
    </>
  );
};

export default App;
