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
        muted: { default: string };
        negative: { default: string };
        caution: { default: string };
      };
      text: {
        primary: { default: string };
        accent: { default: string };
        secondary: { default: string };
        muted: { default: string };
        negative: { default: string };
        caution: { default: string };
      };
    };
    display: {
      border: { muted: { default: string } };
      text: {
        accent: { default: string };
        muted: { default: string };
      };
      background: {
        muted: { default: string };
      };
    };
    feedback: {
      background: {
        positive: { default: string };
        caution: { default: string };
        negative: { default: string };
      };
      text: {
        positive: { default: string };
        caution: { default: string };
        negative: { default: string };
      };
    };
  };
}

type ButtonPropType = ButtonProps | React.ReactNode;

export type SpotlightCardProps = {
  /**
   * Icon to display. Can be an icon string from @ttoss/react-icons or a custom ReactNode (SVG, component, etc.)
   */
  icon: React.ReactNode;
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
  variant?: 'accent' | 'primary' | 'positive' | 'caution' | 'negative';
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

  // --- VARIANT CONFIG ---
  const variantConfig = {
    accent: {
      textColor: 'action.text.accent.default',
      iconColor: 'action.text.accent.default',
      iconBg: 'rgba(255,255,255,0.3)',
      badgeBg: 'action.background.primary.default',
      badgeText: 'action.text.primary.default',
      btnPrimaryVariant: 'primary',
      btnPrimaryColor: 'action.text.primary.default',
      btnSecondaryBorder: 'currentColor',
      borderColor: 'transparent',
      bgStart: 'action.background.accent.default',
      bgMiddle: 'action.background.accent.active',
      useOverlay: true,
    },
    primary: {
      textColor: 'action.text.primary.default',
      iconColor: 'display.text.accent.default',
      iconBg: 'action.background.secondary.default',
      badgeBg: 'action.background.accent.default',
      badgeText: 'action.text.accent.default',
      btnPrimaryVariant: 'accent',
      btnPrimaryColor: 'action.text.accent.default',
      btnSecondaryBorder: 'display.border.muted.default',
      borderColor: 'display.border.muted.default',
      bgStart: 'action.background.primary.default',
      bgMiddle: 'action.background.secondary.default',
      useOverlay: false,
    },
    positive: {
      textColor: '#0a5f0a',
      iconColor: '#0a5f0a',
      iconBg: 'rgba(200,255,200,0.5)',
      badgeBg: '#0a5f0a',
      badgeText: '#ffffff',
      btnPrimaryVariant: 'primary',
      btnPrimaryColor: 'action.text.primary.default',
      btnSecondaryBorder: 'currentColor',
      borderColor: '#22c55e',
      bgStart: '#22c55e',
      bgMiddle: '#16a34a',
      useOverlay: true,
    },
    caution: {
      textColor: '#92400e',
      iconColor: '#92400e',
      iconBg: 'rgba(255,240,200,0.5)',
      badgeBg: '#92400e',
      badgeText: '#ffffff',
      btnPrimaryVariant: 'primary',
      btnPrimaryColor: 'action.text.primary.default',
      btnSecondaryBorder: 'currentColor',
      borderColor: '#fbbf24',
      bgStart: '#fbbf24',
      bgMiddle: '#f59e0b',
      useOverlay: true,
    },
    negative: {
      textColor: '#7f1d1d',
      iconColor: '#7f1d1d',
      iconBg: 'rgba(255,200,200,0.5)',
      badgeBg: '#7f1d1d',
      badgeText: '#ffffff',
      btnPrimaryVariant: 'primary',
      btnPrimaryColor: 'action.text.primary.default',
      btnSecondaryBorder: 'currentColor',
      borderColor: '#ef4444',
      bgStart: '#ef4444',
      bgMiddle: '#dc2626',
      useOverlay: true,
    },
  };

  const config = variantConfig[variant];

  const textColorToken = config.textColor;
  const iconColorToken = config.iconColor;
  const iconBgToken = config.iconBg;
  const badgeBgToken = config.badgeBg;
  const badgeTextToken = config.badgeText;
  const btnPrimaryVariant = config.btnPrimaryVariant;
  const btnPrimaryColorToken = config.btnPrimaryColor;
  const btnSecondaryColorToken = config.textColor;
  const btnSecondaryBorderColorToken = config.btnSecondaryBorder;

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

          // Helper to get nested color value
          const getColor = (path: string) => {
            const parts = path.split('.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let value: any = theme.colors;
            for (const part of parts) {
              value = value?.[part];
            }
            return typeof value === 'object' ? value.default : value;
          };

          const bgStart = getColor(config.bgStart);
          const bgMiddle = getColor(config.bgMiddle);

          if (config.useOverlay) {
            return `linear-gradient(270deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%), 
                    linear-gradient(0deg, ${bgStart}, ${bgStart})`;
          }
          return `linear-gradient(270deg, ${bgStart}, ${bgMiddle}, ${bgStart})`;
        },
        backgroundSize: config.useOverlay ? '300% 100%, auto' : '600% 600%',
        animation: `${gradientFlow} 3s ease infinite`,
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
        borderColor: config.borderColor,
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
          {typeof icon === 'string' ? (
            <Box
              // @ts-expect-error - iconify-icon is a custom element
              as="iconify-icon"
              {...{ icon }}
              width={32}
              height={32}
            />
          ) : (
            icon
          )}
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
              opacity: config.useOverlay ? 0.6 : 1,
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
