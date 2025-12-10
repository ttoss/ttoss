import * as React from 'react';
import { Container as ContainerUi, type ContainerProps } from 'theme-ui';

export type { ContainerProps };

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (props, ref) => {
    return <ContainerUi ref={ref} {...props} />;
  }
);

Container.displayName = 'Container';
