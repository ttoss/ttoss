/**
 * Shared composite fixture trees.
 *
 * Composites (and any component whose canonical render needs more than a
 * single element) declare their DOM once here as a `treeXxx` factory and
 * reuse it across every sub-part fixture in `domFixtures.tsx`. A sub-part
 * only needs its `[data-scope][data-part]` to appear in the mounted tree, so
 * one factory serves all of a composite's metas.
 *
 * This file exists to keep `domFixtures.tsx` (the registry) under the 400-line
 * `max-lines` cap as the catalog grows — see the Wave 1/2 note in the ROADMAP.
 * When you add a composite, add its factory here and reference it from the
 * registry.
 */
import type * as React from 'react';
import * as pkg from 'src/index';

export const treeRadio = (): React.ReactElement => {
  return (
    <pkg.RadioGroup>
      <pkg.Radio value="a">A</pkg.Radio>
    </pkg.RadioGroup>
  );
};

export const treeSelect = (defaultOpen?: boolean): React.ReactElement => {
  return (
    <pkg.Select defaultOpen={defaultOpen}>
      <pkg.SelectItem id="a">A</pkg.SelectItem>
    </pkg.Select>
  );
};

export const treeToast = (): React.ReactElement => {
  const queue = pkg.createToastQueue<pkg.ToastContent>({ maxVisibleToasts: 5 });
  queue.add({ title: 'x' });
  return <pkg.ToastRegion queue={queue} />;
};

export const treeAccordion = (): React.ReactElement => {
  return (
    <pkg.Accordion>
      <pkg.AccordionItem id="x">
        <pkg.AccordionTrigger>T</pkg.AccordionTrigger>
        <pkg.AccordionPanel>P</pkg.AccordionPanel>
      </pkg.AccordionItem>
    </pkg.Accordion>
  );
};

export const treeCheckboxGroup = (): React.ReactElement => {
  return (
    <pkg.CheckboxGroup
      aria-label="Notifications"
      label="Notifications"
      description="Pick at least one"
    >
      <pkg.Checkbox value="email">Email</pkg.Checkbox>
      <pkg.Checkbox value="sms">SMS</pkg.Checkbox>
    </pkg.CheckboxGroup>
  );
};

export const treeDisclosure = (): React.ReactElement => {
  return (
    <pkg.Disclosure>
      <pkg.DisclosureTrigger>Section</pkg.DisclosureTrigger>
      <pkg.DisclosurePanel>Panel content</pkg.DisclosurePanel>
    </pkg.Disclosure>
  );
};

export const treeDialog = (): React.ReactElement => {
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

export const treeGridList = (): React.ReactElement => {
  return (
    <pkg.GridList aria-label="Files" selectionMode="multiple">
      <pkg.GridListItem id="a" textValue="Report">
        Report.pdf
      </pkg.GridListItem>
      <pkg.GridListItem id="b" textValue="Notes">
        Notes.txt
      </pkg.GridListItem>
    </pkg.GridList>
  );
};

export const treeListBox = (): React.ReactElement => {
  return (
    <pkg.ListBox aria-label="Frameworks" selectionMode="single">
      <pkg.ListBoxItem id="react">React</pkg.ListBoxItem>
      <pkg.ListBoxItem id="vue">Vue</pkg.ListBoxItem>
    </pkg.ListBox>
  );
};

export const treeMenu = (): React.ReactElement => {
  return (
    <pkg.MenuTrigger defaultOpen>
      <pkg.Button>T</pkg.Button>
      <pkg.Menu>
        <pkg.MenuItem>Item</pkg.MenuItem>
      </pkg.Menu>
    </pkg.MenuTrigger>
  );
};

export const treeTextField = (): React.ReactElement => {
  return (
    <pkg.TextField isInvalid>
      <pkg.TextFieldLabel>Label</pkg.TextFieldLabel>
      <pkg.TextFieldControl />
      <pkg.TextFieldDescription>Hint</pkg.TextFieldDescription>
      <pkg.TextFieldError>Required</pkg.TextFieldError>
    </pkg.TextField>
  );
};

export const treeSearchField = (): React.ReactElement => {
  return (
    <pkg.SearchField clearLabel="Clear search">
      <pkg.SearchFieldLabel>Search</pkg.SearchFieldLabel>
      <pkg.SearchFieldControl />
    </pkg.SearchField>
  );
};

export const treeTextArea = (): React.ReactElement => {
  return (
    <pkg.TextArea isInvalid>
      <pkg.TextAreaLabel>Notes</pkg.TextAreaLabel>
      <pkg.TextAreaControl />
      <pkg.TextAreaDescription>Optional</pkg.TextAreaDescription>
      <pkg.TextAreaError>Required</pkg.TextAreaError>
    </pkg.TextArea>
  );
};

export const treeTagGroup = (): React.ReactElement => {
  return (
    <pkg.TagGroup aria-label="Filters" label="Filters" onRemove={() => {}}>
      <pkg.Tag id="react">React</pkg.Tag>
      <pkg.Tag id="vue">Vue</pkg.Tag>
    </pkg.TagGroup>
  );
};

export const treeTabs = (): React.ReactElement => {
  return (
    <pkg.Tabs aria-label="sections">
      <pkg.TabList aria-label="sections">
        <pkg.Tab id="a">A</pkg.Tab>
      </pkg.TabList>
      <pkg.TabPanel id="a">Panel A</pkg.TabPanel>
    </pkg.Tabs>
  );
};

export const treeBreadcrumbs = (): React.ReactElement => {
  return (
    <pkg.Breadcrumbs>
      <pkg.Breadcrumb href="#a">A</pkg.Breadcrumb>
      <pkg.Breadcrumb>B</pkg.Breadcrumb>
    </pkg.Breadcrumbs>
  );
};

export const treeToggleButtonGroup = (): React.ReactElement => {
  return (
    <pkg.ToggleButtonGroup aria-label="view">
      <pkg.ToggleButton id="a">A</pkg.ToggleButton>
      <pkg.ToggleButton id="b">B</pkg.ToggleButton>
    </pkg.ToggleButtonGroup>
  );
};

export const treeWizard = (): React.ReactElement => {
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
