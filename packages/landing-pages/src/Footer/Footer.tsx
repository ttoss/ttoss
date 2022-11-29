import { Flex, Grid, Icon, Image, Link, Text } from '@ttoss/ui';

type FooterLink = {
  label: string;
  href: string;
};

type SocialMedia = {
  icon: string;
  href: string;
};

export type FooterProps = {
  links: FooterLink[];
  logo: string;
  socialMedia: SocialMedia[];
  reserved: string;
};

export const Footer = ({ links, logo, socialMedia, reserved }: FooterProps) => {
  return (
    <Flex sx={{ flexDirection: 'column', paddingY: '40px' }}>
      <Image
        sx={{
          maxWidth: ['90px', '212px'],
          alignSelf: 'center',
          marginBottom: [3, 4],
        }}
        src={logo}
      />

      <Flex
        sx={{
          flexDirection: ['column', 'row'],
          justifyContent: ['unset', 'center'],
          paddingX: 3,
        }}
      >
        <Grid
          sx={{
            justifyContent: 'center',
            gridTemplateColumns: ['6fr 3fr 3fr', '1fr 1fr 1fr'],
          }}
        >
          {links.map((link, idx) => {
            return (
              <Link
                sx={{
                  fontSize: 'xs',
                  fontFamily: 'body',
                  textDecorationLine: 'none',
                }}
                key={`link-${link.label}-${idx}`}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </Grid>

        <Flex
          sx={{
            marginTop: [3],
            gap: [4],
            justifyContent: 'center',
          }}
        >
          {socialMedia.map((social) => {
            return (
              <Link href={social.href} key={`social-media-${social.icon}`}>
                <Icon icon={social.icon} />
              </Link>
            );
          })}
        </Flex>
      </Flex>

      <Text
        sx={{
          fontSize: 'xxs',
          color: 'gray',
          fontFamily: 'heading',
          textAlign: 'center',
          lineHeight: '1.5',
          marginTop: [3, 4],
        }}
      >
        {reserved}
      </Text>
    </Flex>
  );
};
