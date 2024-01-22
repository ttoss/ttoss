import * as React from 'react';
import { Flex, Image, Text } from '@ttoss/ui';
import { FormSequenceFlowMessageBase } from './types';

export type FormSequenceFlowMessageImageTextProps =
  FormSequenceFlowMessageBase & {
    variant: 'image-text';
    src: string;
    description: string | React.ReactNode;
  };

export const FormSequenceFlowMessageImageText = ({
  src,
  description,
}: FormSequenceFlowMessageImageTextProps) => {
  return (
    <Flex
      sx={{
        flexDirection: 'column',
        paddingY: 'xl',
        paddingX: '2xl',
        gap: 'xl',
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
