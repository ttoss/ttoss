import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

const meta: Meta = {
  title: 'Chakra UI/Theme Customization/Complete Example',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * A complete example showing how custom theme tokens work together
 * in a realistic application interface with cards, buttons, and forms.
 */
export const DashboardExample: Story = {
  render: () => {
    return (
      <Box bg="bg" minH="100vh" p={8}>
        <Stack gap={8} maxW="1200px" mx="auto">
          {/* Header */}
          <Box>
            <Heading size="2xl" mb={2}>
              Dashboard Overview
            </Heading>
            <Text color="fg.muted" fontSize="lg">
              Example showing custom theme application across components
            </Text>
          </Box>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between" mb={4}>
                  <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                    Total Users
                  </Text>
                  <Badge colorPalette="green">+12%</Badge>
                </HStack>
                <Heading size="xl">2,847</Heading>
                <Text color="fg.muted" fontSize="sm" mt={2}>
                  Active users this month
                </Text>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <HStack justify="space-between" mb={4}>
                  <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                    Revenue
                  </Text>
                  <Badge colorPalette="blue">+8%</Badge>
                </HStack>
                <Heading size="xl">$45,892</Heading>
                <Text color="fg.muted" fontSize="sm" mt={2}>
                  Total revenue this quarter
                </Text>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <HStack justify="space-between" mb={4}>
                  <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                    Conversion
                  </Text>
                  <Badge colorPalette="purple">3.2%</Badge>
                </HStack>
                <Heading size="xl">24.5%</Heading>
                <Text color="fg.muted" fontSize="sm" mt={2}>
                  Conversion rate improvement
                </Text>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>

          {/* Team Members Section */}
          <Card.Root>
            <Card.Header>
              <HStack justify="space-between">
                <Box>
                  <Heading size="md">Team Members</Heading>
                  <Text color="fg.muted" fontSize="sm" mt={1}>
                    Manage your team and their permissions
                  </Text>
                </Box>
                <Button colorPalette="blue" size="sm">
                  Invite Member
                </Button>
              </HStack>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                {[
                  {
                    name: 'Sarah Johnson',
                    role: 'Product Manager',
                    status: 'active',
                  },
                  {
                    name: 'Michael Chen',
                    role: 'Lead Developer',
                    status: 'active',
                  },
                  {
                    name: 'Emma Williams',
                    role: 'UI Designer',
                    status: 'busy',
                  },
                ].map((member, index) => {
                  return (
                    <HStack
                      key={index}
                      p={4}
                      bg="bg.subtle"
                      borderRadius="md"
                      justify="space-between"
                    >
                      <HStack gap={3}>
                        <Avatar.Root size="md">
                          <Avatar.Fallback name={member.name} />
                        </Avatar.Root>
                        <Box>
                          <Text fontWeight="medium">{member.name}</Text>
                          <Text color="fg.muted" fontSize="sm">
                            {member.role}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack>
                        <Badge
                          colorPalette={
                            member.status === 'active' ? 'green' : 'yellow'
                          }
                        >
                          {member.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </HStack>
                    </HStack>
                  );
                })}
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Quick Actions Form */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Quick Actions</Heading>
              <Text color="fg.muted" fontSize="sm" mt={1}>
                Perform common tasks quickly
              </Text>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Project Name</Field.Label>
                  <Input placeholder="Enter project name" />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Assigned To</Field.Label>
                  <Input placeholder="Select team member" />
                </Field.Root>
              </SimpleGrid>

              <HStack mt={6} justify="flex-end" gap={3}>
                <Button variant="outline">Cancel</Button>
                <Button colorPalette="blue">Create Project</Button>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Theme Configuration Info */}
          <Card.Root bg="blue.subtle" borderColor="blue.muted">
            <Card.Body>
              <HStack gap={3} align="start">
                <Box
                  p={2}
                  bg="blue.emphasized"
                  borderRadius="md"
                  color="blue.contrast"
                >
                  <Text fontSize="xl">💡</Text>
                </Box>
                <Box flex="1">
                  <Heading size="sm" mb={2}>
                    Theme Customization in Action
                  </Heading>
                  <Text fontSize="sm" color="fg.muted">
                    This example demonstrates how custom colors, typography, and
                    semantic tokens work together. All components use theme
                    tokens for consistent styling that automatically adapts to
                    light/dark mode.
                  </Text>
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Stack>
      </Box>
    );
  },
};

/**
 * Authentication form example with custom theme application.
 */
export const AuthenticationForm: Story = {
  render: () => {
    return (
      <Box
        bg="gray.50"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        <Card.Root maxW="md" w="full">
          <Card.Header>
            <Box textAlign="center" mb={2}>
              <Box
                display="inline-flex"
                p={3}
                bg="blue.subtle"
                borderRadius="full"
                mb={4}
              >
                <Text fontSize="3xl">🔐</Text>
              </Box>
              <Heading size="lg">Welcome Back</Heading>
              <Text color="fg.muted" mt={2}>
                Sign in to continue to your account
              </Text>
            </Box>
          </Card.Header>

          <Card.Body>
            <Stack gap={4}>
              <Field.Root>
                <Field.Label>Email Address</Field.Label>
                <Input type="email" placeholder="you@example.com" />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input type="password" placeholder="Enter your password" />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  Must be at least 8 characters
                </Text>
              </Field.Root>

              <HStack justify="space-between" fontSize="sm">
                <Text color="fg.muted">
                  <input type="checkbox" /> Remember me
                </Text>
                <Button variant="plain" size="sm" colorPalette="blue">
                  Forgot password?
                </Button>
              </HStack>

              <Button colorPalette="blue" size="lg" w="full" mt={2}>
                Sign In
              </Button>
            </Stack>
          </Card.Body>

          <Card.Footer justifyContent="center">
            <Text fontSize="sm" color="fg.muted">
              Don&apos;t have an account?{' '}
              <Button variant="plain" colorPalette="blue" size="sm">
                Sign up
              </Button>
            </Text>
          </Card.Footer>
        </Card.Root>
      </Box>
    );
  },
};

/**
 * E-commerce product card example with custom theme tokens.
 */
export const ProductCard: Story = {
  render: () => {
    return (
      <Box bg="bg" p={8}>
        <SimpleGrid
          columns={{ base: 1, md: 3 }}
          gap={6}
          maxW="1200px"
          mx="auto"
        >
          {[
            {
              name: 'Wireless Headphones',
              price: '$199',
              rating: '4.8',
              image: '🎧',
              badge: 'Popular',
              color: 'blue',
            },
            {
              name: 'Smart Watch',
              price: '$349',
              rating: '4.9',
              image: '⌚',
              badge: 'New',
              color: 'purple',
            },
            {
              name: 'Laptop Stand',
              price: '$79',
              rating: '4.7',
              image: '💻',
              badge: 'Sale',
              color: 'red',
            },
          ].map((product, index) => {
            return (
              <Card.Root key={index} overflow="hidden">
                <Box
                  bg={`${product.color}.subtle`}
                  h="200px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="6xl"
                  position="relative"
                >
                  {product.image}
                  <Badge
                    position="absolute"
                    top={3}
                    right={3}
                    colorPalette={product.color}
                  >
                    {product.badge}
                  </Badge>
                </Box>

                <Card.Body>
                  <Heading size="md" mb={2}>
                    {product.name}
                  </Heading>
                  <HStack justify="space-between" mb={3}>
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={`${product.color}.solid`}
                    >
                      {product.price}
                    </Text>
                    <HStack gap={1}>
                      <Text fontSize="sm" color="fg.muted">
                        ⭐ {product.rating}
                      </Text>
                    </HStack>
                  </HStack>
                  <Text color="fg.muted" fontSize="sm">
                    Premium quality product with modern design and excellent
                    features for everyday use.
                  </Text>
                </Card.Body>

                <Card.Footer gap={2}>
                  <Button variant="outline" flex="1">
                    View Details
                  </Button>
                  <Button colorPalette={product.color} flex="1">
                    Add to Cart
                  </Button>
                </Card.Footer>
              </Card.Root>
            );
          })}
        </SimpleGrid>
      </Box>
    );
  },
};
