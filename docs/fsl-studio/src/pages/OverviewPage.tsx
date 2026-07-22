import {
  Container,
  Grid,
  Heading,
  Link,
  Stack,
  Surface,
  Text,
} from '@ttoss/fsl-ui';

const SECTIONS = [
  {
    href: '#/blocks',
    title: 'Blocks',
    description:
      'Real application flows — login, settings, dashboard, pricing — built ' +
      'end-to-end with fsl-ui. Every gap found here lands in the friction log.',
    cta: 'Browse blocks',
  },
  {
    href: '#/components',
    title: 'Components',
    description:
      'The fsl-ui catalog: every component with its semantic identity ' +
      '(Entity, Evaluation, Consequence) and canonical usage.',
    cta: 'Browse components',
  },
  {
    href: '#/theme',
    title: 'Theme',
    description:
      'The fsl-theme token surface: modes, families, and the base theme the ' +
      'Studio itself runs on.',
    cta: 'Explore the theme',
  },
] as const;

/**
 * Landing section: what the Studio is and where to go. The Studio is the
 * P1 adoption vehicle — it exists to prove the packages on real flows.
 */
export const OverviewPage = () => {
  return (
    <Container size="surface" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            The FSL proving ground
          </Heading>
          <Text tone="muted">
            FSL Studio is built exclusively with @ttoss/fsl-ui components on the
            unmodified @ttoss/fsl-theme base theme — no hand-rolled CSS. It is
            where the design system earns production readiness: every screen
            here is real adoption evidence.
          </Text>
        </Stack>
        <Grid minColumnWidth="sm" gap="lg">
          {SECTIONS.map((section) => {
            return (
              <Surface key={section.href} level="raised" padding="lg">
                <Stack gap="sm">
                  <Heading level={3} size="title-sm">
                    {section.title}
                  </Heading>
                  <Text variant="body-sm" tone="muted">
                    {section.description}
                  </Text>
                  <Link href={section.href}>{section.cta}</Link>
                </Stack>
              </Surface>
            );
          })}
        </Grid>
      </Stack>
    </Container>
  );
};
