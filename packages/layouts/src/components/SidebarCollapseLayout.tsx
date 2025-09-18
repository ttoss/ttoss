import { Flex, Stack, type StackProps } from '@ttoss/ui';

import { getSematicElements } from '../getSemanticElements';
import { LayoutProvider } from './LayoutProvider';

export const SidebarCollapseLayout = ({
  children,
  ...props
}: React.PropsWithChildren<StackProps>) => {
  const { header, main, sidebar, mainFooter, mainHeader } = getSematicElements({
    children,
  });

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
            flexDirection: ['row'],
          }}
        >
          {sidebar}
          <Stack
            sx={{
              flex: 1,
              height: 'full',
              overflow: 'hidden',
            }}
          >
            {mainHeader}
            {main}
            {mainFooter}
          </Stack>
        </Flex>
      </Stack>
    </LayoutProvider>
  );
};
