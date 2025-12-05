---
description: Instructions for testing, validating, and updating the Carlin package
applyTo: '**/packages/carlin/**/*'
---

# Carlin Package Development Instructions

## Documentation Requirements

When making changes to Carlin code, you **MUST** update the corresponding documentation in `docs/website/docs/carlin/`. Ensure that:

- New features are documented with examples
- Changed behavior is reflected in the documentation
- API changes include updated usage examples

## Testing Requirements

### Writing Tests

For every code change, you **MUST** write or update the corresponding test:

- Tests should be placed in the `tests/` directory, not in `src/`
- If you find test files in the `src/` directory, move them to `tests/`
- Test file structure should mirror the source code structure
- Each test should cover the specific functionality being added or modified

### CLI Testing

When adding or modifying CLI options or commands, you **MUST** create tests in `tests/unit/cli.test.ts`:

- Test that new options are parsed correctly with default values
- Test that custom values are properly passed through the command chain
- Verify that the option values reach the appropriate handler functions
- Use mocks to prevent actual deployments or side effects during testing

Example:

```typescript
describe('my-option option', () => {
  test('should have default value', async () => {
    const argv = await parseCli('deploy', {});
    expect(argv.myOption).toEqual('default-value');
  });

  test('should accept custom value', async () => {
    const argv = await parseCli('deploy', { myOption: 'custom-value' });
    expect(argv.myOption).toEqual('custom-value');
  });
});
```

### Code Coverage

Code coverage **MUST** always increase or remain the same after changes:

- Never commit changes that decrease the overall coverage percentage
- Ensure new code is adequately tested to maintain or improve coverage
- Run coverage checks before submitting changes

## File Organization

- Source code: `packages/carlin/src/`
- Tests: `packages/carlin/tests/` (NOT in `src/`)
- Documentation: `docs/website/docs/carlin/`

## Code Style Requirements

### Function Parameters

All functions **MUST** use object destructuring for parameters instead of individual parameters:

```typescript
// ✅ CORRECT: Use object parameters
function myFunction({
  param1,
  param2,
  param3,
}: {
  param1: string;
  param2?: number;
  param3?: boolean;
}) {
  // function body
}

// ❌ INCORRECT: Individual parameters
function myFunction(param1: string, param2?: number, param3?: boolean) {
  // function body
}
```

Benefits of object parameters:

- Easier to add new optional parameters without breaking existing calls
- Named parameters make code more readable
- Easier refactoring when parameter order needs to change
- Better IDE autocomplete and type checking
