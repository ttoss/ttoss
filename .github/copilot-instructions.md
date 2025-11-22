# GitHub Copilot Instructions for ttoss Repository

This file provides repository-wide guidance for GitHub Copilot coding agent when working on the ttoss monorepo.

## Repository Overview

ttoss (Terezinha Tech Operations) is a TypeScript/JavaScript monorepo containing modular solutions for product development teams. The repository uses:

- **Package Manager**: pnpm (see package.json for exact version)
- **Build System**: Turbo for monorepo orchestration
- **Language**: TypeScript (see package.json for exact version)
- **Node Version**: See engines.node in package.json
- **Primary Framework**: React (for UI packages)
- **Testing**: Jest for unit tests
- **Documentation**: Docusaurus
- **Storybook**: For component development and documentation

## Repository Structure

```
ttoss/
├── .github/
│   └── instructions/        # Path-specific instruction files
│       ├── docs.instructions.md      # For documentation work
│       └── packages.instructions.md  # For package development
├── packages/                # All packages in the monorepo
├── docs/                    # Documentation and website
├── challenge/              # Challenge projects
└── terezinha-farm/        # Farm-related projects
```

## Path-Specific Instructions

The repository has detailed instruction files for different parts of the codebase:

1. **Documentation Work** (`**/*.md`, `**/*.mdx`): See `.github/instructions/docs.instructions.md`
   - Applies to all markdown and MDX files
   - Contains comprehensive documentation writing standards
   - Emphasizes concise, scannable, interconnected content

2. **Package Development** (`**/packages/**/*`): See `.github/instructions/packages.instructions.md`
   - Applies to all files in the packages directory
   - Covers testing, coverage, build validation, and i18n workflows
   - Contains mandatory validation steps for package changes

**IMPORTANT**: Always check if path-specific instructions exist before making changes. These files contain critical guidelines that must be followed.

## Getting Started Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Build i18n languages (required before first run)
pnpm i18n

# Run Storybook (hello world of this repo)
pnpm storybook
```

### Common Development Commands
```bash
# Run tests across monorepo
pnpm turbo run test

# Run tests for specific package and dependents
pnpm turbo run test --filter=...PACKAGE_NAME

# Build all packages
pnpm turbo run build

# Build specific package and dependents
pnpm turbo run build --filter=...PACKAGE_NAME

# Run linter
pnpm lint

