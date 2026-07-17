# Radix Primitives

Unstyled, accessible React primitives, one npm package per component
(`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`,
`@radix-ui/react-alert-dialog`, `@radix-ui/react-switch`,
`@radix-ui/react-label`). Each primitive is a set of parts composed under a
`Root`. You own all styling (`className`/`style`); `asChild` merges a part's
behavior onto your own element.

## Dialog (modal)

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Body content.</Dialog.Description>
      <Dialog.Close asChild>
        <button>Close</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>;
```

`Title` labels the dialog; `Close` dismisses it. Controlled mode:
`<Dialog.Root open={open} onOpenChange={setOpen}>`.

## AlertDialog (destructive confirmation)

Same anatomy as Dialog, but interruption-safe (no outside-click dismiss):

```tsx
import * as AlertDialog from '@radix-ui/react-alert-dialog';

<AlertDialog.Root>
  <AlertDialog.Trigger asChild>
    <button>Delete</button>
  </AlertDialog.Trigger>
  <AlertDialog.Portal>
    <AlertDialog.Overlay />
    <AlertDialog.Content>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
      <AlertDialog.Cancel asChild>
        <button>Cancel</button>
      </AlertDialog.Cancel>
      <AlertDialog.Action asChild>
        <button onClick={confirm}>Yes, delete</button>
      </AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>;
```

## DropdownMenu

```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild>
    <button>Actions</button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content>
      <DropdownMenu.Item onSelect={() => handle()}>Edit</DropdownMenu.Item>
      <DropdownMenu.Item>Delete</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>;
```

`onSelect` fires on activation; the menu closes automatically.

## Switch

```tsx
import * as Switch from '@radix-ui/react-switch';
import * as Label from '@radix-ui/react-label';

<Label.Root htmlFor="s1">Email notifications</Label.Root>
<Switch.Root id="s1" defaultChecked onCheckedChange={(checked) => {}}>
  <Switch.Thumb />
</Switch.Root>;
```

## Forms / validation

Radix has no field or validation primitive in this set — use a plain
controlled `<form>`, `@radix-ui/react-label` for labels, and wire
`aria-invalid` / `aria-describedby` to your error message manually.

## Styling and theming

Primitives render unstyled. Style with `className`/`style` and the
`data-state` attributes (`[data-state="open"]`, `[data-state="checked"]`).
There is no theme provider — teams define design tokens as CSS custom
properties and consume them with `var(--token)`.
