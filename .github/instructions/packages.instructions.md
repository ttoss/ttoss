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

### 3.3 How to Interpret Values

- **statements**: Percentage of executed statements
- **branches**: Percentage of tested branches (if/else, switch, etc.)
- **lines**: Percentage of executed lines
- **functions**: Percentage of called functions

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

After updating the README:

1. **Re-read the entire document** from beginning to end
2. Verify that:
   - Information is up to date
   - Examples work correctly
   - There are no obsolete or contradictory information
   - Documentation is clear and objective
3. **Remove** or **update**:
   - Outdated examples
   - References to removed code
   - Instructions that no longer apply
4. **Improve**:
   - Clarity in explanations
   - Section organization
   - Practical and useful examples

### 4.3 Create or Update Storybook Stories

If the change is significant enough to benefit users (new features, UI changes, behavior modifications):

1. Check if a story exists in `docs/storybook/stories/PACKAGE_NAME/`
2. If the package has user-facing components or features:
   - **Create a new story** if demonstrating a new feature
   - **Update existing story** if modifying current behavior
3. Story files should:
   - Follow the naming pattern: `ComponentName.stories.tsx`
   - Include clear examples of the new/modified functionality
   - Show different use cases and variations
   - Include documentation in the story metadata
4. Stories help users:
   - Understand how to use new features
   - See visual examples of components
   - Test interactions in an isolated environment

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
- [ ] Storybook stories created/updated if changes are user-facing
- [ ] No commented code or pending TODOs
- [ ] Code follows project standards

## 6. Workflow Example

```bash
# 1. Make code changes
# ... edit files ...

# 2. Run tests
cd packages/PACKAGE_NAME
pnpm run test

# 3. Create tests for new code
# ... create test files in tests/unit/ ...

# 4. Run tests again
pnpm run test

# 5. Check coverage in output and update jest.config.ts
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

## 7. Important Tips

- **Incremental testing**: Run tests after small changes, not after large blocks of code
- **Focused tests**: Use `jest --watch` during development for quick feedback
- **Local coverage**: Check detailed report at `coverage/lcov-report/index.html`
- **Consistency**: Follow test patterns from other package files
- **Documentation**: If the change is complex, consider adding code comments

## 8. Internationalization (i18n) Pattern

When adding user-facing text or locale-specific values (like number formats, date formats, separators):

### 8.1 Using defineMessages

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

### 8.2 i18n Workflow

1. **Define messages in English**: Always use English as the default message
2. **Add clear descriptions**: Help translators understand the context
3. **Run i18n-cli locally**: Execute `pnpm run i18n` in your package directory to extract messages
4. **Update all packages**: After modifying i18n messages, run `pnpm turbo run i18n -- --no-cache` from the monorepo root to update i18n in all other packages
5. **Translate in apps**: Each application can define locale-specific values in their i18n files

### 8.3 When to Use i18n

Use `defineMessages` for:

- User-facing text and labels
- Error messages and validations
- Locale-specific formatting values (decimal separators, date formats, etc.)
- Any string that might need translation or localization

Do NOT use for:

- Internal code constants
- API keys or technical identifiers
- Code comments (use English directly)

### 8.4 Example: Locale-Specific Formatting

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

---

**Remember**: Quality is more important than speed. Well-written tests and clear documentation save time in the future.
