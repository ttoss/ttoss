import { BaseLayout } from './BaseLayout';
import { getSematicElements } from '../getSemanticElements';

export const StackedLayout = ({ children }: { children: React.ReactNode }) => {
  const { header, main, footer } = getSematicElements({ children });

  return (
    <BaseLayout
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {header}
      {main}
      {footer}
    </BaseLayout>
  );
};
