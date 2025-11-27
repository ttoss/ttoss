---
description: This file contains essential guidelines for developing and modifying packages in the ttoss monorepo.
applyTo: **/packages/**/*
---

# Package Development Instructions

This document contains essential guidelines for developing and modifying packages in the ttoss monorepo.

## 1. Continuous Validation with Tests

**MANDATORY**: After each code change, run the package tests to ensure nothing is broken:

```bash
pnpm run test
```

- Execute this command in the package directory (`packages/PACKAGE_NAME/`)
- Wait for test completion before proceeding with new changes
- Fix any detected failures immediately

### 1.1 Validate Dependent Packages

After making changes to a package, **MANDATORY**: validate that all packages that depend on the modified package still work correctly:

```bash
pnpm turbo run test --filter=...PACKAGE_NAME
```

- Run this command from the **monorepo root** directory
- The `...PACKAGE_NAME` filter runs tests for the package AND all packages that depend on it
- This ensures your changes don't break any dependent packages
- Example: `pnpm turbo run test --filter=...@ttoss/forms` will test `@ttoss/forms` and all packages that use it
- Fix any failures in dependent packages before proceeding

### 1.2 Validate Build

After all tests pass, **MANDATORY**: validate that the package and its dependents build successfully:

```bash
pnpm turbo run build --filter=...PACKAGE_NAME
```

- Run this command from the **monorepo root** directory
- This ensures your changes don't break the build process of the package or dependent packages
- Fix any build errors before proceeding
- Build validation catches TypeScript errors, missing exports, and other compilation issues

## 2. Creating Tests

When adding or modifying functionality:

### 2.1 Create Relevant Tests

- **Focus on important tests**: Write tests that validate critical behaviors and main use cases
- **Avoid redundancy**: Do not create duplicate tests or tests that validate the same thing in different ways
- **Case coverage**: Include tests for:
  - Success cases (happy path)
  - Error cases and validations
  - Relevant edge cases
  - Fixed bug regressions

### 2.2 Test Location

- Unit tests go in `packages/PACKAGE_NAME/tests/unit/`
- Use the same directory structure as the source code when appropriate

## 3. Coverage

### 3.1 Golden Rule

**Coverage must NEVER decrease**. When adding new code:

1. Create adequate tests for the new code
2. Run tests with coverage: `pnpm run test`
3. Check current coverage percentages in the output

### 3.2 Updating Coverage Threshold

After creating tests and checking current coverage:

1. Open the file `packages/PACKAGE_NAME/tests/unit/jest.config.ts`
2. Locate the `coverageThreshold.global` property
3. **Increase** the values according to the new coverage (never decrease)
4. Values should be slightly below current coverage to allow for small variations

Configuration example:

```typescript
coverageThreshold: {
  global: {
    statements: 87.35,  // Increase this value if current coverage is higher
    branches: 73.83,    // Increase this value if current coverage is higher
    lines: 87.25,       // Increase this value if current coverage is higher
    functions: 87.77,   // Increase this value if current coverage is higher
  },
}
```

## 4. README Documentation

### 4.1 Update with Relevant Changes

Whenever you modify package functionality:

1. Open the file `packages/PACKAGE_NAME/README.md`
2. Update relevant sections:
   - **API Changes**: New functions, components, or parameters
   - **Breaking Changes**: Changes that break compatibility
   - **Examples**: Add or update usage examples
   - **Configuration**: New configuration options

### 4.2 Complete README Review

After updating the README, re-read the entire document to verify information is current, examples work correctly, and there are no obsolete or contradictory sections.

### 4.3 Create or Update Storybook Stories

**MANDATORY**: When adding or modifying user-facing components, forms, UI elements, or any visual functionality, you MUST create or update Storybook stories.

#### When Stories Are Required

Stories are **required** for:

- New React components
- New form fields or input components
- UI changes that affect visual appearance or behavior
- New hooks that have visual/interactive demonstrations
- Any feature that users will interact with visually

Stories are **optional** for:

- Internal utilities with no visual output
- Backend-only code
- Pure type definitions
- Configuration changes

#### How to Create Stories

1. **Check for existing stories** in `docs/storybook/stories/PACKAGE_NAME/`
2. **Create the story file**:
   - Location: `docs/storybook/stories/PACKAGE_NAME/ComponentName.stories.tsx`
   - Follow existing story patterns in the storybook directory
3. **Story requirements**:
   - Include a **default story** showing basic usage
   - Include **variant stories** for different props/states
   - Include **interactive examples** when applicable
   - Add **documentation** in the story metadata (title, description)
4. **Test your stories**:
   - Run `pnpm storybook` from monorepo root to verify stories render correctly
   - Ensure all interactive elements work as expected

#### Story File Template

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from '@ttoss/package-name';

const meta: Meta<typeof ComponentName> = {
  title: 'PackageName/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // default props
  },
};

export const Variant: Story = {
  args: {
    // variant props
  },
};
```

#### Why Stories Matter

- **Documentation**: Stories serve as living documentation for components
- **Visual testing**: Catch visual regressions before they reach production
- **Developer experience**: Help other developers understand how to use components
- **Design review**: Enable designers to review component implementations

## 5. Checklist Before Finalizing

Before considering work complete, verify:

- [ ] All tests pass (`pnpm run test`)
- [ ] All dependent packages tests pass (`pnpm turbo run test --filter=...PACKAGE_NAME` from monorepo root)
- [ ] All dependent packages build successfully (`pnpm turbo run build --filter=...PACKAGE_NAME` from monorepo root)
- [ ] New tests were created for the changes
- [ ] Coverage did not decrease (ideally increased)
- [ ] `coverageThreshold` was updated in `jest.config.ts`
- [ ] README was updated with the changes
- [ ] README was completely reviewed
- [ ] **Storybook stories created/updated for ALL user-facing components** (run `pnpm storybook` to verify)
- [ ] No commented code or pending TODOs
- [ ] Code follows project standards

## 6. Internationalization (i18n) Pattern

When adding user-facing text or locale-specific values (like number formats, date formats, separators):

### 6.1 Using defineMessages

**MANDATORY**: Use `defineMessages` from `@ttoss/react-i18n` for all translatable content:

```typescript
import { defineMessages, useI18n } from '@ttoss/react-i18n';

const messages = defineMessages({
  myMessage: {
    defaultMessage: 'Default text in English',
    description: 'Clear description for translators explaining the context',
  },
  decimalSeparator: {
    defaultMessage: '.',
    description: 'Decimal separator for number formatting',
  },
});

// In your component
const { intl } = useI18n();
const text = intl.formatMessage(messages.myMessage);
const separator = intl.formatMessage(messages.decimalSeparator);
```

### 6.2 i18n Workflow

1. **Define messages in English**: Always use English as the default message
2. **Add clear descriptions**: Help translators understand the context
3. **Run i18n-cli locally**: Execute `pnpm run i18n` in your package directory to extract messages
4. **Update all packages**: After modifying i18n messages, run `pnpm turbo run i18n --cache local:` from the monorepo root to update i18n in all other packages
5. **Translate in apps**: Each application can define locale-specific values in their i18n files

### 6.3 When to Use i18n

Use `defineMessages` for user-facing text, labels, error messages, validations, and locale-specific formatting values. Do NOT use for internal code constants or technical identifiers.

---

**Remember**: Quality is more important than speed. Well-written tests and clear documentation save time in the future.
