import { CloseButton, Flex, Image } from '@ttoss/ui';

import { BaseFormSequenceHeaderProps } from './types';

export type FormSequenceHeaderLogoProps = BaseFormSequenceHeaderProps & {
  variant: 'logo';
  src: string;
  onClose: () => void;
};

export const FormSequenceHeaderLogo = ({
  onClose,
  src,
}: FormSequenceHeaderLogoProps) => {
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
