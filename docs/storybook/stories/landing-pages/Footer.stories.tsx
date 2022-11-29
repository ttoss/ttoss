import { Footer, FooterProps } from '@ttoss/landing-pages';
import { Meta, Story } from '@storybook/react';

export default {
  title: 'Landing Pages/Footer',
  component: Footer,
} as Meta;

const Template: Story<FooterProps> = (args) => {
  return <Footer {...args} />;
};

const BRUTTAL_LOGO =
  'https://tt-sandbox-general-purpose.s3.amazonaws.com/modules/logotipo-footer.png';

const BRUTTAL_LINKS = [
  { label: 'Sobre o Bruttal', href: '#' },
  { label: 'link1', href: '#' },
  { label: 'link3', href: '#' },
  { label: 'Contato', href: '#' },
  { label: 'link2', href: '#' },
  { label: 'link4', href: '#' },
];

const BRUTTAL_SOCIAL_MEDIA = [
  { icon: 'carbon:logo-youtube', href: '#' },
  { icon: 'mdi:instagram', href: '#' },
  { icon: 'ri:facebook-fill', href: '#' },
  { icon: 'ic:baseline-whatsapp', href: '#' },
];

const BRUTTAL_RESERVED =
  'Bruttal 2022 @ Todos os direitos reservados. CNPJ 00.000.000/0001-00. Endereço aqui- SP, 13000-000. ';

export const Example = Template.bind({});

Example.args = {
  links: BRUTTAL_LINKS,
  logo: BRUTTAL_LOGO,
  socialMedia: BRUTTAL_SOCIAL_MEDIA,
  reserved: BRUTTAL_RESERVED,
} as FooterProps;
