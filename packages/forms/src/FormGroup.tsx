import { Flex, FlexProps } from '@ttoss/ui';
import { useFormGroup } from './useFormGroup';
import React from 'react';

type FormGroupProps = {
  children: React.ReactNode;
  sx?: FlexProps['sx'];
};

export const FormGroup = ({ sx, children }: FormGroupProps) => {
  const divId = React.useId();
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { maxLevel, parentLevel } = useFormGroup(ref, divId);

  return (
    <Flex
      ref={ref}
      id={divId}
      aria-details="form-group"
      sx={{ flexDirection: 'column', width: '100%', gap: 'xs', ...sx }}
    >
      {children}
    </Flex>
  );
};