# Update i18n across all packages
pnpm i18n
```

### Package-Specific Commands
```bash
# From package directory (packages/PACKAGE_NAME/)
pnpm run test      # Run tests
pnpm run build     # Build the package
pnpm run i18n      # Extract i18n messages
```

## Code Style and Standards

### TypeScript
- Use TypeScript 5.7.x features
- Strict type checking is enabled
- Prefer type safety over `any`
- Use ESLint configuration from `@ttoss/eslint-config`

### Package Exports
- Packages use the `exports` field in package.json
- Entry points typically point to `src` folder (not dist)
- No need to build packages before importing them locally

### Internationalization (i18n)
- Use `defineMessages` from `@ttoss/react-i18n` for all user-facing text
- Always provide English as the default message
- Include clear descriptions for translators
- Run `pnpm i18n` after adding/modifying messages

### Testing
- Unit tests go in `packages/PACKAGE_NAME/tests/unit/`
- Coverage must never decrease
- Update `coverageThreshold` in `jest.config.ts` when adding tests
- Test patterns should match existing tests in the repository

## Task Assignment Boundaries

### ✅ Appropriate Tasks for Copilot Agent

- **Bug fixes** in existing code with clear reproduction steps
- **Test coverage improvement** for specific modules
- **Documentation updates** following the docs.instructions.md guidelines
- **Package development** following the packages.instructions.md guidelines
- **Adding new features** to existing packages with clear requirements
- **Refactoring** small, well-scoped sections of code
- **i18n message extraction** and updates
- **Dependency updates** (after checking for security issues)

### ❌ Tasks to Avoid

- **Removing working code** unless fixing a security vulnerability
- **Fixing unrelated bugs** or broken tests
- **Large-scale refactoring** across multiple packages
- **Changing test infrastructure** unless necessary for the issue
- **Modifying build configuration** without clear justification
- **Changing .github/agents/** files (these contain instructions for other agents)
- **Force pushing** or rebasing (not available in this environment)
- **Committing secrets** or sensitive information

## Workflow Guidelines

### Before Making Changes
1. **Understand the issue** completely before starting
2. **Explore the repository** to understand existing code
3. **Check for path-specific instructions** that apply to your changes
4. **Run existing tests** to understand baseline state
5. **Read related code** to understand context and patterns

### While Making Changes
1. **Make minimal modifications** - surgical, precise changes only
2. **Follow existing patterns** in the codebase
3. **Test incrementally** after each small change
4. **Use ecosystem tools** (npm, scaffolding, linters) to automate work
5. **Report progress frequently** using the report_progress tool

### After Making Changes
1. **Run relevant tests** to validate changes
2. **Run dependent package tests** if you modified a package
3. **Validate builds** for affected packages
4. **Update documentation** if functionality changed
5. **Check coverage** hasn't decreased
6. **Run code review** before finalizing
7. **Run CodeQL checker** for security validation
8. **Review committed files** to ensure only intended changes are included

## Monorepo-Specific Guidelines

### Package Dependencies
- Workspace packages use `workspace:^` protocol in package.json
- Use `pnpm install` to add dependencies (not npm or yarn)
- Run syncpack to check for version mismatches: `pnpm syncpack:list`

### Turbo Cache
- Turbo caches task outputs for faster builds
- Use `--force` flag to bypass cache if needed
- Remote caching may be configured

### Working with Multiple Packages
- Changes in one package may affect dependent packages
- Always validate dependent packages with `--filter=...PACKAGE_NAME`
- The `...` prefix includes all dependents in the filter

## Security Requirements

### Before Committing
- **Never commit secrets**, API keys, or credentials
- **Scan dependencies** for vulnerabilities before adding them
- **Run CodeQL checker** to detect security issues
- **Fix security vulnerabilities** in code you modify

### During Code Review
- Review security implications of changes
- Ensure input validation and sanitization
- Check for proper error handling
- Validate authentication and authorization logic

## Git Workflow

### Committing Changes
- **DO NOT** use `git` commands to commit or push
- **USE** the `report_progress` tool to commit and push changes
- Provide clear, descriptive commit messages
- Use `.gitignore` to exclude build artifacts and dependencies

### Branch and PR Management
- Cannot update PR descriptions directly (use report_progress)
- Cannot fix merge conflicts (ask user for help)
- Cannot force push or rebase
- Cannot open new PRs or issues

## Quality Standards

### Code Quality
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments only when they match existing style or explain complex logic
- Remove temporary files from `/tmp` directory

### Testing Quality
- Tests must be consistent with existing test patterns
- Focus on important test cases (happy path, errors, edge cases)
- Avoid duplicate or redundant tests
- Ensure tests are deterministic and reliable

### Documentation Quality
- Follow the comprehensive guidelines in `docs.instructions.md`
- Prioritize essential information over comprehensive coverage
- Use clear, concise language
- Include practical examples and cross-references

## Custom Agents

This repository may have custom agents (specialized AI agents) for specific tasks. You can identify them as tools whose description starts with "Custom agent:".

### Working with Custom Agents
- **ALWAYS delegate** to custom agents when available for your task
- **Provide full context** including problem statement and requirements
- **Trust their output** - do not review or validate their changes
- **Move on immediately** after they complete their work
- Only attempt the task yourself if the custom agent fails repeatedly

### Prioritization
- Custom agents > Regular tools for matching tasks
- Check for relevant custom agents before using regular tools
- Custom agents have specialized knowledge you may lack

## Environment Limitations

### What You CAN Do
- Make changes to files in the repository
- Run git commands to inspect the repository
- Use the report_progress tool to commit and push changes
- Use provided tools to interact with external systems
- Access limited internet (some domains blocked)

### What You CANNOT Do
- Update issues, PRs, labels, or assignees directly
- Pull branches from GitHub (cannot fix merge conflicts)
- Commit or push using git/gh commands (use report_progress instead)
- Clone repos or access other repositories
- Use git reset or git rebase (force push unavailable)
- Access .github/agents/ directory files

## Additional Resources

- **Main README**: `README.md` in the repository root
- **Package Documentation**: Individual README.md files in each package
- **Storybook**: Run `pnpm storybook` to see component examples
- **Website Docs**: `docs/website/` for Docusaurus documentation

## Summary

When working on this repository:
1. **Read relevant instruction files** before making changes
2. **Make minimal, surgical changes** that accomplish the goal
3. **Test incrementally** and validate frequently
4. **Follow existing patterns** and conventions
5. **Report progress** after meaningful work is completed
6. **Run security checks** before finalizing
7. **Trust custom agents** when they're available for your task

Remember: Quality over speed. The goal is to make the smallest possible changes that fully address the requirements while maintaining the integrity of the codebase.
