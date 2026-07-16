# React Aria Components

Unstyled, accessible React components from Adobe (`react-aria-components`).
Every component ships behavior + ARIA semantics; you own all styling via
`className`/`style` (both accept render-prop functions receiving state).

## Setup

```
npm install react-aria-components
```

```tsx
import { Button } from 'react-aria-components';

<Button onPress={() => save()}>Save</Button>;
```

Buttons use `onPress` (not `onClick`). Form submission: `<Button type="submit">`.

## Dialog (modal)

```tsx
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
} from 'react-aria-components';

<DialogTrigger>
  <Button>Open</Button>
  <Modal>
    <Dialog>
      {({ close }) => (
        <>
          <Heading slot="title">Title</Heading>
          <p>Body content.</p>
          <Button onPress={close}>Close</Button>
        </>
      )}
    </Dialog>
  </Modal>
</DialogTrigger>;
```

`Heading slot="title"` labels the dialog automatically. For destructive
confirmations use `<Dialog role="alertdialog">`. The `close` function from
the render prop (or `<Button slot="close">`) dismisses the dialog.

## TextField + validation

```tsx
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from 'react-aria-components';

<Form
  onSubmit={(e) => {
    e.preventDefault(); /* ... */
  }}
>
  <TextField
    value={value}
    onChange={setValue} // onChange receives the STRING value
    isInvalid={invalid} // or use `validate={(v) => 'error' | null}`
  >
    <Label>Email</Label>
    <Input />
    <FieldError>Enter a valid email</FieldError>
  </TextField>
  <Button type="submit">Submit</Button>
</Form>;
```

`FieldError` renders only while the field is invalid; `isInvalid` also sets
`aria-invalid` on the input. `validate` + `Form` gives realtime validation.

## Menu

```tsx
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components';

<MenuTrigger>
  <Button>Actions</Button>
  <Popover>
    <Menu onAction={(key) => handle(key)}>
      <MenuItem id="edit">Edit</MenuItem>
      <MenuItem id="delete">Delete</MenuItem>
    </Menu>
  </Popover>
</MenuTrigger>;
```

The `Popover` wrapper is required. `onAction` receives the item `id`; the
menu closes automatically on selection.

## Switch

```tsx
import { Switch } from 'react-aria-components';

<Switch defaultSelected onChange={(isSelected) => {}}>
  Email notifications
</Switch>;
```

Children become the label. Controlled: `isSelected` + `onChange`.

## Styling and theming

Components render with no styles. Style with `className`/`style`, target
state via data attributes (`[data-hovered]`, `[data-selected]`,
`[data-invalid]`) or render props. There is no theme provider — teams define
design tokens as CSS custom properties and consume them with `var(--token)`.
