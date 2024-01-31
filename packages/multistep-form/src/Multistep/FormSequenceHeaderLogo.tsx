import { CloseButton, Flex, Image } from '@ttoss/ui';

import { BaseMultistepHeaderProps } from './types';

export type MultistepHeaderLogoProps = BaseMultistepHeaderProps & {
  variant: 'logo';
  src: string;
  onClose: () => void;
};

export const MultistepHeaderLogo = ({
  onClose,
  src,
}: MultistepHeaderLogoProps) => {
  return (
    <Flex
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingX: 'xl',
        paddingY: 'lg',
      }}
    >
      <Image
        width={115}
        height={32}
        sx={{ objectFit: 'cover', width: 115, height: 32 }}
        src={src}
      />

      <CloseButton onClick={onClose} />
    </Flex>
  );
};
