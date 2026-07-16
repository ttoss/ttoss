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
 *
 * Composites share one element factory across their sub-parts (a sub-part
 * only needs its `[data-scope][data-part]` to appear in the mounted tree),
 * so the whole composite is declared once as a `treeXxx` factory and reused.
 */
import { fireEvent, screen } from '@testing-library/react';
import type * as React from 'react';
import * as pkg from 'src/index';

// ---------------------------------------------------------------------------
// 7. DOM data-attribute contract
//
// Fixture structure:
//   scope  — expected `data-scope` value on the element declared by the meta.
//            For composite sub-parts this is the HOST's kebab-case name, not
//            the sub-part's (e.g. DialogHeading uses scope="dialog").
//   element — factory returning the JSX to mount. Overlays use `defaultOpen`
//            so they appear in the DOM without interactive setup.
//   open   — optional post-render action for composites that open via a
//            trigger click (ConfirmationDialog).
// ---------------------------------------------------------------------------
export type DomFixture = {
  scope: string;
  element: () => React.ReactElement;
  open?: () => void;
};

// ── shared composite trees (declared once, reused across sub-parts) ────────
const treeRadio = () => {
  return (
    <pkg.RadioGroup>
      <pkg.Radio value="a">A</pkg.Radio>
    </pkg.RadioGroup>
  );
};

const treeSelect = (defaultOpen?: boolean) => {
  return (
    <pkg.Select defaultOpen={defaultOpen}>
      <pkg.SelectItem id="a">A</pkg.SelectItem>
    </pkg.Select>
  );
};

const treeToast = () => {
  const queue = pkg.createToastQueue<pkg.ToastContent>({ maxVisibleToasts: 5 });
  queue.add({ title: 'x' });
  return <pkg.ToastRegion queue={queue} />;
};

const treeAccordion = () => {
  return (
    <pkg.Accordion>
      <pkg.AccordionItem id="x">
        <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
        <pkg.AccordionPanel>P</pkg.AccordionPanel>
      </pkg.AccordionItem>
    </pkg.Accordion>
  );
};

const treeDialog = () => {
  return (
    <pkg.Dialog aria-label="test">
      <pkg.DialogHeading>H</pkg.DialogHeading>
      <pkg.DialogBody>B</pkg.DialogBody>
      <pkg.DialogActions>
        <pkg.Button composition="primaryAction">OK</pkg.Button>
      </pkg.DialogActions>
    </pkg.Dialog>
  );
};

const treeMenu = () => {
  return (
    <pkg.MenuTrigger defaultOpen>
      <pkg.Button>T</pkg.Button>
      <pkg.Menu>
        <pkg.MenuItem>Item</pkg.MenuItem>
      </pkg.Menu>
    </pkg.MenuTrigger>
  );
};

const treeTextField = () => {
  return (
    <pkg.TextField isInvalid>
      <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
      <pkg.TextFieldControl />
      <pkg.TextFieldDescription>Hint</pkg.TextFieldDescription>
      <pkg.TextFieldError>Required</pkg.TextFieldError>
    </pkg.TextField>
  );
};

const treeTabs = () => {
  return (
    <pkg.Tabs aria-label="sections">
      <pkg.TabList aria-label="sections">
        <pkg.Tab id="a">A</pkg.Tab>
      </pkg.TabList>
      <pkg.TabPanel id="a">Panel A</pkg.TabPanel>
    </pkg.Tabs>
  );
};

const treeBreadcrumbs = () => {
  return (
    <pkg.Breadcrumbs>
      <pkg.Breadcrumb href="#a">A</pkg.Breadcrumb>
      <pkg.Breadcrumb>B</pkg.Breadcrumb>
    </pkg.Breadcrumbs>
  );
};

const treeToggleButtonGroup = () => {
  return (
    <pkg.ToggleButtonGroup aria-label="view">
      <pkg.ToggleButton id="a">A</pkg.ToggleButton>
      <pkg.ToggleButton id="b">B</pkg.ToggleButton>
    </pkg.ToggleButtonGroup>
  );
};

