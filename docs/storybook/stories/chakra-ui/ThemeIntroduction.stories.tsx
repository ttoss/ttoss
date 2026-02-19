import { Box, Code, Heading, Stack, Text } from '@chakra-ui/react';
import type { Meta } from '@storybook/react-webpack5';

const meta: Meta = {
  title: 'Chakra UI/Theme Customization/Introduction',
  tags: ['autodocs'],
};

export default meta;

export const Overview = () => {
  return (
    <Stack gap={6} maxW="800px" p={8}>
      <Heading size="xl">Chakra UI Theme Customization</Heading>

      <Text fontSize="lg" color="fg.muted">
        Learn how to customize Chakra UI themes to match your brand and design
        system.
      </Text>

      <Box>
        <Heading size="md" mb={3}>
          What You&apos;ll Learn
        </Heading>
        <Stack gap={3}>
          <Text>
            • <strong>Color Tokens</strong>: Define custom color palettes with
            full shade ranges
          </Text>
          <Text>
            • <strong>Semantic Tokens</strong>: Create context-aware tokens that
            adapt to light/dark modes
          </Text>
          <Text>
            • <strong>Typography</strong>: Customize fonts, sizes, and text
            styles
          </Text>
          <Text>
            • <strong>Component Theming</strong>: Apply custom themes to
            components
          </Text>
        </Stack>
      </Box>

      <Box bg="bg.subtle" p={4} borderRadius="md">
        <Heading size="sm" mb={2}>
          Basic Theme Structure
        </Heading>
        <Code display="block" p={4} borderRadius="sm" fontSize="sm">
          {`import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: { /* color tokens */ },
      fonts: { /* font tokens */ }
    },
    semanticTokens: {
      colors: { /* semantic color tokens */ }
    }
  }
})

export const system = createSystem(defaultConfig, config)`}
        </Code>
      </Box>

      <Text color="fg.muted" fontSize="sm">
        Explore the following stories to see practical examples of theme
        customization.
      </Text>
    </Stack>
  );
};
