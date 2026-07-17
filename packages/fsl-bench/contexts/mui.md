# MUI (Material UI)

Fully-styled React component library (`@mui/material`, with
`@emotion/react` + `@emotion/styled`). Components are themable via
`ThemeProvider` and the `sx` prop; prefer palette tokens
(`primary`, `error`, `text.secondary`, …) over raw color values.

## Setup

```tsx
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme(); // default Material theme

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>;
```

## Button

```tsx
import { Button } from '@mui/material';

<Button variant="contained" color="primary" onClick={save}>
  Save
</Button>;
// variants: 'text' (default) | 'outlined' | 'contained' (strongest emphasis)
```

## Dialog

```tsx
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

<Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="dlg-title">
  <DialogTitle id="dlg-title">Title</DialogTitle>
  <DialogContent>
    <DialogContentText>Body content.</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>;
```

Open state is controlled by the host (`open` + `onClose`).

## TextField + validation

```tsx
import { TextField } from '@mui/material';

<TextField
  label="Email"
  value={email}
  error={invalid} // sets aria-invalid + red styling
  helperText={invalid ? 'Enter a valid email' : undefined}
  onChange={(event) => setEmail(event.target.value)}
/>;
```

Wrap in a `<form noValidate onSubmit={...}>` and validate in the submit
handler for submit-time validation.

## Menu

```tsx
import { Button, Menu, MenuItem } from '@mui/material';

const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

<Button onClick={(e) => setAnchorEl(e.currentTarget)}>Actions</Button>
<Menu anchorEl={anchorEl} open={anchorEl !== null} onClose={() => setAnchorEl(null)}>
  <MenuItem onClick={() => { handle(); setAnchorEl(null); }}>Edit</MenuItem>
  <MenuItem onClick={() => setAnchorEl(null)}>Delete</MenuItem>
</Menu>;
```

## Switch

```tsx
import { FormControlLabel, Switch } from '@mui/material';

<FormControlLabel
  control={<Switch defaultChecked onChange={(e) => {}} />}
  label="Email notifications"
/>;
```

## Layout / typography

`Card`/`CardContent` for surfaces; `Typography` for text
(`<Typography component="h2" variant="h5">` renders a real h2). Use the
`sx` prop with theme tokens for one-off styling:
`sx={{ bgcolor: 'background.paper', color: 'text.primary' }}` — never
hardcode hex values.
