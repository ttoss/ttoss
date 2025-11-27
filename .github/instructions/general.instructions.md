# General Instructions

## Language Requirements

**MANDATORY**: All content in this repository must be written in English:

- Code (variable names, function names, class names)
- Comments and documentation
- Commit messages
- User-facing messages and strings
- README files and documentation
- Error messages and logs

## Post-Change Validation

After completing any code changes, always run the following command to apply linting rules and ensure code quality:

```bash
pnpm run -w lint
```

This command:

- Applies consistent code formatting across the monorepo
- Identifies and fixes common code quality issues
- Ensures all changes comply with the project's linting standards

**Important**: Always run this command before considering your changes complete.

## Internationalization (i18n) Message Updates

**MANDATORY**: If you make any changes to i18n messages (adding, modifying, or removing `defineMessages` content), run the following command before finishing the task:

```bash
pnpm run -w i18n
```

This command:

- Extracts all i18n messages from the codebase
- Updates the translation files across all packages
- Ensures consistency between source code and translation catalogs

**When to run this command**:

- After adding new `defineMessages` definitions
- After modifying existing message `defaultMessage` or `description` values
- After removing or renaming messages
- After any change to files containing `defineMessages`

**Important**: Failing to run this command after i18n changes will result in outdated translation files and potential runtime issues.

## Reporting Enhancement Opportunities

When working on tasks, if you identify potential improvements that are outside the scope of your current task, create a GitHub issue to track them. This includes:

- Code quality improvements or refactoring opportunities
- Missing or outdated documentation
- Performance optimizations
- Better error handling or validation
- Improvements to instructions or guidelines
- Missing tests or test coverage gaps
- Dependency updates or security fixes

**How to report**: Create a concise GitHub issue with a clear title, description of the enhancement, and why it would be beneficial. Tag it appropriately (e.g., `enhancement`, `documentation`, `refactor`).
