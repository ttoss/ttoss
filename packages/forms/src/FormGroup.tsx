import { Flex, FlexProps } from '@ttoss/ui';
import React from 'react';

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
  direction?: 'column' | 'row';
} & FlexProps;

const FormGroupWrapper = (props: FormGroupProps) => {
  const { level, levelsLength } = useFormGroup();

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

  const sx: FlexProps['sx'] = {
    flexDirection: props.direction || 'column',
    width: '100%',
    gap: 3 * (levelsLength - (level || 0)),
    paddingX: level ? 'md' : 'none',
    ...props.sx,
  };

  return (
    <Flex aria-level={level} {...props} sx={sx}>
      {props.children}
    </Flex>
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
