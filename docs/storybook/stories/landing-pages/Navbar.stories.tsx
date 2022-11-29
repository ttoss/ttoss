import { Meta, Story } from '@storybook/react';
import { Navbar, NavbarProps } from '@ttoss/landing-pages';

export default {
  title: 'Landing Pages/Navbar',
  component: Navbar,
} as Meta;

const Template: Story<NavbarProps> = (args) => {
  return <Navbar {...args} />;
};

const BRUTTAL_LOGO =
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/logotipo-footer.png';

const BRUTTAL_LINKS = [
  { label: 'link1', href: '#' },
  { label: 'link2', href: '#' },
  { label: 'link3', href: '#' },
  { label: 'link4', href: '#' },
];

export const Example1 = Template.bind({});

Example1.args = {
  links: BRUTTAL_LINKS,
  logo: BRUTTAL_LOGO,
  cta: {
    label: 'Cta link',
    href: '#',
  },
  type: '1',
} as NavbarProps;

export const Example1WithoutCTA = Template.bind({});

Example1WithoutCTA.args = {
  links: BRUTTAL_LINKS,
  logo: BRUTTAL_LOGO,
  type: '1',
} as NavbarProps;

export const Example2 = Template.bind({});

Example2.args = {
  links: BRUTTAL_LINKS.slice(0, 3),
  logo: BRUTTAL_LOGO,
  cta: {
    label: 'Cta link',
    href: '#',
  },
  type: '2',
} as NavbarProps;

export const Example2WithoutCTA = Template.bind({});

Example2WithoutCTA.args = {
  links: BRUTTAL_LINKS,
  logo: BRUTTAL_LOGO,
  type: '2',
} as NavbarProps;
