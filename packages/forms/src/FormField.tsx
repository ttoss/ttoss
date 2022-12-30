import * as React from 'react';
import { Box, Label } from '@ttoss/ui';
import { ErrorMessage } from './ErrorMessage';
import {
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseControllerReturn,
  useController,
} from 'react-hook-form';

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  id: idProp,
  name,
  defaultValue,
  render,
}: {
  label?: string;
  id?: string;
  name: TName;
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  render: (
    props: UseControllerReturn<TFieldValues, TName>
  ) => React.ReactElement;
}) => {
  const controllerReturn = useController<TFieldValues, TName>({
    name,
    defaultValue,
  });

  const id = idProp || `form-field-${name}`;

  const memoizedRender = React.useMemo(() => {
    return React.Children.map(render(controllerReturn), (child) => {
      return React.createElement(child.type, { id, ...child.props });
    });
  }, [controllerReturn, id, render]);

  return (
    <Box>
      {label && <Label htmlFor={id}>{label}</Label>}
      {memoizedRender}
      <ErrorMessage name={name} />
    </Box>
  );
};
