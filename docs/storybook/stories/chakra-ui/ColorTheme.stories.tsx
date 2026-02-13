import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
  title: 'Chakra UI/Theme Customization/Colors',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Custom brand colors with full shade range (50-950).
 * This example shows how to create a custom color palette for your brand.
 */
export const BrandColors: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8}>
        <Box>
          <Heading size="lg" mb={3}>
            Custom Brand Color Palette
          </Heading>
          <Text color="fg.muted" mb={6}>
            Define your brand colors with semantic tokens for automatic
            light/dark mode support.
          </Text>
        </Box>

        <Box bg="bg.subtle" p={4} borderRadius="md">
          <Code
            display="block"
            p={4}
            borderRadius="sm"
            fontSize="sm"
            whiteSpace="pre-wrap"
          >
            {`const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f2ff" },
          100: { value: "#bfdeff" },
          200: { value: "#99caff" },
          300: { value: "#66b3ff" },
          400: { value: "#339cff" },
          500: { value: "#0085ff" },  // Primary brand color
          600: { value: "#006acc" },
          700: { value: "#004f99" },
          800: { value: "#003566" },
          900: { value: "#001a33" },
          950: { value: "#000d1a" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "{colors.brand.50}" },
          fg: { 
            value: { 
              _light: "{colors.brand.700}", 
              _dark: "{colors.brand.300}" 
            } 
          },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.200}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
  },
})`}
          </Code>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Color Palette Preview
          </Heading>
          <SimpleGrid columns={5} gap={4}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
              (shade) => {
                return (
                  <Box key={shade} textAlign="center">
                    <Box
                      h="80px"
                      bg={`blue.${shade}`}
                      borderRadius="md"
                      mb={2}
                      border="1px solid"
                      borderColor="border.subtle"
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {shade}
                    </Text>
                  </Box>
                );
              }
            )}
          </SimpleGrid>
        </Box>

        <Box>
          <Heading size="md" mb={4}>
            Components with Brand Colors
          </Heading>
          <HStack gap={4} wrap="wrap">
            <Button colorPalette="blue">Brand Primary</Button>
            <Button colorPalette="blue" variant="outline">
              Brand Outline
            </Button>
            <Button colorPalette="blue" variant="surface">
              Brand Surface
            </Button>
            <Button colorPalette="blue" variant="subtle">
              Brand Subtle
            </Button>
          </HStack>
        </Box>
      </Stack>
    );
  },
};

/**
 * Semantic tokens automatically adapt to light and dark modes.
 * Use semantic tokens instead of hard-coded color values for better theme consistency.
 */
export const SemanticTokens: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8} maxW="1000px">
        <Box>
          <Heading size="lg" mb={3}>
            Semantic Color Tokens
          </Heading>
          <Text color="fg.muted" mb={4}>
            Semantic tokens provide context-aware colors that automatically
            adapt to different color modes.
          </Text>
        </Box>

        <SimpleGrid columns={2} gap={6}>
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Background Tokens</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <Box p={3} bg="bg" borderRadius="sm">
                  <Code>bg</Code> - Default background
                </Box>
                <Box p={3} bg="bg.subtle" borderRadius="sm">
                  <Code>bg.subtle</Code> - Subtle background
                </Box>
                <Box p={3} bg="bg.muted" borderRadius="sm">
                  <Code>bg.muted</Code> - Muted background
                </Box>
                <Box
                  p={3}
                  bg="bg.emphasized"
                  borderRadius="sm"
                  color="fg.inverted"
                >
                  <Code>bg.emphasized</Code> - Emphasized bg
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="sm">Status Colors</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <Badge colorPalette="green">Success State</Badge>
                <Badge colorPalette="red">Error State</Badge>
                <Badge colorPalette="yellow">Warning State</Badge>
                <Badge colorPalette="blue">Info State</Badge>
              </Stack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        <Box bg="bg.subtle" p={4} borderRadius="md">
          <Heading size="sm" mb={3}>
            Best Practices
          </Heading>
          <Stack gap={2}>
            <Text fontSize="sm">
              ✅ Use semantic tokens like <Code>bg</Code>, <Code>fg</Code>,{' '}
              <Code>border</Code>
            </Text>
            <Text fontSize="sm">
              ✅ Define <Code>_light</Code> and <Code>_dark</Code> variants for
              mode-aware colors
            </Text>
            <Text fontSize="sm">
              ❌ Avoid hard-coding colors like <Code>#000000</Code> or{' '}
              <Code>rgb(0,0,0)</Code>
            </Text>
          </Stack>
        </Box>
      </Stack>
    );
  },
};

/**
 * Color palettes enable consistent theming across components.
 * Apply color palettes using the colorPalette prop on components.
 */
export const ColorPalettes: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8}>
        <Box>
          <Heading size="lg" mb={3}>
            Color Palette Application
          </Heading>
          <Text color="fg.muted">
            Use the <Code>colorPalette</Code> prop to apply consistent theming
            to components.
          </Text>
        </Box>

        {['blue', 'green', 'purple', 'red', 'orange', 'teal'].map((palette) => {
          return (
            <Box key={palette} p={4} bg="bg.subtle" borderRadius="md">
              <HStack mb={3}>
                <Badge
                  colorPalette={palette}
                  size="lg"
                  textTransform="capitalize"
                >
                  {palette}
                </Badge>
              </HStack>
              <HStack gap={3} wrap="wrap">
                <Button colorPalette={palette}>Solid</Button>
                <Button colorPalette={palette} variant="outline">
                  Outline
                </Button>
                <Button colorPalette={palette} variant="surface">
                  Surface
                </Button>
                <Button colorPalette={palette} variant="subtle">
                  Subtle
                </Button>
                <Badge colorPalette={palette}>Badge</Badge>
              </HStack>
            </Box>
          );
        })}
      </Stack>
    );
  },
};
