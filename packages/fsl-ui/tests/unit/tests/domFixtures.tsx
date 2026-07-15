/**
 * Canonical DOM fixtures — the minimal accessible render of every component
 * in the package, keyed by component export name.
 *
 * Shared by:
 *   - `components.contract.test.tsx` (invariant 7 — data-attribute contract)
 *   - `a11y.test.tsx` (jest-axe over every canonical render)
 *
 * Rule: when a new `*Meta` is added, add its fixture here — the contract
 * suite throws on any component without one. Fixtures must be *accessible*
 * renders (labels/aria where the real usage would have them): they are the
 * package's statement of canonical usage.
 */
import { fireEvent, screen } from '@testing-library/react';
import type * as React from 'react';
import * as pkg from 'src/index';

// ---------------------------------------------------------------------------
// 7. DOM data-attribute contract
//
// Renders each component in its minimal context and asserts that an element
// with the correct `[data-scope][data-part]` appears in the document.
//
// Fixture structure:
//   scope  — expected `data-scope` value on the element declared by the meta.
//            For composite sub-parts this is the HOST's kebab-case name, not
//            the sub-part's (e.g. DialogHeading uses scope="dialog").
//   render — factory returning the JSX to mount. Overlays use `defaultOpen`
//            so they appear in the DOM without interactive setup.
//   open   — optional post-render action for composites that open via a
//            trigger click (ConfirmationDialog).
//
// Rule: if a new `*Meta` is added and no fixture is defined here, the test
// for that component will throw — add the fixture before shipping.
// ---------------------------------------------------------------------------
export type DomFixture = {
  scope: string;
  element: () => React.ReactElement;
  open?: () => void;
};

