import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // Dev-server MCP endpoint (/mcp) for tool-assisted story work
    // (BLUEPRINT S1 AI surface). Experimental (0.x) — dev-only value,
    // never a gate dependency.
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  features: {
    // The static build emits `manifests/components.json` — the
    // machine-readable component catalog `@storybook/mcp` consumes.
    componentsManifest: true,
  },
};

export default config;
