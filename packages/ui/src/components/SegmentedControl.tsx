import 'rc-segmented/assets/index.css';

import Segmented from 'rc-segmented';
import * as React from 'react';
import { Flex } from 'theme-ui';

export interface SegmentedControlProps {
  options: (
    | string
    | number
    | { label: React.ReactNode; value: string | number; disabled?: boolean }
  )[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedControl = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled,
  className,
  size = 'md',
  ...rest
}: SegmentedControlProps) => {
  // Definir os tamanhos com base no parâmetro size
  const sizes = {
    sm: {
      padding: 1,
      fontSize: 12,
      height: '28px',
    },
    md: {
      padding: 4,
      fontSize: 14,
      height: '36px',
    },
    lg: {
      padding: 8,
      fontSize: 18,
      height: '44px',
    },
  };

  const currentSize = sizes[size];

  return (
    <Flex
      sx={{
        width: '100%',
        borderRadius: 'full',
        border: '1px solid',
        borderColor: 'display.border.muted.default',
        overflow: 'hidden',

        // Estilização do componente rc-segmented
        '.rc-segmented': {
          width: '100%',
          borderRadius: 'full',
          padding: '0',
          backgroundColor: 'transparent',
        },
        '.rc-segmented-group': {
          borderRadius: 'full',
          display: 'flex',
          width: '100%',
        },
        '.rc-segmented-item': {
          borderRadius: 'full',
          margin: '0',
          transition: 'background-color 0.2s ease, color 0.2s ease', // Transição específica para cores
          padding: `${currentSize.padding}px 16px`,
          fontSize: currentSize.fontSize,
          lineHeight: currentSize.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'display.text.secondary.default',
          '&:focus': {
            boxShadow: `none`,
            boxShadowColor: 'action.background.accent.default',
            outlineColor: 'transparent',
          },
        },
        '.rc-segmented-item-selected': {
          backgroundColor: 'action.background.accent.default',
          color: 'action.text.accent.default',
          fontWeight: 'bold',
        },
        '.rc-segmented-item:hover:not(.rc-segmented-item-selected)': {
          backgroundColor: 'display.background.muted.default',
        },
        '.rc-segmented-thumb': {
          backgroundColor: 'action.background.accent.default',
          borderRadius: 'full',
          zIndex: 1,
          margin: '0', // Sem margem
          boxSizing: 'border-box',
          transition: 'transform 0.2s ease, width 0.2s ease', // Controla a animação do thumb
          willChange: 'transform', // Otimiza a performance da animação
          transform: 'translateZ(0)', // Força aceleração de hardware
        },
        '.rc-segmented-item-disabled': {
          opacity: 0.5,
          cursor: 'not-allowed',
          color: 'input.text.muted.disabled',
          backgroundColor: 'input.background.muted.disabled',
        },
      }}
      className={className}
    >
      <Segmented
        options={options}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        {...rest}
      />
    </Flex>
  );
};
