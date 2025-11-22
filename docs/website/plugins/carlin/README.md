# Carlin Documentation Plugin

Extracts JSDoc comments from carlin's compiled TypeScript code and makes them available as imports in documentation files.

## Prerequisites

⚠️ **Build carlin before running scripts or building docs:**

```bash
pnpm build --filter @ttoss/carlin
```

## Usage

### Print All Comments

```bash
node plugins/carlin/printComments.mjs --path cli.ts
node plugins/carlin/printComments.mjs --path deploy/command.ts
```

### Search Comments

```bash
node plugins/carlin/printComments.mjs --path cli.ts --find "configuration"
```

### Get Specific Comment

```bash
node plugins/carlin/printComments.mjs --path cli.ts --longname "cli~getConfig"
```

## Currently Used In

- `02-configuration.mdx` - CLI options, config structure
- `04-core-concepts/01-stack-naming.mdx` - Stack naming algorithm
- `05-commands/deploy.mdx` - Deploy command details

## Development Workflow

When carlin source changes:

```bash
# 1. Rebuild carlin
pnpm build --filter @ttoss/carlin

# 2. Rebuild docs
cd docs/website && pnpm build
```

## Files

- `index.mjs` - Plugin implementation
- `getComments.mjs` - Comment extraction logic
- `printComments.mjs` - CLI exploration tool
