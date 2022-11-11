import { Flex, Image } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';

const IMAGES_1 = [
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars+1.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars-2.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars-3.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/close-up-prison-bars-1.png',
];

const IMAGES_2 = [
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/greyscale-roof-modern-building-with-glass-windows-sunlight+1.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/greyscale-roof-modern-building-with-glass-windows-sunlight.png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/greyscale-roof-modern-building-with-glass-windows-sunlight+1+(1).png',
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/greyscale-roof-modern-building-with-glass-windows-sunlight+1+(2).png',
];

export default {
  title: 'Design System/Images',
} as Meta;

const Template: Story = () => {
  return (
    <Flex sx={{ flexDirection: 'column', gap: 4 }}>
      <Flex sx={{ gap: 3 }}>
        {IMAGES_1.map((src) => (
          <Image
            key={src}
            width="256px"
            sx={{ width: '256px', height: '171px', objectFit: 'fill' }}
            src={src}
            title={src}
          />
        ))}
      </Flex>

      <Flex sx={{ gap: 3, flexWrap: 'wrap' }}>
        {IMAGES_2.map((src) => (
          <Image
            sx={{ objectFit: 'fill', width: '249px', height: '414px' }}
            key={src}
            src={src}
            title={src}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export const Example = Template.bind({});
