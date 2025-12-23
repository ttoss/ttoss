import { Icon, type IconType } from '@ttoss/react-icons';
import type { ButtonProps } from '@ttoss/ui';
import { Box, Button, Card, Flex, keyframes, Text } from '@ttoss/ui';
import * as React from 'react';

interface SpotlightTheme {
  colors: {
    action: {
      background: {
        primary: { default: string };
        secondary: { default: string };
        accent: { default: string; active?: string };
      };
      text: {
        primary: { default: string };
        accent: { default: string };
      };
    };
    display: {
      border: { muted: { default: string } };
      text: { accent: { default: string } };
    };
  };
}

type ButtonPropType = ButtonProps | React.ReactNode;

export type SpotlightCardProps = {
  /**
   * The icon to display. Can be a string identifier (e.g., 'home', 'user') or an IconType object for custom icons.
   */
  icon: string | IconType;
  /**
   * Title of the card. Pass a ReactNode for styling.
   */
  title: string | React.ReactNode;
  /**
   * Badge text. Renders as a badge/tag next to the title.
   */
  badge?: string | React.ReactNode;
  description: string;
  firstButton?: ButtonPropType;
  secondButton?: ButtonPropType;
  variant?: 'accent' | 'primary';
};

export const SpotlightCard = ({
  icon,
  title,
  badge,
  description,
  firstButton,
  secondButton,
  variant = 'accent',
}: SpotlightCardProps) => {
  const gradientFlow = keyframes({
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  });

  const hasButtons = !!firstButton || !!secondButton;
  const isAccent = variant === 'accent';

  // --- COLORS ---
  const textColorToken = isAccent
    ? 'action.text.accent.default'
    : 'action.text.primary.default';

  const iconColorToken = isAccent
    ? 'action.text.accent.default'
    : 'display.text.accent.default';

  const iconBgToken = isAccent
    ? 'rgba(255,255,255,0.3)'
    : 'action.background.secondary.default';

  // Badge Colors
  const badgeBgToken = isAccent
    ? 'action.background.primary.default'
    : 'action.background.accent.default';

  const badgeTextToken = isAccent
    ? 'action.text.primary.default'
    : 'action.text.accent.default';

  // Buttons Colors
  const btnPrimaryVariant = isAccent ? 'primary' : 'accent';
  const btnPrimaryColorToken = isAccent
    ? 'action.text.primary.default'
    : 'action.text.accent.default';

  const btnSecondaryColorToken = textColorToken;
  const btnSecondaryBorderColorToken = isAccent
    ? 'currentColor'
    : 'display.border.muted.default';

  const renderButton = (
    prop: ButtonPropType,
    config: { variant: string; textColor: string; styles?: object }
  ) => {
    if (!prop) return null;
    if (React.isValidElement(prop)) return prop;
    if (typeof prop !== 'object') return prop;

    const { sx, ...rest } = prop as ButtonProps;
    const { variant: defaultVariant, textColor, styles = {} } = config;

    return (
      <Button
        variant={defaultVariant}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2',
          px: '6',
          py: '3',
          fontSize: '15px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          color: textColor,
          ...styles,
          ...sx,
        }}
        {...rest}
      />
    );
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: (t) => {
          const theme = t as SpotlightTheme;
          const bgStart = isAccent
            ? theme.colors?.action?.background?.accent?.default
            : theme.colors?.action?.background?.primary?.default;
          const bgMiddle = isAccent
            ? theme.colors?.action?.background?.accent?.active
            : theme.colors?.action?.background?.secondary?.default;

          if (isAccent) {
            return `linear-gradient(270deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%), 
                    linear-gradient(0deg, ${bgStart}, ${bgStart})`;
          }
          return `linear-gradient(270deg, ${bgStart}, ${bgMiddle}, ${bgStart})`;
        },
        backgroundSize: isAccent ? '200% 100%, auto' : '400% 400%',
        animation: `${gradientFlow} 6s ease infinite`,
        width: '100%',
        minHeight: '104px',
        borderRadius: 'xl',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        py: '7',
        px: '8',
        gap: '5',
        color: textColorToken,
        overflow: 'hidden',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isAccent ? 'transparent' : 'display.border.muted.default',
      }}
      data-testid="spotlight-card"
    >
      <Flex sx={{ alignItems: 'center', gap: '5', flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 64, // Aumentei levemente o box do ícone
            height: 64,
            borderRadius: '2xl',
            backgroundColor: iconBgToken,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: iconColorToken,
          }}
        >
          <Icon icon={icon} width={32} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Text
            as="div"
            sx={{
              fontFamily: 'mono',
              // Tamanho da fonte aumentado para dar mais presença ao OneClick
              fontSize: '32px',
              lineHeight: 1.1,
              color: 'inherit',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '3',
            }}
          >
            {/* Renderiza o título diretamente */}
            {title}

            {badge && (
              <Box
                as="span"
                sx={{
                  backgroundColor: badgeBgToken,
                  color: badgeTextToken,
                  fontFamily: 'mono',
                  fontWeight: 'bold',
                  fontSize: '11px', // Fonte menor para o badge
                  lineHeight: 1,
                  paddingX: '6px', // Padding horizontal reduzido
                  paddingY: '3px', // Padding vertical reduzido
                  borderRadius: 'md',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transform: 'translateY(3px)', // Pequeno ajuste ótico vertical
                }}
              >
                {badge}
              </Box>
            )}
          </Text>
          <Text
            as="div"
            sx={{
              fontFamily: 'body',
              fontWeight: 400,
              fontSize: '16px', // Leve aumento na descrição
              color: 'inherit',
              opacity: 0.9,
              mt: '1',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </Text>
        </Box>
      </Flex>

      {hasButtons && (
        <Flex
          sx={{ gap: '4', alignItems: 'center', flexShrink: 0, ml: 'auto' }}
        >
          {renderButton(firstButton, {
            variant: btnPrimaryVariant,
            textColor: btnPrimaryColorToken,
            styles: { ':hover': { transform: 'translateY(-1px)' } },
          })}

          {renderButton(secondButton, {
            variant: 'secondary',
            textColor: btnSecondaryColorToken,
            styles: {
              backgroundColor: 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: btnSecondaryBorderColorToken,
              opacity: isAccent ? 0.6 : 1,
              cursor: 'pointer',
              ':hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                opacity: 1,
                borderColor: btnSecondaryBorderColorToken,
              },
            },
          })}
        </Flex>
      )}
    </Card>
  );
};

SpotlightCard.displayName = 'SpotlightCard';
