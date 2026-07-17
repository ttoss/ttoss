/**
 * Keyboard interaction suite (audit A13) — Tab/Enter/Escape/Arrows on the
 * interactive composites, via @testing-library/user-event.
 *
 * These tests exercise the React Aria wiring END TO END: focus order,
 * arrow-key navigation, Escape dismissal, and the Dialog focus trap.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Dialog,
  DialogActions,
  DialogHeading,
  DialogModal,
  DialogTrigger,
  Menu,
  MenuItem,
  MenuTrigger,
  Select,
  SelectItem,
} from 'src/index';

// user-event + React Aria need real timers to settle transitions/presses.
beforeEach(() => {
  jest.useRealTimers();
});

describe('keyboard: Menu', () => {
  const renderMenu = (onAction: (key: React.Key) => void = () => {}) => {
    return render(
      <MenuTrigger>
        <Button>Open menu</Button>
        <Menu onAction={onAction}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuItem id="delete">Delete</MenuItem>
        </Menu>
      </MenuTrigger>
    );
  };

  test('Enter on the trigger opens the menu and focuses the first item', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
    await user.keyboard('{Enter}');
    const items = await screen.findAllByRole('menuitem');
    expect(items[0]).toHaveFocus();
  });

  test('ArrowDown/ArrowUp move through items', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findAllByRole('menuitem');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  test('Enter activates the focused item and closes the menu', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    renderMenu(onAction);
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findAllByRole('menuitem');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onAction.mock.calls[0]?.[0]).toBe('duplicate');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  test('Escape closes the menu and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findAllByRole('menuitem');
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
    });
  });
});

describe('keyboard: Dialog', () => {
  const renderDialog = () => {
    return render(
      <DialogTrigger>
        <Button>Open dialog</Button>
        <DialogModal>
          <Dialog>
            <DialogHeading>Settings</DialogHeading>
            <DialogActions>
              <Button composition="dismissAction" slot="close">
                Cancel
              </Button>
              <Button composition="primaryAction">Save</Button>
            </DialogActions>
          </Dialog>
        </DialogModal>
      </DialogTrigger>
    );
  };

  test('Escape closes the dialog and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
    });
  });

  test('Tab is trapped inside the open dialog', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.tab();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog');

    // DOM order inside DialogActions (ios platform): Cancel, Save.
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const save = screen.getByRole('button', { name: 'Save' });

    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(save).toHaveFocus();
    // Wraps back into the dialog — never escapes to the page behind
    // (the trigger is aria-hidden while the modal is open).
    await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

describe('keyboard: Select', () => {
  const renderSelect = () => {
    return render(
      <Select label="Framework" placeholder="Choose">
        <SelectItem id="react">React</SelectItem>
        <SelectItem id="vue">Vue</SelectItem>
        <SelectItem id="svelte">Svelte</SelectItem>
      </Select>
    );
  };

  test('Enter opens the listbox; arrows + Enter select an option', async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    // Trigger now shows the selected value.
    expect(screen.getByRole('button', { name: /Vue/ })).toBeInTheDocument();
  });

  test('Escape closes the listbox without selecting', async () => {
    const user = userEvent.setup();
    renderSelect();
    await user.tab();
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Choose/ })).toBeInTheDocument();
  });
});

describe('keyboard: Accordion', () => {
  const renderAccordion = () => {
    return render(
      <Accordion>
        <AccordionItem id="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionPanel>First panel</AccordionPanel>
        </AccordionItem>
        <AccordionItem id="b">
          <AccordionTrigger>Second</AccordionTrigger>
          <AccordionPanel>Second panel</AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  };

  test('Enter toggles the focused trigger', async () => {
    const user = userEvent.setup();
    renderAccordion();
    await user.tab();
    const first = screen.getByRole('button', { name: 'First' });
    expect(first).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(first).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Enter}');
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  test('Tab moves between triggers', async () => {
    const user = userEvent.setup();
    renderAccordion();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });
});
