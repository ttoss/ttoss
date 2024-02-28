import * as React from 'react';
import { Box, Button, Flex, Link } from '@ttoss/ui';
import { Menu } from '@ttoss/components';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'Components/Menu',
} as Meta;

const Template: Story = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(true);

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsMenuOpen(true);
        }}
      >
        Open Menu
      </Button>

      <Menu
        srcLogo="https://placehold.co/600x400"
        isOpen={isMenuOpen}
        onClose={() => {
          return setIsMenuOpen(false);
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
