import * as React from 'react';

type ErrorState = {
  type: 'error' | 'success';
  message: string;
};

const ErrorContext = React.createContext<{
  error: ErrorState | null;
  handleChangeError: (
    type: ErrorState['type'],
    message: ErrorState['message']
  ) => void;
  clearError: () => void;
}>({
  error: null,
  handleChangeError: () => {
    return null;
  },
  clearError: () => {
    return null;
  },
});

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = React.useState<ErrorState | null>(null);

  const handleChangeError = (
    type: ErrorState['type'],
    message: ErrorState['message']
  ) => {
    setError({ type, message });
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider value={{ error, handleChangeError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  return React.useContext(ErrorContext);
};