export const DOM_FIXTURES: Record<string, DomFixture> = {
  // ── standalone components ─────────────────────────────────────────────
  Button: {
    scope: 'button',
    element: () => {
      return <pkg.Button>x</pkg.Button>;
    },
  },
  Checkbox: {
    scope: 'checkbox',
    element: () => {
      return <pkg.Checkbox>x</pkg.Checkbox>;
    },
  },
  Link: {
    scope: 'link',
    element: () => {
      return <pkg.Link href="#">x</pkg.Link>;
    },
  },
  ProgressBar: {
    scope: 'progress-bar',
    element: () => {
      return <pkg.ProgressBar aria-label="loading" />;
    },
  },
  Switch: {
    scope: 'switch',
    element: () => {
      return <pkg.Switch>x</pkg.Switch>;
    },
  },
  // ── RadioGroup / Radio ────────────────────────────────────────────
  RadioGroup: {
    scope: 'radio-group',
    element: () => {
      return (
        <pkg.RadioGroup>
          <pkg.Radio value="a">A</pkg.Radio>
        </pkg.RadioGroup>
      );
    },
  },
  Radio: {
    scope: 'radio',
    element: () => {
      return (
        <pkg.RadioGroup>
          <pkg.Radio value="a">A</pkg.Radio>
        </pkg.RadioGroup>
      );
    },
  },
  // ── Select / SelectItem ───────────────────────────────────────────
  Select: {
    scope: 'select',
    element: () => {
      return (
        <pkg.Select>
          <pkg.SelectItem id="a">A</pkg.SelectItem>
        </pkg.Select>
      );
    },
  },
  SelectItem: {
    scope: 'select',
    element: () => {
      return (
        <pkg.Select defaultOpen>
          <pkg.SelectItem id="a">A</pkg.SelectItem>
        </pkg.Select>
      );
    },
  },
  // ── Toast / ToastRegion ───────────────────────────────────────────
  // Both need a queue with an item so the region renders and a toast appears.
  ToastRegion: {
    scope: 'toast-region',
    element: () => {
      const queue = pkg.createToastQueue<pkg.ToastContent>({
        maxVisibleToasts: 5,
      });
      queue.add({ title: 'x' });
      return <pkg.ToastRegion queue={queue} />;
    },
  },
  Toast: {
    scope: 'toast',
    element: () => {
      const queue = pkg.createToastQueue<pkg.ToastContent>({
        maxVisibleToasts: 5,
      });
      queue.add({ title: 'test' });
      return <pkg.ToastRegion queue={queue} />;
    },
  },
  // ── Accordion ────────────────────────────────────────────────────────
  Accordion: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionItem: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionTrigger: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  AccordionPanel: {
    scope: 'accordion',
    element: () => {
      return (
        <pkg.Accordion>
          <pkg.AccordionItem id="x">
            <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
            <pkg.AccordionPanel>P</pkg.AccordionPanel>
          </pkg.AccordionItem>
        </pkg.Accordion>
      );
    },
  },
  // ── Dialog ────────────────────────────────────────────────────────────
  // Dialog, DialogHeading, DialogBody, DialogActions render without a
  // modal wrapper (React Aria emits role=dialog on the div regardless).
  Dialog: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogHeading>H</pkg.DialogHeading>
          <pkg.DialogBody>B</pkg.DialogBody>
          <pkg.DialogActions>
            <pkg.Button composition="primaryAction">OK</pkg.Button>
          </pkg.DialogActions>
        </pkg.Dialog>
      );
    },
  },
  DialogHeading: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogHeading>H</pkg.DialogHeading>
        </pkg.Dialog>
      );
    },
  },
  DialogBody: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogBody>B</pkg.DialogBody>
        </pkg.Dialog>
      );
    },
  },
  DialogActions: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.Dialog aria-label="test">
          <pkg.DialogActions>
            <pkg.Button composition="primaryAction">OK</pkg.Button>
          </pkg.DialogActions>
        </pkg.Dialog>
      );
    },
  },
  // DialogModal is a portal overlay — use defaultOpen via DialogTrigger.
  DialogModal: {
    scope: 'dialog',
    element: () => {
      return (
        <pkg.DialogTrigger defaultOpen>
          <pkg.Button>Open</pkg.Button>
          <pkg.DialogModal>
            <pkg.Dialog aria-label="test">content</pkg.Dialog>
          </pkg.DialogModal>
        </pkg.DialogTrigger>
      );
    },
  },
  // ConfirmationDialog wraps Dialog and overrides data-scope via the prop
  // added to Dialog. The dialog is closed on initial render; trigger click
  // opens it.
  ConfirmationDialog: {
    scope: 'confirmation-dialog',
    element: () => {
      return (
        <pkg.ConfirmationDialog
          trigger={<pkg.Button>open</pkg.Button>}
          title="Confirm?"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={() => {}}
        />
      );
    },
    open: () => {
      return fireEvent.click(screen.getByRole('button', { name: 'open' }));
    },
  },
  // ── Form ────────────────────────────────────────────────────────────────
  Form: {
    scope: 'form',
    element: () => {
      return <pkg.Form>x</pkg.Form>;
    },
  },
  FormActions: {
    scope: 'form',
    element: () => {
      return (
        <pkg.Form>
          <pkg.FormActions>
            <pkg.FormSubmit>Save</pkg.FormSubmit>
          </pkg.FormActions>
        </pkg.Form>
      );
    },
  },
  // FormSubmit delegates to Button but overrides data-scope="form-submit".
  FormSubmit: {
    scope: 'form-submit',
    element: () => {
      return (
        <pkg.Form>
          <pkg.FormSubmit>Save</pkg.FormSubmit>
        </pkg.Form>
      );
    },
  },
  // ── Menu / MenuItem ───────────────────────────────────────────────
  // Popover only renders when open. Use defaultOpen on MenuTrigger.
  Menu: {
    scope: 'menu',
    element: () => {
      return (
        <pkg.MenuTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Menu>
            <pkg.MenuItem>Item</pkg.MenuItem>
          </pkg.Menu>
        </pkg.MenuTrigger>
      );
    },
  },
  MenuItem: {
    scope: 'menu',
    element: () => {
      return (
        <pkg.MenuTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Menu>
            <pkg.MenuItem>Item</pkg.MenuItem>
          </pkg.Menu>
        </pkg.MenuTrigger>
      );
    },
  },
  // ── TextField ─────────────────────────────────────────────────────────
  TextField: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldLabel: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldControl: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
        </pkg.TextField>
      );
    },
  },
  TextFieldDescription: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
          <pkg.TextFieldDescription>Hint</pkg.TextFieldDescription>
        </pkg.TextField>
      );
    },
  },
  TextFieldError: {
    scope: 'text-field',
    element: () => {
      return (
        <pkg.TextField isInvalid>
          <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
          <pkg.TextFieldControl />
          <pkg.TextFieldError>Required</pkg.TextFieldError>
        </pkg.TextField>
      );
    },
  },
  // ── Wizard ──────────────────────────────────────────────────────────────
  Wizard: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardNavigation
            prevLabel="Back"
            nextLabel="Next"
            finishLabel="Finish"
          />
        </pkg.Wizard>
      );
    },
  },
  WizardStep: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
        </pkg.Wizard>
      );
    },
  },
  // WizardSummary only renders when Wizard is complete (currentStep >= totalSteps).
  // With defaultStep=1 and exactly 1 WizardStep, isComplete=true on mount.
  WizardSummary: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test" defaultStep={1}>
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardSummary>
            <p>done</p>
          </pkg.WizardSummary>
        </pkg.Wizard>
      );
    },
  },
  WizardNavigation: {
    scope: 'wizard',
    element: () => {
      return (
        <pkg.Wizard aria-label="test">
          <pkg.WizardStep>
            <p>step</p>
          </pkg.WizardStep>
          <pkg.WizardNavigation
            prevLabel="Back"
            nextLabel="Next"
            finishLabel="Finish"
          />
        </pkg.Wizard>
      );
    },
  },
};
