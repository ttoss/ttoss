import { Button, Flex, Grid, Heading, Image, Text } from '@ttoss/ui';

export type HeroProps = {
  headerText: string;
  subHeaderText: string;
  alignment: 'left' | 'center';
  imageSrc: string;
  imageAlt?: string;
  ctaLabel?: string;
};

export const Hero = ({
  alignment,
  headerText,
  subHeaderText,
  imageSrc,
  imageAlt,
  ctaLabel,
}: HeroProps) => {
  const isCentered = alignment === 'center';

  return (
    <Flex sx={{ justifyContent: 'center' }}>
      <Grid
        sx={{
          position: 'relative',
          width: '100%',
          gridTemplateAreas: !isCentered
            ? "'headers image' 'cta image' 'cta image'"
            : "'headers' 'cta'",
          backgroundImage: isCentered ? `url(${imageSrc})` : undefined,
          height: '90vh',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            gridArea: 'headers',
            justifyContent: 'end',
            alignItems: isCentered ? 'center' : undefined,
            marginRight: !isCentered ? 6 : undefined,
            marginBottom: isCentered ? 5 : '71px',
          }}
        >
          <Heading
            sx={{ fontSize: '48px', color: isCentered ? 'white' : undefined }}
            as="h1"
          >
            {headerText}
          </Heading>
          <Text
            sx={{
              fontSize: '24px',
              color: isCentered ? 'white' : undefined,
              marginTop: isCentered ? '55px' : '54px',
            }}
            as="h2"
          >
            {subHeaderText}
          </Text>
        </Flex>

        {!isCentered && (
          <Image
            sx={{
              gridArea: 'image',
              maxWidth: '50vw',
            }}
            src={imageSrc}
            alt={imageAlt}
          />
        )}

        <Flex
          sx={{
            gridArea: 'cta',
            alignItems: 'start',
            justifyContent: isCentered ? 'center' : undefined,
          }}
        >
          <Button
            sx={{
              background: isCentered ? 'white' : 'black',
              color: isCentered ? 'black' : undefined,
              borderRadius: '10px',
              fontSize: '16px',
            }}
          >
            {ctaLabel}
          </Button>
        </Flex>
      </Grid>
    </Flex>
  );
};
