import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Menu } from '@ttoss/components/Menu';
import { Box, Flex, Link } from '@ttoss/ui';
import * as React from 'react';

export default {
  title: 'Components/Menu',
} as Meta;

const Template: StoryFn = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <Menu
        onOpen={() => {
          setIsMenuOpen(true);
        }}
        srcLogo="https://placehold.co/600x400"
        isOpen={isMenuOpen}
        onClose={() => {
          setIsMenuOpen(false);
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'md',
            '> *': {
              fontSize: 'lg',
            },
          }}
        >
          <Box>
            <Link quiet onClick={handleClose} href="#link1">
              Link 1
            </Link>
          </Box>
          <Box>
            <Link quiet onClick={handleClose} href="#link2">
              Link 2
            </Link>
          </Box>
          <Box>
            <Link quiet onClick={handleClose} href="#link3">
              Link 3
            </Link>
          </Box>
        </Flex>
      </Menu>
    </>
  );
};

export const Example = Template.bind({});
