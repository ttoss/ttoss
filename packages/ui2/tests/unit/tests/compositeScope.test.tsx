/**
 * Composite Scope contract — runtime host-presence guard.
 *
 * Every composite sub-part (e.g. `DialogHeading`, `WizardStep`,
 * `AccordionItem`, `TextFieldLabel`, `MenuItem`, `FormSubmit`) MUST throw a
 * clear error when rendered standalone (outside its declared host). The
 * standardised mechanism is `createCompositeScope` in
 * `src/composites/scope.ts`.
 *
 * This suite is the runtime gate for that contract:
 *   1. Each sub-part renders standalone → throws with a message naming the
 *      sub-part and the host.
 *   2. Each sub-part rendered inside its host does NOT throw (smoke check).
 */

import { render } from '@testing-library/react';
import type * as React from 'react';

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeading,
  Form,
  FormActions,
  FormSubmit,
  Menu,
  MenuItem,
  MenuTrigger,
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
  Wizard,
  WizardNavigation,
  WizardStep,
  WizardSummary,
} from '../../../src';
import { Button } from '../../../src';
import {
  createCompositeScope,
  createPresenceScope,
} from '../../../src/composites/scope';

// React logs the thrown error to console.error when an Error Boundary would
// normally catch it. Silence it to keep test output readable; we still
// assert on the thrown message via toThrow.
let errorSpy: jest.SpyInstance;
beforeAll(() => {
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  errorSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// 1. Standalone rendering throws — one row per sub-part
// ---------------------------------------------------------------------------

describe('contract: composite sub-parts throw outside host', () => {
  test.each<[string, string, () => React.ReactElement]>([
    [
      'DialogHeading',
      'Dialog',
      () => {
        return <DialogHeading>x</DialogHeading>;
      },
    ],
    [
      'DialogBody',
      'Dialog',
      () => {
        return <DialogBody>x</DialogBody>;
      },
    ],
    [
      'DialogActions',
      'Dialog',
      () => {
        return (
          <DialogActions>
            <Button>x</Button>
          </DialogActions>
        );
      },
    ],
    [
      'WizardStep',
      'Wizard',
      () => {
        return <WizardStep>x</WizardStep>;
      },
    ],
    [
      'WizardSummary',
      'Wizard',
      () => {
        return <WizardSummary>x</WizardSummary>;
      },
    ],
    [
      'WizardNavigation',
      'Wizard',
      () => {
        return <WizardNavigation />;
      },
    ],
    [
      'AccordionItem',
      'Accordion',
      () => {
        return <AccordionItem>x</AccordionItem>;
      },
    ],
    [
      'AccordionTrigger',
      'Accordion',
      () => {
        return <AccordionTrigger>x</AccordionTrigger>;
      },
    ],
    [
      'AccordionPanel',
      'Accordion',
      () => {
        return <AccordionPanel>x</AccordionPanel>;
      },
    ],
    [
      'TextFieldLabel',
      'TextField',
      () => {
        return <TextFieldLabel>x</TextFieldLabel>;
      },
    ],
    [
      'TextFieldControl',
      'TextField',
      () => {
        return <TextFieldControl />;
      },
    ],
    [
      'TextFieldDescription',
      'TextField',
      () => {
        return <TextFieldDescription>x</TextFieldDescription>;
      },
    ],
    [
      'TextFieldError',
      'TextField',
      () => {
        return <TextFieldError>x</TextFieldError>;
      },
    ],
    [
      'MenuItem',
      'Menu',
      () => {
        return <MenuItem>x</MenuItem>;
      },
    ],
    [
      'FormActions',
      'Form',
      () => {
        return (
          <FormActions>
            <Button>x</Button>
          </FormActions>
        );
      },
    ],
    [
      'FormSubmit',
      'Form',
      () => {
        return <FormSubmit>x</FormSubmit>;
      },
    ],
  ])('<%s> rendered outside <%s> throws', (subPart, host, factory) => {
    expect(() => {
      return render(factory());
    }).toThrow(new RegExp(`<${subPart}> must be rendered inside <${host}>\\.`));
  });
});

// ---------------------------------------------------------------------------
// 2. Smoke: rendering inside the host does NOT throw
// ---------------------------------------------------------------------------

describe('contract: composite sub-parts render inside host', () => {
  test('Dialog scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <Dialog isOpen onOpenChange={() => {}}>
          <DialogHeading>title</DialogHeading>
          <DialogBody>body</DialogBody>
          <DialogActions>
            <Button>ok</Button>
          </DialogActions>
        </Dialog>
      );
    }).not.toThrow();
  });

  test('Wizard scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <Wizard currentStep={0} totalSteps={2}>
          <WizardStep>step</WizardStep>
          <WizardStep>step 2</WizardStep>
          <WizardSummary>done</WizardSummary>
          <WizardNavigation />
        </Wizard>
      );
    }).not.toThrow();
  });

  test('Accordion scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <Accordion>
          <AccordionItem>
            <AccordionTrigger>label</AccordionTrigger>
            <AccordionPanel>panel</AccordionPanel>
          </AccordionItem>
        </Accordion>
      );
    }).not.toThrow();
  });

  test('TextField scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <TextField>
          <TextFieldLabel>label</TextFieldLabel>
          <TextFieldControl />
          <TextFieldDescription>desc</TextFieldDescription>
          <TextFieldError>err</TextFieldError>
        </TextField>
      );
    }).not.toThrow();
  });

  test('Menu scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <MenuTrigger>
          <Button>trigger</Button>
          <Menu>
            <MenuItem>item</MenuItem>
          </Menu>
        </MenuTrigger>
      );
    }).not.toThrow();
  });

  test('Form scope satisfies sub-parts', () => {
    expect(() => {
      return render(
        <Form>
          <FormActions>
            <FormSubmit>submit</FormSubmit>
          </FormActions>
        </Form>
      );
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 3. Builder-level contract — `createPresenceScope` vs `createCompositeScope`
//
// The two builders codify the "presence-only vs stateful scope" choice
// (CONTRIBUTING §2.3): a host with no value to share picks `createPresenceScope`
// (Provider takes no `value` prop); a host that publishes typed state picks
// `createCompositeScope<T>` (Provider requires a `value` of type `T`).
// Both builders share the same throw contract.
// ---------------------------------------------------------------------------

describe('createPresenceScope', () => {
  test('Provider does not require a `value` prop, sub-part renders inside', () => {
    const scope = createPresenceScope('Banner');
    const Sub = () => {
      scope.use('BannerSubPart');
      return <span data-testid="sub" />;
    };

    expect(() => {
      return render(
        <scope.Provider>
          <Sub />
        </scope.Provider>
      );
    }).not.toThrow();
  });

  test('sub-part rendered outside throws naming both sub-part and host', () => {
    const scope = createPresenceScope('Banner');
    const Sub = () => {
      scope.use('BannerSubPart');
      return null;
    };

    expect(() => {
      return render(<Sub />);
    }).toThrow(/<BannerSubPart> must be rendered inside <Banner>\./);
  });
});

describe('createCompositeScope', () => {
  test('Provider publishes typed state, sub-part reads it via use()', () => {
    interface Ctx {
      level: 'low' | 'high';
    }
    const scope = createCompositeScope<Ctx>('Gauge');
    const Sub = () => {
      const ctx = scope.use('GaugeSubPart');
      return <span data-testid="sub">{ctx.level}</span>;
    };

    const { getByTestId } = render(
      <scope.Provider value={{ level: 'high' }}>
        <Sub />
      </scope.Provider>
    );
    expect(getByTestId('sub').textContent).toBe('high');
  });

  test('sub-part rendered outside throws naming both sub-part and host', () => {
    const scope = createCompositeScope<{ x: number }>('Gauge');
    const Sub = () => {
      scope.use('GaugeSubPart');
      return null;
    };

    expect(() => {
      return render(<Sub />);
    }).toThrow(/<GaugeSubPart> must be rendered inside <Gauge>\./);
  });
});
