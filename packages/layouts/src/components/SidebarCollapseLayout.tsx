import { Flex, Stack, type StackProps } from '@ttoss/ui';

import { getSematicElements } from '../getSemanticElements';
import { LayoutProvider } from './LayoutProvider';

export const SidebarCollapseLayout = ({
  children,
  ...props
}: React.PropsWithChildren<StackProps>) => {
  const { header, main, sidebar } = getSematicElements({ children });

  return (
    <LayoutProvider>
      <Stack
        {...props}
        sx={{
          height: ['100vh'],
          width: 'full',
          overflow: 'hidden',
          ...props.sx,
        }}
      >
        {header}
        <Flex
          sx={{
            width: 'full',
            flex: 1,
            overflow: 'hidden',
            flexDirection: ['column', 'row', 'row'],
          }}
        >
          {sidebar}
          {main}
        </Flex>
      </Stack>
    </LayoutProvider>
  );
};
