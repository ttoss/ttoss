import { Flex, Stack, type StackProps } from '@ttoss/ui';

import { getSematicElements } from '../getSemanticElements';
import { GlobalProvider } from './GlobalProvider';

export const SidebarCollapseLayout = ({
  children,
  ...props
}: React.PropsWithChildren<StackProps>) => {
  const { header, main, sidebar } = getSematicElements({ children });

  return (
    <GlobalProvider>
      <Stack
        {...props}
        sx={{
          width: 'full',
          display: 'flex',
          flexDirection: 'column',
          ...props.sx,
        }}
      >
        {header}
        <Flex>
          {sidebar}
          {main}
        </Flex>
      </Stack>
    </GlobalProvider>
  );
};
