import { Button, Flex, Heading, Image, Text } from '@ttoss/ui';

export type HeroProps = {
  headerText: string;
  subHeaderText: string;
  alignment: 'left' | 'center';
  imageSrc: string;
  imageAlt?: string;
  ctaLabel?: string;
};

const getAlignmentStyles = ({
  isCentered,
  imageSrc,
}: {
  isCentered: boolean;
  imageSrc: string;
}) => {
  if (isCentered) {
    return {
      content: {
        alignItems: 'center',
        backgroundImage: `url(${imageSrc})`,
        width: '100%',
        minHeight: '80vh',
        justifyContent: 'center',
      },
      textColor: 'white',
      button: { background: 'white', color: 'black' },
    };
  }

  return {
    content: {
      alignItems: 'start',
      backgroundImage: undefined,
      width: undefined,
      minHeight: undefined,
      justifyContent: undefined,
    },
    textColor: undefined,
    button: { background: 'black', color: undefined },
  };
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
  const alignmentStyles = getAlignmentStyles({ isCentered, imageSrc });

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
          ...alignmentStyles.content,
        }}
      >
        <Heading
          sx={{ fontSize: '48px', color: alignmentStyles.textColor }}
          as="h1"
        >
          {headerText}
        </Heading>
        <Text
          sx={{
            fontSize: '24px',
            color: alignmentStyles.textColor,
            marginTop: '54px',
            marginBottom: '71px',
          }}
          as="h2"
        >
          {subHeaderText}
        </Text>
        <Button
          sx={{
            ...alignmentStyles.button,
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
