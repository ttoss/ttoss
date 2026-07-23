import { vars } from '@ttoss/fsl-theme/vars';
import {
  Container,
  Grid,
  Heading,
  type HeadingSize,
  Stack,
  Surface,
  Text,
  type TextVariant,
} from '@ttoss/fsl-ui';

/*
 * Theme lab v0 — a live view of the semantic token surface. Swatches paint
 * raw token vars on purpose (a token visualizer's job is showing the paint
 * itself); everything re-themes with the Light/System/Dark switcher in the
 * header because the values are CSS variables, never literals.
 */

interface RoleColors {
  background: { default: string };
  text: { default: string };
  border: { default: string };
}

const COLOR_FAMILIES = Object.entries(vars.colors) as Array<
  [string, Record<string, RoleColors>]
>;

// Swatch block-size (a fixed specimen box, not a layout token decision).
const SWATCH_SIZE = '3.5rem';

const HEADING_SIZES: HeadingSize[] = [
  'display-lg',
  'display-md',
  'display-sm',
  'headline-lg',
  'headline-md',
  'headline-sm',
  'title-lg',
  'title-md',
  'title-sm',
];

const TEXT_VARIANTS: TextVariant[] = [
  'body-lg',
  'body-md',
  'body-sm',
  'label-lg',
  'label-md',
  'label-sm',
];

/** One color role: default background/text pairing plus its border. */
const RoleSwatch = ({
  family,
  role,
  colors,
}: {
  family: string;
  role: string;
  colors: RoleColors;
}) => {
  return (
    <Stack gap="xs">
      <span
        title={`${family}.${role}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          blockSize: SWATCH_SIZE,
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: 'solid',
          borderColor: colors.border.default,
          backgroundColor: colors.background.default,
          color: colors.text.default,
        }}
      >
        Aa
      </span>
      <Text as="span" variant="label-sm" tone="muted">
        {role}
      </Text>
    </Stack>
  );
};

/**
 * Theme lab v0: the semantic color grammar and the type scale, rendered
 * live from the unmodified base theme. The header's Light/System/Dark
 * switcher drives the real fsl-theme runtime — every swatch and specimen
 * below remaps with it.
 */
export const ThemePage = () => {
  return (
    <Container size="surface" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            Theme
          </Heading>
          <Text tone="muted">
            The Studio runs the unmodified @ttoss/fsl-theme base theme. Below:
            the semantic color grammar (ux × role, default state) and the type
            scale — all live CSS variables, so the mode switcher in the header
            re-themes everything on this page. Families not shown here (spacing,
            elevation, motion, dataviz) are exercised by the shell and the
            blocks.
          </Text>
        </Stack>
        <Stack gap="lg">
          <Heading level={3} size="title-md">
            Semantic colors
          </Heading>
          {COLOR_FAMILIES.map(([family, roles]) => {
            return (
              <Stack key={family} gap="sm">
                <Heading level={4} size="title-sm">
                  {family}
                </Heading>
                <Grid minColumnWidth="xs" gap="md">
                  {Object.entries(roles).map(([role, colors]) => {
                    return (
                      <RoleSwatch
                        key={role}
                        family={family}
                        role={role}
                        colors={colors}
                      />
                    );
                  })}
                </Grid>
              </Stack>
            );
          })}
        </Stack>
        <Stack gap="lg">
          <Heading level={3} size="title-md">
            Type scale
          </Heading>
          <Surface level="flat" padding="lg">
            <Stack gap="md">
              {HEADING_SIZES.map((size) => {
                return (
                  <Stack key={size} gap="xs">
                    <Text as="span" variant="label-sm" tone="muted">
                      {size}
                    </Text>
                    <Heading level={4} size={size}>
                      Semantics first, pixels second
                    </Heading>
                  </Stack>
                );
              })}
              {TEXT_VARIANTS.map((variant) => {
                return (
                  <Stack key={variant} gap="xs">
                    <Text as="span" variant="label-sm" tone="muted">
                      {variant}
                    </Text>
                    <Text variant={variant}>
                      Semantics first, pixels second
                    </Text>
                  </Stack>
                );
              })}
            </Stack>
          </Surface>
        </Stack>
      </Stack>
    </Container>
  );
};
