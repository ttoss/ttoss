import * as React from 'react';
import { Flex, Image, Text } from '@ttoss/ui';
import { MultistepFlowMessageBase } from './types';

export type MultistepFlowMessageImageTextProps = MultistepFlowMessageBase & {
  variant: 'image-text';
  src: string;
  description: string | React.ReactNode;
};

export const MultistepFlowMessageImageText = ({
  src,
  description,
}: MultistepFlowMessageImageTextProps) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        paddingY: '5',
        paddingX: '6',
        gap: '5',
      }}
    >
      <Image
        src={src}
        sx={{
          width: '184px',
          height: '184px',
          objectFit: 'cover',
          alignSelf: 'center',
        }}
      />

      <Text sx={{ textAlign: 'center' }}>{description}</Text>
    </Flex>
  );
};
