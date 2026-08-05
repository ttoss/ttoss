import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container, Heading, Stack, Surface, Text } from '@ttoss/fsl-ui';

const meta: Meta<typeof Container> = {
  title: 'Structure/Container',
  component: Container,
};

export default meta;

type Story = StoryObj<typeof Container>;

export const Default: Story = {
  render: () => {
    return (
      <Container>
        <Text>
          A centered container capped at the surface width with gutter padding.
        </Text>
      </Container>
    );
  },
};

export const Reading: Story = {
  render: () => {
    return (
      <Container size="reading">
        <Text>
          The reading size caps content at the long-form measure — article
          pages, docs, legal text.
        </Text>
      </Container>
    );
  },
};

/**
 * `size="card"` caps at the narrow centered-card width (FRICTION F-004) — a
 * standalone auth form, a confirmation page, any single-purpose surface that
 * should read as one object on the page rather than a page-shell column.
 * This is the shape the Studio's own `LoginPage` uses.
 */
export const Card: Story = {
  render: () => {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          minBlockSize: '24rem',
        }}
      >
        <Container size="card" gutter="none">
          <Stack gap="lg">
            <Surface level="raised" padding="lg">
              <Stack gap="md">
                <Heading level={1} size="title-md">
                  Sign in
                </Heading>
                <Text tone="muted">
                  A narrow centered card — the width step between `reading` and
                  `surface`.
                </Text>
              </Stack>
            </Surface>
          </Stack>
        </Container>
      </div>
    );
  },
};
