import * as React from 'react';

type UnsavedChangesGuardContextValue = {
  trackedFields: string[];
  registerField: ({ name }: { name: string }) => void;
  unregisterField: ({ name }: { name: string }) => void;
};

const UnsavedChangesGuardContext =
  React.createContext<UnsavedChangesGuardContextValue>({
    trackedFields: [],
    registerField: () => {
      return undefined;
    },
    unregisterField: () => {
      return undefined;
    },
  });

export const UnsavedChangesGuardProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [trackedFieldsSet, setTrackedFieldsSet] = React.useState<Set<string>>(
    () => {
      return new Set();
    }
  );

  const registerField = React.useCallback(({ name }: { name: string }) => {
    setTrackedFieldsSet((previousFields) => {
      if (previousFields.has(name)) {
        return previousFields;
      }

      const nextFields = new Set(previousFields);
      nextFields.add(name);
      return nextFields;
    });
  }, []);

  const unregisterField = React.useCallback(({ name }: { name: string }) => {
    setTrackedFieldsSet((previousFields) => {
      if (!previousFields.has(name)) {
        return previousFields;
      }

      const nextFields = new Set(previousFields);
      nextFields.delete(name);
      return nextFields;
    });
  }, []);

  const trackedFields = React.useMemo(() => {
    return Array.from(trackedFieldsSet);
  }, [trackedFieldsSet]);

  const value = React.useMemo(() => {
    return {
      trackedFields,
      registerField,
      unregisterField,
    };
  }, [trackedFields, registerField, unregisterField]);

  return (
    <UnsavedChangesGuardContext.Provider value={value}>
      {children}
    </UnsavedChangesGuardContext.Provider>
  );
};

export const useUnsavedChangesGuardContext = () => {
  return React.useContext(UnsavedChangesGuardContext);
};
