/**
 * Component Registry — single source of truth for contract tests.
 *
 * HOW TO ADD A NEW COMPONENT:
 * 1. Import it from 'src/index'
 * 2. Add a ComponentEntry to the `componentRegistry` array
 * 3. All contract tests run automatically — no new test file needed
 *
 * Each entry describes:
 * - name:              Must match the export key in index.ts
 * - cssSlug:           The BEM block name (e.g. "button", "accordion")
 * - responsibility:    The component's primary Responsibility
 * - compositionScopes: (composites only) maps BEM scopes to Host.Role for token validation
 * - render:            A representative render that shows all UI parts
 * - expectedClasses:   All ui2-* classes that must be in the DOM
 * - classNameTargets:  Parts that accept className — tested for merge behavior
 */

import type * as React from 'react';
import type { Host, Responsibility } from 'src/_model/index';
import {
  Accordion,
  Button,
  Checkbox,
  Dialog,
  Field,
  Switch,
  Tabs,
  Tooltip,
} from 'src/index';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClassNameTarget {
  /** Human-readable name (e.g. "Tabs.Root") */
  name: string;
  /** Expected base CSS class */
  baseClass: string;
  /** CSS selector to locate the target element */
  selector: string;
  /** Render the component with `className` applied to this target */
  render: (className: string) => React.ReactElement;
}

/**
 * Maps a BEM scope to its Host.Role composition context.
 * Used by P1 token validation tests to check that each scope's
 * CSS variables match the resolved TokenSpec for that Host.Role.
 */
export interface CompositionScope {
  /** BEM class for this scope (e.g. "ui2-dialog__footer") */
  bemClass: string;
  /** The Host this scope belongs to */
  host: Host;
  /** The Role within the Host */
  role: string;
  /** The Responsibility of the element in this scope */
  scopeResponsibility: Responsibility;
}

