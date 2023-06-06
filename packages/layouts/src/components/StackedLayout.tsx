import { BaseLayout, type BaseLayoutProps } from './BaseLayout';
import { getSematicElements } from '../getSemanticElements';

export const StackedLayout = ({ children, ...props }: BaseLayoutProps) => {
  const { header, main, footer } = getSematicElements({ children });

  return (
    <BaseLayout
      {...props}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        ...props.sx,
      }}
    >
      {header}
      {main}
      {footer}
    </BaseLayout>
  );
};
