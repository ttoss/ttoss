import { Box, Flex, Image } from '@ttoss/ui';
import { Icon } from '@iconify/react';
import React from 'react';

export type HeroCarouselProps = {
  images: {
    id: string;
    alt: string;
    src: string;
  }[];
};

export const HeroCarousel = ({ images = [] }: HeroCarouselProps) => {
  const [selectedImage, setSelectedImage] = React.useState(images[0].id);

  const handleRight = () => {
    const currentIndex = images.findIndex((item) => item.id === selectedImage);
    const isLast = currentIndex === images.length - 1;

    if (isLast) {
      return setSelectedImage(images[0].id);
    }

    setSelectedImage(images[currentIndex + 1].id);
  };

  const handleLeft = () => {
    const currentIndex = images.findIndex((item) => item.id === selectedImage);
    const isFirst = currentIndex === 0;

    if (isFirst) {
      return setSelectedImage(images[images.length - 1].id);
    }

    setSelectedImage(images[currentIndex - 1].id);
  };

  const image = React.useMemo(() => {
    const result = images.find((item) => item.id === selectedImage);

    return result;
  }, [selectedImage, images]);

  return (
    <Flex
      sx={{ width: '100%', height: '100%', maxHeight: '70vh', paddingX: 5 }}
    >
      <Flex
        sx={{
          width: '100%',
          height: '50vw',
          position: 'relative',
          flexDirection: 'column',
        }}
      >
        <Flex sx={{ height: '100%', alignItems: 'center', gap: 3 }}>
          <Flex
            sx={{
              cursor: 'pointer',
              height: '100%',
              alignItems: 'center',
            }}
            onClick={handleLeft}
          >
            <Icon icon="akar-icons:chevron-left" />
          </Flex>

          {image && (
            <Image sx={{ height: '100%', width: '100%' }} src={image.src} />
          )}

          <Flex
            sx={{
              cursor: 'pointer',
              height: '100%',
              alignItems: 'center',
            }}
            onClick={handleRight}
          >
            <Icon icon="akar-icons:chevron-right" />
          </Flex>
        </Flex>

        <Flex
          sx={{
            marginTop: 2,
            alignSelf: 'center',
            gap: 3,
          }}
        >
          {images.map((image) => {
            return (
              <Box
                key={image.id}
                role="button"
                onClick={() => setSelectedImage(image.id)}
                sx={{
                  background: image.id === selectedImage ? 'gray' : 'black',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </Flex>
      </Flex>
    </Flex>
  );
};
