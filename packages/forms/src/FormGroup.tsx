import { Flex, FlexProps } from '@ttoss/ui';
import React from 'react';

type FormGroupLevelsManagerContextType = {
  maxLevel?: number;
  registerChild: (level: number) => void;
};

const FormGroupLevelsManagerContext =
  React.createContext<FormGroupLevelsManagerContextType>({
    registerChild: () => {
      return null;
    },
  });

const FormGroupLevelsManager = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [maxLevel, setMaxLevel] = React.useState(0);
  const registerChild = (level: number) => {
    if (level > maxLevel) {
      setMaxLevel(level);
    }
  };

  return (
    <FormGroupLevelsManagerContext.Provider value={{ maxLevel, registerChild }}>
      {children}
    </FormGroupLevelsManagerContext.Provider>
  );
};

type FormGroupContextType = {
  parentLevel?: number;
};

const FormGroupContext = React.createContext<FormGroupContextType>({});

const useFormGroup = () => {
  const { parentLevel } = React.useContext(FormGroupContext);
  const { maxLevel, registerChild } = React.useContext(
    FormGroupLevelsManagerContext
  );

  return {
    level: parentLevel,
    maxLevel,
    registerChild,
  };
};

type FormGroupProps = {
  children: React.ReactNode;
};

const FormGroupWrapper = ({ children }: { children: React.ReactNode }) => {
  const { level, maxLevel, registerChild } = useFormGroup();

  React.useEffect(() => {
    if (level) {
      registerChild(level);
    }
  }, [level, registerChild]);

  const sx: FlexProps['sx'] = React.useMemo(() => {
    return {
      flexDirection: 'column',
      width: '100%',
      gap: 'md',
      paddingLeft: ({ space }: any) => {
        if (!level || !maxLevel) {
          return 0;
        }

        const value = maxLevel / level;

        return `calc(${space['lg']} / ${value})`;
      },
    };
  }, [level, maxLevel]);

  return (
    <Flex aria-level={level} sx={sx}>
      {children}
    </Flex>
  );
};

export const FormGroup = ({ children }: FormGroupProps) => {
  const { level } = useFormGroup();

  const currentLevel = level === undefined ? 0 : level + 1;

  return (
    <FormGroupContext.Provider value={{ parentLevel: currentLevel }}>
      {currentLevel === 0 ? (
        <FormGroupLevelsManager>
          <FormGroupWrapper>{children}</FormGroupWrapper>
        </FormGroupLevelsManager>
      ) : (
        <FormGroupWrapper>{children}</FormGroupWrapper>
      )}
    </FormGroupContext.Provider>
  );
};
