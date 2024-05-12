import * as React from 'react';
import { Box, BoxProps, Flex, FlexProps, Text } from '@ttoss/ui';
import { FormErrorMessage } from './FormErrorMessage';

type FormGroupLevelsManagerContextType = {
  levelsLength: number;
  registerChild: (level: number) => void;
};

const FormGroupLevelsManagerContext =
  React.createContext<FormGroupLevelsManagerContextType>({
    levelsLength: 1,
    registerChild: () => {
      return null;
    },
  });

const FormGroupLevelsManager = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [levelsLength, setLevelsLength] = React.useState(0);

  const registerChild = React.useCallback(
    (level: number) => {
      if (level + 1 > levelsLength) {
        setLevelsLength(level + 1);
      }
    },
    [levelsLength]
  );

  return (
    <FormGroupLevelsManagerContext.Provider
      value={{ levelsLength, registerChild }}
    >
      {children}
    </FormGroupLevelsManagerContext.Provider>
  );
};

type FormGroupContextType = {
  parentLevel?: number;
};

const FormGroupContext = React.createContext<FormGroupContextType>({});

export const useFormGroup = () => {
  const { parentLevel } = React.useContext(FormGroupContext);
  const { levelsLength } = React.useContext(FormGroupLevelsManagerContext);

  return {
    level: parentLevel,
    levelsLength,
  };
};

type FormGroupProps = {
  name?: string;
  title?: string;
  direction?: 'column' | 'row';
} & BoxProps;

const FormGroupWrapper = ({
  title,
  direction,
  children,
  name,
  ...boxProps
}: FormGroupProps) => {
  const { level } = useFormGroup();

  const { registerChild } = React.useContext(FormGroupLevelsManagerContext);

  React.useEffect(() => {
    /**
     * We can't use if(level) because level can be 0 and we want to register
     * it anyway.
     */
    if (typeof level === 'number') {
      registerChild(level);
    }
  }, [level, registerChild]);

  const childrenContainerSx: FlexProps['sx'] = {
    flexDirection: direction || 'column',
    gap: 'md',
    width: '100%',
  };

  return (
    <Box
      aria-level={level}
      {...boxProps}
      sx={{
        marginTop: level === 0 ? 'none' : 'lg',
        marginBottom: 'lg',
        ...boxProps.sx,
      }}
    >
      {title && (
        <Box sx={{ marginBottom: 'md' }}>
          <Text
            sx={{
              fontSize: '2xl',
              fontWeight: 'bold',
            }}
          >
            {title}
          </Text>
        </Box>
      )}
      <Flex sx={childrenContainerSx}>{children}</Flex>
      {name && <FormErrorMessage name={name} />}
    </Box>
  );
};

export const FormGroup = (props: FormGroupProps) => {
  const { level } = useFormGroup();

  const currentLevel = level === undefined ? 0 : level + 1;

  return (
    <FormGroupContext.Provider value={{ parentLevel: currentLevel }}>
      {currentLevel === 0 ? (
        <FormGroupLevelsManager>
          <FormGroupWrapper {...props} />
        </FormGroupLevelsManager>
      ) : (
        <FormGroupWrapper {...props} />
      )}
    </FormGroupContext.Provider>
  );
};
