import {
  Box,
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
  title: 'Chakra UI/Theme Customization/Typography',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Custom font configuration with font families for different use cases.
 * Define heading, body, and monospace fonts for your design system.
 */
export const FontFamilies: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8} maxW="900px">
        <Box>
          <Heading size="lg" mb={3}>
            Font Family Customization
          </Heading>
          <Text color="fg.muted" mb={6}>
            Configure custom fonts for headings, body text, and code blocks.
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
      fonts: {
        heading: { value: "'Inter', -apple-system, sans-serif" },
        body: { value: "'Inter', -apple-system, sans-serif" },
        mono: { value: "'Fira Code', 'Monaco', monospace" },
      },
    },
  },
})`}
          </Code>
        </Box>

        <SimpleGrid columns={1} gap={4}>
          <Card.Root>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted" mb={2}>
                Heading Font
              </Text>
              <Heading size="xl" fontFamily="heading">
                The quick brown fox jumps over the lazy dog
              </Heading>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted" mb={2}>
                Body Font
              </Text>
              <Text fontSize="lg" fontFamily="body">
                The quick brown fox jumps over the lazy dog. This is body text
                with normal weight and spacing.
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Text fontSize="sm" color="fg.muted" mb={2}>
                Monospace Font
              </Text>
              <Code display="block" p={3} fontFamily="mono">
                const message = &quot;Hello, World!&quot;;
              </Code>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Stack>
    );
  },
};

/**
 * Text styles provide pre-configured typography combinations.
 * Use textStyle prop for consistent text formatting across your app.
 */
export const TextStyles: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8} maxW="900px">
        <Box>
          <Heading size="lg" mb={3}>
            Text Style System
          </Heading>
          <Text color="fg.muted">
            Text styles combine font size, weight, and line height into reusable
            presets.
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
    textStyles: {
      heading: {
        value: {
          fontFamily: "heading",
          fontWeight: "bold",
          lineHeight: "1.2",
        },
      },
      body: {
        value: {
          fontFamily: "body",
          fontWeight: "normal",
          lineHeight: "1.6",
        },
      },
    },
  },
})`}
          </Code>
        </Box>

        <Stack gap={4}>
          {[
            '7xl',
            '6xl',
            '5xl',
            '4xl',
            '3xl',
            '2xl',
            'xl',
            'lg',
            'md',
            'sm',
            'xs',
          ].map((size) => {
            return (
              <Card.Root key={size}>
                <Card.Body>
                  <HStack justify="space-between" align="center">
                    <Box flex="1">
                      <Text textStyle={size}>Text Style: {size}</Text>
                    </Box>
                    <Code fontSize="xs">{size}</Code>
                  </HStack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      </Stack>
    );
  },
};

/**
 * Heading sizes provide a type scale for consistent heading hierarchy.
 */
export const HeadingSizes: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8} maxW="900px">
        <Box>
          <Heading size="lg" mb={3}>
            Heading Size Scale
          </Heading>
          <Text color="fg.muted">
            Chakra UI provides a comprehensive heading size scale from xs to
            4xl.
          </Text>
        </Box>

        <Stack gap={6}>
          <Box>
            <Heading size="4xl" mb={2}>
              Heading 4XL
            </Heading>
            <Code fontSize="xs">size=&quot;4xl&quot;</Code>
          </Box>

          <Box>
            <Heading size="3xl" mb={2}>
              Heading 3XL
            </Heading>
            <Code fontSize="xs">size=&quot;3xl&quot;</Code>
          </Box>

          <Box>
            <Heading size="2xl" mb={2}>
              Heading 2XL
            </Heading>
            <Code fontSize="xs">size=&quot;2xl&quot;</Code>
          </Box>

          <Box>
            <Heading size="xl" mb={2}>
              Heading XL
            </Heading>
            <Code fontSize="xs">size=&quot;xl&quot;</Code>
          </Box>

          <Box>
            <Heading size="lg" mb={2}>
              Heading Large
            </Heading>
            <Code fontSize="xs">size=&quot;lg&quot;</Code>
          </Box>

          <Box>
            <Heading size="md" mb={2}>
              Heading Medium
            </Heading>
            <Code fontSize="xs">size=&quot;md&quot;</Code>
          </Box>

          <Box>
            <Heading size="sm" mb={2}>
              Heading Small
            </Heading>
            <Code fontSize="xs">size=&quot;sm&quot;</Code>
          </Box>

          <Box>
            <Heading size="xs" mb={2}>
              Heading Extra Small
            </Heading>
            <Code fontSize="xs">size=&quot;xs&quot;</Code>
          </Box>
        </Stack>

        <Box bg="bg.subtle" p={4} borderRadius="md" mt={6}>
          <Heading size="sm" mb={3}>
            Usage Tip
          </Heading>
          <Text fontSize="sm">
            Use heading sizes to create visual hierarchy in your content.
            Typically: 4xl/3xl for page titles, 2xl/xl for section headers,
            lg/md for subsections, and sm/xs for small headings.
          </Text>
        </Box>
      </Stack>
    );
  },
};

/**
 * Font weight and letter spacing customization for fine-tuned typography.
 */
export const TypographyDetails: Story = {
  render: () => {
    return (
      <Stack gap={6} p={8} maxW="900px">
        <Box>
          <Heading size="lg" mb={3}>
            Typography Details
          </Heading>
          <Text color="fg.muted">
            Fine-tune your typography with custom font weights and letter
            spacing.
          </Text>
        </Box>

        <SimpleGrid columns={2} gap={6}>
          <Card.Root>
            <Card.Header>
              <Heading size="sm">Font Weights</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <Text fontWeight="light">Light (300)</Text>
                <Text fontWeight="normal">Normal (400)</Text>
                <Text fontWeight="medium">Medium (500)</Text>
                <Text fontWeight="semibold">Semibold (600)</Text>
                <Text fontWeight="bold">Bold (700)</Text>
                <Text fontWeight="extrabold">Extrabold (800)</Text>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="sm">Letter Spacing</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={3}>
                <Text letterSpacing="tighter">Tighter Spacing</Text>
                <Text letterSpacing="tight">Tight Spacing</Text>
                <Text letterSpacing="normal">Normal Spacing</Text>
                <Text letterSpacing="wide">Wide Spacing</Text>
                <Text letterSpacing="wider">Wider Spacing</Text>
                <Text letterSpacing="widest">Widest Spacing</Text>
              </Stack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

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
      fontWeights: {
        light: { value: "300" },
        normal: { value: "400" },
        medium: { value: "500" },
        semibold: { value: "600" },
        bold: { value: "700" },
      },
      letterSpacings: {
        tight: { value: "-0.02em" },
        normal: { value: "0" },
        wide: { value: "0.02em" },
      },
    },
  },
})`}
          </Code>
        </Box>
      </Stack>
    );
  },
};