const treeWizard = () => {
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
  Breadcrumbs: { scope: 'breadcrumbs', element: treeBreadcrumbs },
  Breadcrumb: { scope: 'breadcrumbs', element: treeBreadcrumbs },
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
  Tabs: { scope: 'tabs', element: treeTabs },
  TabList: { scope: 'tabs', element: treeTabs },
  Tab: { scope: 'tabs', element: treeTabs },
  TabPanel: { scope: 'tabs', element: treeTabs },
  Separator: {
    scope: 'separator',
    element: () => {
      return <pkg.Separator />;
    },
  },
  ToggleButton: {
    scope: 'toggle-button',
    element: () => {
      return <pkg.ToggleButton>x</pkg.ToggleButton>;
    },
  },
  ToggleButtonGroup: {
    scope: 'toggle-button-group',
    element: treeToggleButtonGroup,
  },
  // ── RadioGroup / Radio ────────────────────────────────────────────
  RadioGroup: { scope: 'radio-group', element: treeRadio },
  Radio: { scope: 'radio', element: treeRadio },
  // ── Select / SelectItem ───────────────────────────────────────────
  Select: {
    scope: 'select',
    element: () => {
      return treeSelect();
    },
  },
  SelectItem: {
    scope: 'select',
    element: () => {
      return treeSelect(true);
    },
  },
  // ── Toast / ToastRegion ───────────────────────────────────────────
  ToastRegion: { scope: 'toast-region', element: treeToast },
  Toast: { scope: 'toast', element: treeToast },
  // ── Accordion ─────────────────────────────────────────────────────
  Accordion: { scope: 'accordion', element: treeAccordion },
  AccordionItem: { scope: 'accordion', element: treeAccordion },
  AccordionTrigger: { scope: 'accordion', element: treeAccordion },
  AccordionPanel: { scope: 'accordion', element: treeAccordion },
  // ── Dialog ────────────────────────────────────────────────────────
  Dialog: { scope: 'dialog', element: treeDialog },
  DialogHeading: { scope: 'dialog', element: treeDialog },
  DialogBody: { scope: 'dialog', element: treeDialog },
  DialogActions: { scope: 'dialog', element: treeDialog },
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
  // ConfirmationDialog opens on trigger click.
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
  // ── Form ──────────────────────────────────────────────────────────
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
  Menu: { scope: 'menu', element: treeMenu },
  MenuItem: { scope: 'menu', element: treeMenu },
  // ── Tooltip ───────────────────────────────────────────────────────
  Tooltip: {
    scope: 'tooltip',
    element: () => {
      return (
        <pkg.TooltipTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Tooltip>Tip</pkg.Tooltip>
        </pkg.TooltipTrigger>
      );
    },
  },
  // ── Popover (standalone) ──────────────────────────────────────────
  Popover: {
    scope: 'popover',
    element: () => {
      return (
        <pkg.PopoverTrigger defaultOpen>
          <pkg.Button>T</pkg.Button>
          <pkg.Popover>content</pkg.Popover>
        </pkg.PopoverTrigger>
      );
    },
  },
  // ── TextField ─────────────────────────────────────────────────────
  TextField: { scope: 'text-field', element: treeTextField },
  TextFieldLabel: { scope: 'text-field', element: treeTextField },
  TextFieldControl: { scope: 'text-field', element: treeTextField },
  TextFieldDescription: { scope: 'text-field', element: treeTextField },
  TextFieldError: { scope: 'text-field', element: treeTextField },
  // ── Wizard ────────────────────────────────────────────────────────
  Wizard: { scope: 'wizard', element: treeWizard },
  WizardStep: { scope: 'wizard', element: treeWizard },
  WizardNavigation: { scope: 'wizard', element: treeWizard },
  // WizardSummary only renders when the wizard is complete.
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
};