export interface ComponentEntry {
  /** Component export name — must match the key in index.ts */
  name: string;
  /** BEM block slug for CSS class naming validation */
  cssSlug: string;
  /** Component's primary Responsibility */
  responsibility: Responsibility;
  /** For composites: maps BEM scopes to their Host.Role composition tokens */
  compositionScopes?: CompositionScope[];
  /** Render a representative example showing all parts */
  render: () => React.ReactElement;
  /** All ui2-* CSS classes expected in the rendered DOM */
  expectedClasses: string[];
  /** Parts that accept className — each tested for merge behavior */
  classNameTargets: ClassNameTarget[];
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export const componentRegistry: ComponentEntry[] = [
  /* ── Button ──────────────────────────────────────────────────────── */
  {
    name: 'Button',
    cssSlug: 'button',
    responsibility: 'Action',
    render: () => {
      return <Button>Test</Button>;
    },
    expectedClasses: ['ui2-button'],
    classNameTargets: [
      {
        name: 'Button',
        baseClass: 'ui2-button',
        selector: '.ui2-button',
        render: (cn) => {
          return <Button className={cn}>T</Button>;
        },
      },
    ],
  },

  /* ── Checkbox ────────────────────────────────────────────────────── */
  {
    name: 'Checkbox',
    cssSlug: 'checkbox',
    responsibility: 'Selection',
    render: () => {
      return <Checkbox label="Test" />;
    },
    expectedClasses: [
      'ui2-checkbox',
      'ui2-checkbox__control',
      'ui2-checkbox__label',
    ],
    classNameTargets: [
      {
        name: 'Checkbox',
        baseClass: 'ui2-checkbox',
        selector: '.ui2-checkbox',
        render: (cn) => {
          return <Checkbox className={cn} label="T" />;
        },
      },
    ],
  },

  /* ── Switch ──────────────────────────────────────────────────────── */
  {
    name: 'Switch',
    cssSlug: 'switch',
    responsibility: 'Selection',
    render: () => {
      return <Switch label="Test" />;
    },
    expectedClasses: [
      'ui2-switch',
      'ui2-switch__control',
      'ui2-switch__thumb',
      'ui2-switch__label',
    ],
    classNameTargets: [
      {
        name: 'Switch',
        baseClass: 'ui2-switch',
        selector: '.ui2-switch',
        render: (cn) => {
          return <Switch className={cn} label="T" />;
        },
      },
    ],
  },

  /* ── Tabs ────────────────────────────────────────────────────────── */
  {
    name: 'Tabs',
    cssSlug: 'tabs',
    responsibility: 'Navigation',
    render: () => {
      return (
        <Tabs.Root defaultValue="t1">
          <Tabs.List>
            <Tabs.Trigger value="t1">T1</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="t1">C1</Tabs.Content>
        </Tabs.Root>
      );
    },
    expectedClasses: [
      'ui2-tabs',
      'ui2-tabs__list',
      'ui2-tabs__trigger',
      'ui2-tabs__content',
    ],
    classNameTargets: [
      {
        name: 'Tabs.Root',
        baseClass: 'ui2-tabs',
        selector: '.ui2-tabs',
        render: (cn) => {
          return (
            <Tabs.Root className={cn} defaultValue="t1">
              <Tabs.List>
                <Tabs.Trigger value="t1">T</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="t1">C</Tabs.Content>
            </Tabs.Root>
          );
        },
      },
      {
        name: 'Tabs.List',
        baseClass: 'ui2-tabs__list',
        selector: '.ui2-tabs__list',
        render: (cn) => {
          return (
            <Tabs.Root defaultValue="t1">
              <Tabs.List className={cn}>
                <Tabs.Trigger value="t1">T</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="t1">C</Tabs.Content>
            </Tabs.Root>
          );
        },
      },
      {
        name: 'Tabs.Trigger',
        baseClass: 'ui2-tabs__trigger',
        selector: '.ui2-tabs__trigger',
        render: (cn) => {
          return (
            <Tabs.Root defaultValue="t1">
              <Tabs.List>
                <Tabs.Trigger className={cn} value="t1">
                  T
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="t1">C</Tabs.Content>
            </Tabs.Root>
          );
        },
      },
      {
        name: 'Tabs.Content',
        baseClass: 'ui2-tabs__content',
        selector: '.ui2-tabs__content',
        render: (cn) => {
          return (
            <Tabs.Root defaultValue="t1">
              <Tabs.List>
                <Tabs.Trigger value="t1">T</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content className={cn} value="t1">
                C
              </Tabs.Content>
            </Tabs.Root>
          );
        },
      },
    ],
  },

  /* ── Accordion ───────────────────────────────────────────────────── */
  {
    name: 'Accordion',
    cssSlug: 'accordion',
    responsibility: 'Disclosure',
    render: () => {
      return (
        <Accordion.Root defaultValue={['i1']} collapsible>
          <Accordion.Item value="i1">
            <Accordion.Trigger>Section</Accordion.Trigger>
            <Accordion.Content>Content</Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      );
    },
    expectedClasses: [
      'ui2-accordion',
      'ui2-accordion__item',
      'ui2-accordion__trigger',
      'ui2-accordion__content',
    ],
    classNameTargets: [
      {
        name: 'Accordion.Root',
        baseClass: 'ui2-accordion',
        selector: '.ui2-accordion',
        render: (cn) => {
          return (
            <Accordion.Root className={cn} defaultValue={['i1']} collapsible>
              <Accordion.Item value="i1">
                <Accordion.Trigger>S</Accordion.Trigger>
                <Accordion.Content>C</Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          );
        },
      },
      {
        name: 'Accordion.Item',
        baseClass: 'ui2-accordion__item',
        selector: '.ui2-accordion__item',
        render: (cn) => {
          return (
            <Accordion.Root defaultValue={['i1']} collapsible>
              <Accordion.Item className={cn} value="i1">
                <Accordion.Trigger>S</Accordion.Trigger>
                <Accordion.Content>C</Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          );
        },
      },
      {
        name: 'Accordion.Trigger',
        baseClass: 'ui2-accordion__trigger',
        selector: '.ui2-accordion__trigger',
        render: (cn) => {
          return (
            <Accordion.Root defaultValue={['i1']} collapsible>
              <Accordion.Item value="i1">
                <Accordion.Trigger className={cn}>S</Accordion.Trigger>
                <Accordion.Content>C</Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          );
        },
      },
      {
        name: 'Accordion.Content',
        baseClass: 'ui2-accordion__content',
        selector: '.ui2-accordion__content',
        render: (cn) => {
          return (
            <Accordion.Root defaultValue={['i1']} collapsible>
              <Accordion.Item value="i1">
                <Accordion.Trigger>S</Accordion.Trigger>
                <Accordion.Content className={cn}>C</Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          );
        },
      },
    ],
  },

  /* ── Field ───────────────────────────────────────────────────────── */
  {
    name: 'Field',
    cssSlug: 'field',
    responsibility: 'Structure',
    compositionScopes: [
      {
        bemClass: 'ui2-field__label',
        host: 'FieldFrame',
        role: 'label',
        scopeResponsibility: 'Structure',
      },
      {
        bemClass: 'ui2-field__input',
        host: 'FieldFrame',
        role: 'control',
        scopeResponsibility: 'Input',
      },
      {
        bemClass: 'ui2-field__textarea',
        host: 'FieldFrame',
        role: 'control',
        scopeResponsibility: 'Input',
      },
      {
        bemClass: 'ui2-field__helper-text',
        host: 'FieldFrame',
        role: 'description',
        scopeResponsibility: 'Structure',
      },
      {
        bemClass: 'ui2-field__error-text',
        host: 'FieldFrame',
        role: 'validationMessage',
        scopeResponsibility: 'Structure',
      },
    ],
    render: () => {
      return (
        <Field.Root invalid>
          <Field.Label>Label</Field.Label>
          <Field.Input placeholder="test" />
          <Field.Textarea placeholder="bio" />
          <Field.HelperText>Help</Field.HelperText>
          <Field.ErrorText>Error</Field.ErrorText>
        </Field.Root>
      );
    },
    expectedClasses: [
      'ui2-field',
      'ui2-field__label',
      'ui2-field__input',
      'ui2-field__textarea',
      'ui2-field__helper-text',
      'ui2-field__error-text',
    ],
    classNameTargets: [
      {
        name: 'Field.Root',
        baseClass: 'ui2-field',
        selector: '.ui2-field',
        render: (cn) => {
          return (
            <Field.Root className={cn}>
              <Field.Label>L</Field.Label>
              <Field.Input />
            </Field.Root>
          );
        },
      },
      {
        name: 'Field.Input',
        baseClass: 'ui2-field__input',
        selector: '.ui2-field__input',
        render: (cn) => {
          return (
            <Field.Root>
              <Field.Label>L</Field.Label>
              <Field.Input className={cn} />
            </Field.Root>
          );
        },
      },
      {
        name: 'Field.HelperText',
        baseClass: 'ui2-field__helper-text',
        selector: '.ui2-field__helper-text',
        render: (cn) => {
          return (
            <Field.Root>
              <Field.Label>L</Field.Label>
              <Field.Input />
              <Field.HelperText className={cn}>H</Field.HelperText>
            </Field.Root>
          );
        },
      },
      {
        name: 'Field.Textarea',
        baseClass: 'ui2-field__textarea',
        selector: '.ui2-field__textarea',
        render: (cn) => {
          return (
            <Field.Root>
              <Field.Label>L</Field.Label>
              <Field.Textarea className={cn} />
            </Field.Root>
          );
        },
      },
      {
        name: 'Field.ErrorText',
        baseClass: 'ui2-field__error-text',
        selector: '.ui2-field__error-text',
        render: (cn) => {
          return (
            <Field.Root invalid>
              <Field.Label>L</Field.Label>
              <Field.Input />
              <Field.ErrorText className={cn}>E</Field.ErrorText>
            </Field.Root>
          );
        },
      },
    ],
  },

  /* ── Dialog ──────────────────────────────────────────────────────── */
  {
    name: 'Dialog',
    cssSlug: 'dialog',
    responsibility: 'Overlay',
    compositionScopes: [
      {
        bemClass: 'ui2-dialog__title',
        host: 'SurfaceFrame',
        role: 'heading',
        scopeResponsibility: 'Structure',
      },
      {
        bemClass: 'ui2-dialog__description',
        host: 'SurfaceFrame',
        role: 'body',
        scopeResponsibility: 'Structure',
      },
      {
        bemClass: 'ui2-dialog__body',
        host: 'SurfaceFrame',
        role: 'body',
        scopeResponsibility: 'Structure',
      },
      {
        bemClass: 'ui2-dialog__footer',
        host: 'SurfaceFrame',
        role: 'actions',
        scopeResponsibility: 'Action',
      },
    ],
    render: () => {
      return (
        <Dialog.Root open>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Content title="Title" description="Desc">
            <Dialog.Body>Body</Dialog.Body>
            <Dialog.Footer>
              <button>Save</button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      );
    },
    expectedClasses: [
      'ui2-dialog__backdrop',
      'ui2-dialog__trigger',
      'ui2-dialog__content',
      'ui2-dialog__title',
      'ui2-dialog__description',
      'ui2-dialog__close-trigger',
      'ui2-dialog__body',
      'ui2-dialog__footer',
    ],
    classNameTargets: [
      {
        name: 'Dialog.Content',
        baseClass: 'ui2-dialog__content',
        selector: '.ui2-dialog__content',
        render: (cn) => {
          return (
            <Dialog.Root open>
              <Dialog.Content className={cn} title="T">
                B
              </Dialog.Content>
            </Dialog.Root>
          );
        },
      },
      {
        name: 'Dialog.Body',
        baseClass: 'ui2-dialog__body',
        selector: '.ui2-dialog__body',
        render: (cn) => {
          return (
            <Dialog.Root open>
              <Dialog.Content title="T">
                <Dialog.Body className={cn}>B</Dialog.Body>
              </Dialog.Content>
            </Dialog.Root>
          );
        },
      },
      {
        name: 'Dialog.Footer',
        baseClass: 'ui2-dialog__footer',
        selector: '.ui2-dialog__footer',
        render: (cn) => {
          return (
            <Dialog.Root open>
              <Dialog.Content title="T">
                <Dialog.Footer className={cn}>
                  <button>OK</button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Root>
          );
        },
      },
    ],
  },

  /* ── Tooltip ─────────────────────────────────────────────────────── */
  {
    name: 'Tooltip',
    cssSlug: 'tooltip',
    responsibility: 'Overlay',
    render: () => {
      return (
        <Tooltip content="Tip" open>
          <button>Hover</button>
        </Tooltip>
      );
    },
    expectedClasses: ['ui2-tooltip__content'],
    classNameTargets: [
      {
        name: 'Tooltip',
        baseClass: 'ui2-tooltip__content',
        selector: '.ui2-tooltip__content',
        render: (cn) => {
          return (
            <Tooltip content="Tip" open className={cn}>
              <button>Hover</button>
            </Tooltip>
          );
        },
      },
    ],
  },
];
