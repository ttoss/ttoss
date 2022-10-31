import { Button, Flex, Heading, Image, Text } from '@ttoss/ui';

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
    <Flex
      sx={{
        justifyContent: 'space-between',
        paddingY: '10vh',
        paddingX: '186px',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          alignItems: isCentered ? 'center' : 'start',
          backgroundImage: isCentered ? `url(${imageSrc})` : undefined,
          width: isCentered ? '100%' : undefined,
          minHeight: isCentered ? '80vh' : undefined,
          justifyContent: isCentered ? 'center' : undefined,
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
            marginTop: '54px',
            marginBottom: '71px',
          }}
          as="h2"
        >
          {subHeaderText}
        </Text>
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

      {!isCentered && (
        <Flex>
          <Image
            sx={{
              maxWidth: '60vw',
              maxHeight: '623px',
            }}
            src={imageSrc}
            alt={imageAlt}
          />
        </Flex>
      )}
    </Flex>
  );
};
