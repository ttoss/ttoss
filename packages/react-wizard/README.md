# @ttoss/react-wizard

A React wizard component for guiding users through multi-step flows with configurable step list layouts.

## Installation

```bash
pnpm add @ttoss/react-wizard
```

## Usage

```tsx
import { Wizard } from '@ttoss/react-wizard';

const steps = [
  {
    title: 'Personal Info',
    description: 'Enter your details',
    content: <PersonalInfoForm />,
    onNext: () => validatePersonalInfo(),
  },
  {
    title: 'Address',
    content: <AddressForm />,
  },
  {
    title: 'Review',
    content: <ReviewStep />,
  },
];

const MyWizard = () => {
  return (
    <Wizard
      steps={steps}
      layout="top"
      onComplete={() => console.log('Done!')}
      onCancel={() => console.log('Cancelled')}
    />
  );
};
```

## Props

| Prop             | Type                                      | Default | Description                                            |
| ---------------- | ----------------------------------------- | ------- | ------------------------------------------------------ |
| `steps`          | `WizardStep[]`                            | —       | Array of step definitions.                             |
| `layout`         | `'top' \| 'right' \| 'bottom' \| 'left'`  | `'top'` | Position of the step list relative to content.         |
| `onComplete`     | `() => void`                              | —       | Called when the user finishes the last step.           |
| `onCancel`       | `() => void`                              | —       | Called on cancel. If omitted, cancel button is hidden. |
| `onStepChange`   | `(params: { stepIndex: number }) => void` | —       | Called when the active step changes.                   |
| `initialStep`    | `number`                                  | `0`     | The initially active step index.                       |
| `allowStepClick` | `boolean`                                 | `true`  | Allow clicking completed steps to navigate back.       |

## WizardStep

| Property      | Type                                | Description                                               |
| ------------- | ----------------------------------- | --------------------------------------------------------- |
| `title`       | `string`                            | Title displayed in the step list.                         |
| `description` | `string`                            | Optional description below the title.                     |
| `content`     | `ReactNode`                         | Content rendered when the step is active.                 |
| `onNext`      | `() => boolean \| Promise<boolean>` | Validation callback. Return `false` to prevent advancing. |

## Layouts

The `layout` prop controls where the step list appears:

- **`top`** — Horizontal step list above the content (default).
- **`bottom`** — Horizontal step list below the content.
- **`left`** — Vertical step list on the left side.
- **`right`** — Vertical step list on the right side.

## useWizard Hook

Access the wizard context from within step content:

```tsx
import { useWizard } from '@ttoss/react-wizard';

const StepContent = () => {
  const { currentStep, totalSteps, goToNext, goToPrevious, isLastStep } =
    useWizard();

  return (
    <div>
      Step {currentStep + 1} of {totalSteps}
    </div>
  );
};
```
