# ttoss Examples

This directory contains practical examples demonstrating how to use ttoss packages in real-world scenarios.

## Available Examples

### [http-server-mcp-calculator](https://www.github.com/ttoss/ttoss/tree/main/examples/http-server-mcp-calculator)

Demonstrates how to create a single HTTP server with both REST and MCP endpoints sharing the same business logic. Perfect for understanding how to build APIs that serve both traditional clients and AI assistants.

**Key Concepts:**

- Code reuse across different protocols
- Setting up REST endpoints with `@ttoss/http-server`
- Setting up MCP endpoints with `@ttoss/http-server-mcp`
- Single server instance for multiple protocols

## Running Examples

Each example is a standalone package that can be run independently:

```bash
# From the example directory
cd examples/EXAMPLE_NAME
pnpm install
pnpm dev

# Or from monorepo root
pnpm --filter EXAMPLE_NAME dev
```

## Contributing Examples

When adding new examples:

1. Create a new directory under `examples/`
2. Include a comprehensive `README.md` explaining:
   - What the example demonstrates
   - How to run it
   - Key concepts and architecture
   - Testing instructions
3. Keep the code simple and focused on the core concept
4. Add comments explaining non-obvious code
5. Use TypeScript for better documentation through types
6. Set `"private": true` in `package.json` (examples aren't published)
7. Optionally, create a `build` script with `tsc --noEmit` to validate ttoss/packages compatibility.

## Example Template Structure

```
examples/
  your-example/
    README.md          # Comprehensive documentation
    package.json       # With "private": true
    tsconfig.json      # TypeScript configuration
    src/
      index.ts         # Main entry point
```

## Learn More

- [ttoss Documentation](https://ttoss.dev)
- [Packages Documentation](https://ttoss.dev/docs/modules/packages)
