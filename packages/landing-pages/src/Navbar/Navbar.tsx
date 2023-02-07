import { Collapse } from 'react-collapse';
import { Flex, Grid, Icon, Image, Link, Text } from '@ttoss/ui';
import React from 'react';

type NavbarLink = {
  label: string;
  href: string;
};

export type NavbarProps = {
  type?: '1' | '2';
  logo: string;
  cta?: {
    label: string;
    href: string;
  };
  links: NavbarLink[];
};

export const Navbar = ({ links, logo, cta, type = '1' }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const {
    gridTemplateAreas,
    heightLogo,
    gridTemplateColumns,
    justifySelfLogo,
  } = React.useMemo(() => {
    if (type === '1') {
      return {
        gridTemplateAreas: '"logo links cta"',
        gridTemplateColumns: '2fr 5fr 2fr',
        heightLogo: '42px',
        justifySelfLogo: 'unset',
      };
    }

    return {
      gridTemplateAreas: '"links logo cta"',
      gridTemplateColumns: '1fr 1fr 1fr',
      heightLogo: '54px',
      justifySelfLogo: 'center',
    };
  }, [type]);

  return (
    <>
      {/* Layout Mobile */}

      <Flex sx={{ flexDirection: 'column', display: ['flex', 'none'] }}>
        <Grid
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            gridTemplateColumns: '1fr 1fr 1fr',
          }}
        >
          <Text
            sx={{ cursor: 'pointer', justifySelf: 'start', fontSize: '3xl' }}
          >
            <Icon
              onClick={() => {
                setIsMenuOpen((prev) => {
                  return !prev;
                });
              }}
              icon={isMenuOpen ? 'ic:outline-menu-open' : 'ic:outline-menu'}
            />
          </Text>

          <Image src={logo} sx={{ maxWidth: '112px' }} />

          <Flex
            sx={{ justifyContent: 'end', width: '100%', alignItems: 'center' }}
          >
            {cta && (
              <Link sx={{ fontSize: 'xs' }} href={cta.href}>
                {cta.label}
              </Link>
            )}
          </Flex>
        </Grid>

        <Collapse
          isOpened={isMenuOpen}
          initialStyle={{ height: 0, overflow: 'hidden' }}
        >
          <Flex
            sx={{
              flexDirection: 'column',
              width: '100%',
              gap: 3,
              paddingY: 3,
              paddingLeft: 3,
            }}
          >
            {links.map((link) => {
              return (
                <Link sx={{ fontSize: 'xs' }} key={link.label} href={link.href}>
                  {link.label}
                </Link>
              );
            })}
          </Flex>
        </Collapse>
      </Flex>

      {/* Layout Desktop */}
      <Grid
        sx={{
          display: ['none', 'grid'],
          gridTemplateAreas,
          gridTemplateColumns,
          alignItems: 'center',
          paddingX: 6,
          paddingY: 4,
        }}
      >
        <Image
          sx={{
            gridArea: 'logo',
            height: heightLogo,
            justifySelf: justifySelfLogo,
          }}
          src={logo}
        />

        <Flex sx={{ gridArea: 'links', justifyContent: 'space-around' }}>
          {links.map((link) => {
            return (
              <Link sx={{ fontSize: '2xl' }} key={link.label} href={link.href}>
                {link.label}
              </Link>
            );
          })}
        </Flex>

        <Flex sx={{ gridArea: 'cta', justifyContent: 'end' }}>
          {cta && (
            <Link
              href={cta.href}
              sx={{
                backgroundColor: 'background',
                borderColor: 'text',
                color: 'text',
                borderRadius: '10px',
                fontSize: 'base',
                textDecorationLine: 'none',
                paddingX: 3,
                paddingY: 2,
              }}
              as="button"
            >
              {cta.label}
            </Link>
          )}
        </Flex>
      </Grid>
    </>
  );
};
