import {
  Breadcrumb,
  Breadcrumbs,
  Button,
  Checkbox,
  Group,
  Link,
  Meter,
  ProgressBar,
  Radio,
  RadioGroup,
  SearchField,
  SearchFieldControl,
  SearchFieldLabel,
  Separator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TextField,
  TextFieldControl,
  TextFieldLabel,
  ToggleButton,
  Toolbar,
} from '@ttoss/fsl-ui';
import { type Consequence, type EvaluationsFor } from '@ttoss/fsl-ui/semantics';
import type * as React from 'react';

/**
 * Preview + copy-JSX registry for the Component Lab (PRD F3.2/F3.3).
 *
 * Each entry pairs a live `render(sel)` with the matching `code(sel)` snippet
 * so the preview and the copied JSX never drift. The registry is a curated
 * set: components here get a props-driven live preview and a verified,
 * copy-ready snippet. Components not in the registry still appear in the
 * catalog with their full semantic identity + legal-props panel + CONTRACT
 * link, and the composites among them are demonstrated live in the example
 * pages — we never emit a snippet we haven't verified compiles (PRD §14).
 *
 * Which props each entry consumes mirrors the FSL legality matrices: only
 * Action carries `consequence`; Input/Selection carry no `evaluation`.
 */
export interface PreviewSelection {
  evaluation?: string;
  consequence?: string;
}

export interface PreviewDef {
  render: (sel: PreviewSelection) => React.ReactNode;
  code: (sel: PreviewSelection) => string;
}

/** `evaluation="x"` attribute string, or '' when unset. */
const evalAttr = (sel: PreviewSelection): string => {
  return sel.evaluation ? ` evaluation="${sel.evaluation}"` : '';
};

const conseqAttr = (sel: PreviewSelection): string => {
  return sel.consequence ? ` consequence="${sel.consequence}"` : '';
};

const actionEval = (sel: PreviewSelection) => {
  return sel.evaluation as EvaluationsFor<'Action'> | undefined;
};

