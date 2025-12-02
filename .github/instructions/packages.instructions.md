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

**MANDATORY**: Coverage must NEVER decrease. For **EVERY** code change, you MUST:

1. Create adequate tests for the new/modified code
2. Run tests with coverage: `pnpm run test`
3. Check current coverage percentages in the output
4. **ALWAYS update `jest.config.ts` with new coverage values** (see section 3.2)

### 3.2 Updating Coverage Threshold

**MANDATORY FOR ALL CODE CHANGES**: After creating tests and checking current coverage:

1. Open the file `packages/PACKAGE_NAME/tests/unit/jest.config.ts`
2. Locate the `coverageThreshold.global` property
3. **Update the values** according to the new coverage shown in test output
4. **NEVER decrease** coverage values - only increase or maintain
5. Set values slightly below (0.01-0.1% lower) current coverage to allow for small variations

Configuration example:

```typescript
coverageThreshold: {
  global: {
    statements: 87.35,  // MUST update if current coverage is different
    branches: 73.83,    // MUST update if current coverage is different
    lines: 87.25,       // MUST update if current coverage is different
    functions: 87.77,   // MUST update if current coverage is different
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

### 4.4 Document Components with JSDoc

**MANDATORY for React components**: All React components must be documented using JSDoc comments. This documentation will be displayed in Storybook, helping users understand how to use the components.

````typescript
// ✅ CORRECT: Comprehensive JSDoc documentation
/**
 * Props for the TooltipIcon component.
 */
export interface TooltipIconProps {
  /**
   * The icon to display. Can be a string identifier or an icon object from @ttoss/react-icons.
   */
  icon: IconType;
  /**
   * Optional click handler for the icon.
   */
  onClick?: () => void;
  /**
   * Optional tooltip text to display when hovering over the icon.
   */
  tooltip?: string;
  /**
   * Visual variant for both the text wrapper and tooltip.
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * TooltipIcon component renders an icon with an optional tooltip.
 *
 * This component is useful for displaying icons with explanatory tooltips,
 * especially in contexts where space is limited or additional information
 * should be revealed on hover.
 *
 * @example
 * ```tsx
 * <TooltipIcon
 *   icon="info-circle"
 *   tooltip="Additional information"
 *   variant="info"
 * />
 * ```
 *
 * @example
 * ```tsx
 * <TooltipIcon
 *   icon="warning-alt"
 *   tooltip="Warning message"
 *   variant="warning"
 *   onClick={() => console.log('Clicked')}
 * />
 * ```
 */
export const TooltipIcon = ({
  icon,
  onClick,
  tooltip,
  variant,
}: TooltipIconProps) => {
  // Component implementation
};
````

**JSDoc Requirements**:

- **Component description**: Clear explanation of what the component does and when to use it
- **Props documentation**: Each prop must have a description
- **Default values**: Use `@default` tag to document default prop values
- **Examples**: Include practical usage examples with `@example` tags
- **Type information**: Document complex types inline with props

**Storybook Integration**: JSDoc comments are automatically extracted and displayed in Storybook's documentation panel, making it easier for users to understand component APIs without leaving the visual interface.

## 5. Checklist Before Finalizing

Before considering work complete, verify:

- [ ] All tests pass (`pnpm run test`)
- [ ] All dependent packages tests pass (`pnpm turbo run test --filter=...PACKAGE_NAME` from monorepo root)
- [ ] All dependent packages build successfully (`pnpm turbo run build --filter=...PACKAGE_NAME` from monorepo root)
- [ ] New tests were created for the changes
- [ ] Coverage did not decrease (ideally increased)
- [ ] **`coverageThreshold` was updated in `jest.config.ts`** (MANDATORY for every code change)
- [ ] README was updated with the changes
- [ ] README was completely reviewed
      <<<<<<< HEAD
- [ ] # **Storybook stories created/updated for ALL user-facing components** (run `pnpm storybook` to verify)
- [ ] Storybook stories created/updated if changes are user-facing
- [ ] React components documented with JSDoc (MANDATORY for user-facing components)
  > > > > > > > 93f7eae5fc0cc5b00d44273f7eacd85074307849
- [ ] No commented code or pending TODOs
- [ ] Code follows project standards
- [ ] Linting applied: `pnpm run -w lint` (MANDATORY before finalizing)

<<<<<<< HEAD

## 6. Internationalization (i18n) Pattern

When adding user-facing text or locale-specific values (like number formats, date formats, separators):

### 6.1 Using defineMessages

=======

## 6. Workflow Example

```bash
# 1. Make code changes
# ... edit files ...

# 2. Run tests
cd packages/PACKAGE_NAME
pnpm run test

# 3. Create tests for new code
# ... create test files in tests/unit/ ...

# 4. Run tests again and check coverage
pnpm run test

# 5. MANDATORY: Update coverage threshold in jest.config.ts
# Look at the test output for current coverage percentages
# Then edit tests/unit/jest.config.ts and update coverageThreshold values
# Example: if output shows "statements: 87.45%", update to 87.35 (slightly lower)
# ... edit tests/unit/jest.config.ts ...

# 6. Validate dependent packages (from monorepo root)
cd /path/to/monorepo/root
pnpm turbo run test --filter=...PACKAGE_NAME

# 7. Validate build (from monorepo root)
pnpm turbo run build --filter=...PACKAGE_NAME

# 8. Update README
# ... edit README.md ...

# 9. Final validation
cd packages/PACKAGE_NAME
pnpm run test
```

## 7. Internationalization (i18n) Pattern

When adding user-facing text or locale-specific values (like number formats, date formats, separators):

### 7.1 Using defineMessages

> > > > > > > 93f7eae5fc0cc5b00d44273f7eacd85074307849

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

<<<<<<< HEAD

### 6.2 i18n Workflow

=======

### 7.2 i18n Workflow

> > > > > > > 93f7eae5fc0cc5b00d44273f7eacd85074307849

1. **Define messages in English**: Always use English as the default message
2. **Add clear descriptions**: Help translators understand the context
3. **Run i18n-cli locally**: Execute `pnpm run i18n` in your package directory to extract messages
4. **Update all packages**: After modifying i18n messages, run `pnpm turbo run i18n --cache local:` from the monorepo root to update i18n in all other packages
5. **Translate in apps**: Each application can define locale-specific values in their i18n files

<<<<<<< HEAD

### 6.3 When to Use i18n

# Use `defineMessages` for user-facing text, labels, error messages, validations, and locale-specific formatting values. Do NOT use for internal code constants or technical identifiers.

### 7.3 When to Use i18n

Use `defineMessages` for:

- User-facing text and labels
- Error messages and validations
- Locale-specific formatting values (decimal separators, date formats, etc.)
- Any string that might need translation or localization

Do NOT use for:

- Internal code constants
- API keys or technical identifiers
- Code comments (use English directly)

### 7.4 Example: Locale-Specific Formatting

```typescript
// ✅ CORRECT: Using defineMessages for locale-specific values
const messages = defineMessages({
  decimalSeparator: {
    defaultMessage: '.',
    description: 'Decimal separator (e.g., "." for 1.23 or "," for 1,23)',
  },
});

const { intl } = useI18n();
const separator = intl.formatMessage(messages.decimalSeparator);

// ❌ INCORRECT: Hardcoding locale-specific values
const separator = ','; // Don't hardcode locale-specific values
```

> > > > > > > 93f7eae5fc0cc5b00d44273f7eacd85074307849

---

**Remember**: Quality is more important than speed. Well-written tests and clear documentation save time in the future.
