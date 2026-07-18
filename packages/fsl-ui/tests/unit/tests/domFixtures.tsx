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

import {
  treeAccordion,
  treeBreadcrumbs,
  treeCheckboxGroup,
  treeDialog,
  treeDisclosure,
  treeGridList,
  treeListBox,
  treeMenu,
  treeRadio,
  treeSearchField,
  treeSelect,
  treeTabs,
  treeTagGroup,
  treeTextArea,
  treeTextField,
  treeToast,
  treeToggleButtonGroup,
  treeWizard,
} from './domFixtures.trees';

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
//
// Shared composite trees live in `domFixtures.trees.tsx` (declared once,
// reused across every sub-part meta) — see that file's header for the rule.
// ---------------------------------------------------------------------------
export type DomFixture = {
  scope: string;
  element: () => React.ReactElement;
  open?: () => void;
  /**
   * Optional jest-axe run options for this fixture's a11y check. Use only to
   * suppress a documented tooling false-positive (never a real violation) —
   * see the Meter fixture for the canonical example (RAC's deliberate
   * `role="meter progressbar"` fallback trips axe's `aria-allowed-attr`).
   */
  axeOptions?: Record<string, unknown>;
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
  CheckboxGroup: { scope: 'checkbox-group', element: treeCheckboxGroup },
  FileTrigger: {
    scope: 'file-trigger',
    element: () => {
      return <pkg.FileTrigger>Upload</pkg.FileTrigger>;
    },
  },
  Breadcrumbs: { scope: 'breadcrumbs', element: treeBreadcrumbs },
  Breadcrumb: { scope: 'breadcrumbs', element: treeBreadcrumbs },
  Group: {
    scope: 'group',
    element: () => {
      return (
        <pkg.Group label="Details">
          <pkg.Button>x</pkg.Button>
        </pkg.Group>
      );
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
  NumberField: {
    scope: 'number-field',
    element: () => {
      return <pkg.NumberField label="Quantity" defaultValue={1} />;
    },
  },
  Meter: {
    scope: 'meter',
    element: () => {
      return <pkg.Meter aria-label="Storage" label="Storage used" value={40} />;
    },
    // React Aria's useMeter deliberately renders `role="meter progressbar"`
    // (a documented Firefox/Chrome fallback — meter is not universally
    // supported). axe-core's `aria-allowed-attr` mishandles the
    // space-separated role fallback list: it resolves the element to a
    // generic role and rejects the valid `aria-value*` attributes. The DOM is
    // correct for real assistive tech; this is a known axe limitation, so the
    // single rule is disabled for this fixture only. See ROADMAP Meter row.
    axeOptions: { rules: { 'aria-allowed-attr': { enabled: false } } },
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
  Surface: {
    scope: 'surface',
    element: () => {
      return <pkg.Surface>content</pkg.Surface>;
    },
  },
  Slider: {
    scope: 'slider',
    element: () => {
      return <pkg.Slider label="Volume" defaultValue={50} />;
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
  Toolbar: {
    scope: 'toolbar',
    element: () => {
      return (
        <pkg.Toolbar aria-label="formatting">
          <pkg.Button aria-label="Bold">B</pkg.Button>
          <pkg.Button aria-label="Italic">I</pkg.Button>
        </pkg.Toolbar>
      );
    },
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
  // ── Disclosure ────────────────────────────────────────────────────
  Disclosure: { scope: 'disclosure', element: treeDisclosure },
  DisclosureTrigger: { scope: 'disclosure', element: treeDisclosure },
  DisclosurePanel: { scope: 'disclosure', element: treeDisclosure },
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
  // ── GridList / GridListItem ───────────────────────────────────────
  GridList: { scope: 'grid-list', element: treeGridList },
  GridListItem: { scope: 'grid-list', element: treeGridList },
  // ── ListBox / ListBoxItem ─────────────────────────────────────────
  ListBox: { scope: 'list-box', element: treeListBox },
  ListBoxItem: { scope: 'list-box', element: treeListBox },
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
  // ── TagGroup / Tag ────────────────────────────────────────────────
  TagGroup: { scope: 'tag-group', element: treeTagGroup },
  Tag: { scope: 'tag-group', element: treeTagGroup },
  // ── SearchField ───────────────────────────────────────────────────
  SearchField: { scope: 'search-field', element: treeSearchField },
  SearchFieldLabel: { scope: 'search-field', element: treeSearchField },
  SearchFieldControl: { scope: 'search-field', element: treeSearchField },
  // ── TextArea ──────────────────────────────────────────────────────
  TextArea: { scope: 'text-area', element: treeTextArea },
  TextAreaLabel: { scope: 'text-area', element: treeTextArea },
  TextAreaControl: { scope: 'text-area', element: treeTextArea },
  TextAreaDescription: { scope: 'text-area', element: treeTextArea },
  TextAreaError: { scope: 'text-area', element: treeTextArea },
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
