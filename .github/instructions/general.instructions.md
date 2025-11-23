# General Instructions

## React Packages Architecture

ttoss uses a unique architecture pattern for React packages where **applications configure once at the root level**, and all packages automatically inherit styling, translations, and notification behavior through React Context.

**See**: `.github/instructions/react-packages-architecture.instructions.md` for complete details on:

- Foundation Packages: Theme/UI, i18n, Notifications, Forms, Icons, and more
- How packages consume these contexts instead of props
- Guidelines for creating context-aware components
- Real-world examples from `@ttoss/react-auth-core`

**Key principle**: When developing React packages, NEVER require style, theme, translation, or notification props. Always use the foundation packages (`@ttoss/ui`, `@ttoss/react-i18n`, `@ttoss/react-notifications`, etc.) and their context hooks.

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
