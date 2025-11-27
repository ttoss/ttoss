import { Icon, type IconType } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Text } from '@ttoss/ui';
import { ButtonProps } from '@ttoss/ui';
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
  iconSymbol: IconType;
  title: string;
  subtitle?: string;
  description: string;
  firstButton?: ButtonPropType;
  secondButton?: ButtonPropType;
  /**
   * Visual variant of the card.
   * - 'accent': (Default) Highlighted background (Action Accent) with shine animation.
   * - 'dark': Dark background (Action Primary).
   * @default 'accent'
   */
  variant?: 'accent' | 'dark';
};

export const SpotlightCard = ({
  iconSymbol,
  title,
  subtitle,
  description,
  firstButton,
  secondButton,
  variant = 'accent',
}: SpotlightCardProps) => {
  React.useEffect(() => {
    const styleId = 'oca-spotlight-animations-v2';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes ocaGradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const hasButtons = !!firstButton || !!secondButton;
  const isAccent = variant === 'accent';

  // --- COLOR DECISION LOGIC ---

  // 1. Main text colors of the card
  const textColorToken = isAccent
    ? 'action.text.accent.default'
    : 'action.text.primary.default';

  // 2. Icon colors
  const iconColorToken = isAccent
    ? 'action.text.accent.default'
    : 'display.text.accent.default';
  const iconBgToken = isAccent
    ? 'rgba(255,255,255,0.3)'
    : 'action.background.secondary.default';

  // 3. Primary button configuration
  const btnPrimaryVariant = isAccent ? 'primary' : 'accent';
  const btnPrimaryColorToken = isAccent
    ? 'action.text.primary.default'
    : 'action.text.accent.default';

  // 4. Secondary button configuration
  const btnSecondaryColorToken = textColorToken;
  const btnSecondaryBorderColorToken = isAccent
    ? 'currentColor'
    : 'display.border.muted.default';

  // --- HELPER TO RENDER BUTTONS ---
  const renderButton = (
    prop: ButtonPropType,
    config: {
      variant: string;
      textColor: string;
      styles?: object;
    }
  ) => {
    if (!prop) return null;
    if (React.isValidElement(prop)) return prop;

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
            // Shine animation for Accent variant
            return `linear-gradient(270deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%), 
                    linear-gradient(0deg, ${bgStart}, ${bgStart})`;
          }

          // Default gradient for Dark mode
          return `linear-gradient(270deg, ${bgStart}, ${bgMiddle}, ${bgStart})`;
        },
        backgroundSize: isAccent ? '200% 100%, auto' : '400% 400%',
        animation: 'ocaGradientFlow 6s ease infinite',
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
            width: 58,
            height: 58,
            borderRadius: '2xl',
            backgroundColor: iconBgToken,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: iconColorToken,
          }}
        >
          <Icon icon={iconSymbol} width={28} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Text
            as="div"
            sx={{
              fontFamily: 'heading',
              fontWeight: 800,
              fontSize: '24px',
              lineHeight: 1.2,
              color: 'inherit',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2',
            }}
          >
            <span
              style={{
                fontWeight: 800,
                letterSpacing: '-0.5px',
                verticalAlign: 'middle',
                lineHeight: 1.1,
              }}
            >
              {title}
            </span>
            {subtitle && (
              <span
                style={{
                  fontWeight: 300,
                  fontSize: '20px',
                  opacity: 0.8,
                  marginLeft: 6,
                  verticalAlign: 'baseline',
                  lineHeight: 1.1,
                }}
              >
                {subtitle}
              </span>
            )}
          </Text>
          <Text
            as="div"
            sx={{
              fontFamily: 'body',
              fontWeight: 400,
              fontSize: '15px',
              color: 'inherit',
              opacity: 0.85,
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
          {/* PRIMARY BUTTON */}
          {renderButton(firstButton, {
            variant: btnPrimaryVariant,
            textColor: btnPrimaryColorToken,
            styles: {
              ':hover': { transform: 'translateY(-1px)' },
            },
          })}

          {/* SECONDARY BUTTON */}
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