/** Registry keyed by `ComponentMeta.displayName`. */
export const PREVIEWS: Record<string, PreviewDef> = {
  Button: {
    render: (sel) => {
      return (
        <div className="preview-row">
          <Button
            evaluation={actionEval(sel)}
            consequence={sel.consequence as Consequence | undefined}
          >
            Save changes
          </Button>
          <Button
            evaluation={actionEval(sel)}
            consequence={sel.consequence as Consequence | undefined}
            isDisabled
          >
            Disabled
          </Button>
        </div>
      );
    },
    code: (sel) => {
      return `<Button${evalAttr(sel)}${conseqAttr(sel)}>Save changes</Button>`;
    },
  },

  ToggleButton: {
    render: (sel) => {
      return (
        <div className="preview-row">
          <ToggleButton evaluation={sel.evaluation as 'primary' | 'muted'}>
            Grid view
          </ToggleButton>
          <ToggleButton
            evaluation={sel.evaluation as 'primary' | 'muted'}
            defaultSelected
          >
            Selected
          </ToggleButton>
        </div>
      );
    },
    code: (sel) => {
      return `<ToggleButton${evalAttr(sel)}>Grid view</ToggleButton>`;
    },
  },

  Link: {
    render: (sel) => {
      return (
        <Link
          evaluation={
            sel.evaluation as EvaluationsFor<'Navigation'> | undefined
          }
          href="https://ttoss.dev/docs/design/design-system/fsl"
        >
          FSL documentation
        </Link>
      );
    },
    code: (sel) => {
      return `<Link${evalAttr(sel)} href="/docs">FSL documentation</Link>`;
    },
  },

  Breadcrumbs: {
    render: () => {
      return (
        <Breadcrumbs>
          <Breadcrumb href="/">Home</Breadcrumb>
          <Breadcrumb href="/reports">Reports</Breadcrumb>
          <Breadcrumb>Q3</Breadcrumb>
        </Breadcrumbs>
      );
    },
    code: () => {
      return [
        '<Breadcrumbs>',
        '  <Breadcrumb href="/">Home</Breadcrumb>',
        '  <Breadcrumb href="/reports">Reports</Breadcrumb>',
        '  <Breadcrumb>Q3</Breadcrumb>',
        '</Breadcrumbs>',
      ].join('\n');
    },
  },

  Tabs: {
    render: () => {
      return (
        <Tabs>
          <TabList aria-label="Sections">
            <Tab id="overview">Overview</Tab>
            <Tab id="activity">Activity</Tab>
          </TabList>
          <TabPanel id="overview">Overview content.</TabPanel>
          <TabPanel id="activity">Activity content.</TabPanel>
        </Tabs>
      );
    },
    code: () => {
      return [
        '<Tabs>',
        '  <TabList aria-label="Sections">',
        '    <Tab id="overview">Overview</Tab>',
        '    <Tab id="activity">Activity</Tab>',
        '  </TabList>',
        '  <TabPanel id="overview">Overview content.</TabPanel>',
        '  <TabPanel id="activity">Activity content.</TabPanel>',
        '</Tabs>',
      ].join('\n');
    },
  },

  Switch: {
    render: () => {
      return <Switch defaultSelected>Enable notifications</Switch>;
    },
    code: () => {
      return '<Switch defaultSelected>Enable notifications</Switch>';
    },
  },

  Checkbox: {
    render: () => {
      return (
        <div className="preview-col">
          <Checkbox>Accept terms</Checkbox>
          <Checkbox isDisabled>Unavailable option</Checkbox>
        </div>
      );
    },
    code: () => {
      return '<Checkbox>Accept terms</Checkbox>';
    },
  },

  RadioGroup: {
    render: () => {
      return (
        <RadioGroup label="Size" defaultValue="md">
          <Radio value="sm">Small</Radio>
          <Radio value="md">Medium</Radio>
          <Radio value="lg">Large</Radio>
        </RadioGroup>
      );
    },
    code: () => {
      return [
        '<RadioGroup label="Size" defaultValue="md">',
        '  <Radio value="sm">Small</Radio>',
        '  <Radio value="md">Medium</Radio>',
        '  <Radio value="lg">Large</Radio>',
        '</RadioGroup>',
      ].join('\n');
    },
  },

  TextField: {
    render: () => {
      return (
        <TextField>
          <TextFieldLabel>Email</TextFieldLabel>
          <TextFieldControl type="email" />
        </TextField>
      );
    },
    code: () => {
      return [
        '<TextField>',
        '  <TextFieldLabel>Email</TextFieldLabel>',
        '  <TextFieldControl type="email" />',
        '</TextField>',
      ].join('\n');
    },
  },

  SearchField: {
    render: () => {
      return (
        <SearchField clearLabel="Clear search">
          <SearchFieldLabel>Search</SearchFieldLabel>
          <SearchFieldControl placeholder="Search…" />
        </SearchField>
      );
    },
    code: () => {
      return [
        '<SearchField clearLabel="Clear search">',
        '  <SearchFieldLabel>Search</SearchFieldLabel>',
        '  <SearchFieldControl placeholder="Search…" />',
        '</SearchField>',
      ].join('\n');
    },
  },

  TagGroup: {
    render: () => {
      return (
        <TagGroup label="Filters" selectionMode="multiple">
          <Tag id="react">React</Tag>
          <Tag id="vue">Vue</Tag>
          <Tag id="svelte">Svelte</Tag>
        </TagGroup>
      );
    },
    code: () => {
      return [
        '<TagGroup label="Filters" selectionMode="multiple">',
        '  <Tag id="react">React</Tag>',
        '  <Tag id="vue">Vue</Tag>',
        '</TagGroup>',
      ].join('\n');
    },
  },

  Meter: {
    render: (sel) => {
      return (
        <Meter
          aria-label="Storage used"
          label="Storage used"
          value={72}
          evaluation={sel.evaluation as EvaluationsFor<'Feedback'> | undefined}
        />
      );
    },
    code: (sel) => {
      return `<Meter aria-label="Storage" label="Storage used" value={72}${evalAttr(
        sel
      )} />`;
    },
  },

  ProgressBar: {
    render: () => {
      return <ProgressBar label="Uploading" value={42} />;
    },
    code: () => {
      return '<ProgressBar label="Uploading" value={42} />';
    },
  },

  Separator: {
    render: () => {
      return (
        <div className="preview-col">
          <span>Above</span>
          <Separator />
          <span>Below</span>
        </div>
      );
    },
    code: () => {
      return '<Separator />';
    },
  },

  Group: {
    render: (sel) => {
      return (
        <Group
          label="Shipping address"
          evaluation={sel.evaluation as EvaluationsFor<'Structure'> | undefined}
        >
          <TextField>
            <TextFieldLabel>Street</TextFieldLabel>
            <TextFieldControl />
          </TextField>
        </Group>
      );
    },
    code: (sel) => {
      return [
        `<Group label="Shipping address"${evalAttr(sel)}>`,
        '  <TextField>',
        '    <TextFieldLabel>Street</TextFieldLabel>',
        '    <TextFieldControl />',
        '  </TextField>',
        '</Group>',
      ].join('\n');
    },
  },

  Toolbar: {
    render: (sel) => {
      return (
        <Toolbar
          aria-label="Text formatting"
          evaluation={sel.evaluation as EvaluationsFor<'Structure'> | undefined}
        >
          <ToggleButton aria-label="Bold">B</ToggleButton>
          <ToggleButton aria-label="Italic">I</ToggleButton>
          <Separator orientation="vertical" />
          <Button aria-label="Link">Link</Button>
        </Toolbar>
      );
    },
    code: (sel) => {
      return [
        `<Toolbar aria-label="Text formatting"${evalAttr(sel)}>`,
        '  <ToggleButton aria-label="Bold">B</ToggleButton>',
        '  <ToggleButton aria-label="Italic">I</ToggleButton>',
        '  <Separator orientation="vertical" />',
        '  <Button aria-label="Link">Link</Button>',
        '</Toolbar>',
      ].join('\n');
    },
  },
};

export const previewFor = (displayName: string): PreviewDef | undefined => {
  return PREVIEWS[displayName];
};
