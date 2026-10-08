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
  icon: IconType;
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

type SpotlightTokens = {
  text: string;
  icon: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  primaryButtonVariant: string;
  primaryButtonText: string;
  secondaryButtonBorder: string;
  border: string;
  backgroundSize: string;
};

const TOKENS: Record<'accent' | 'primary', SpotlightTokens> = {
  accent: {
    text: 'action.text.accent.default',
    icon: 'action.text.accent.default',
    iconBg: 'rgba(255,255,255,0.3)',
    badgeBg: 'action.background.primary.default',
    badgeText: 'action.text.primary.default',
    primaryButtonVariant: 'primary',
    primaryButtonText: 'action.text.primary.default',
    secondaryButtonBorder: 'currentColor',
    border: 'transparent',
    backgroundSize: '200% 100%, auto',
  },
  primary: {
    text: 'action.text.primary.default',
    icon: 'display.text.accent.default',
    iconBg: 'action.background.secondary.default',
    badgeBg: 'action.background.accent.default',
    badgeText: 'action.text.accent.default',
    primaryButtonVariant: 'accent',
    primaryButtonText: 'action.text.accent.default',
    secondaryButtonBorder: 'display.border.muted.default',
    border: 'display.border.muted.default',
    backgroundSize: '400% 400%',
  },
};

const gradientFlow = keyframes({
  '0%': { backgroundPosition: '0% 50%' },
  '50%': { backgroundPosition: '100% 50%' },
  '100%': { backgroundPosition: '0% 50%' },
});

const getAccentBackground = (theme: SpotlightTheme) => {
  const bg = theme.colors?.action?.background?.accent?.default;

  return `linear-gradient(270deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%),
                    linear-gradient(0deg, ${bg}, ${bg})`;
};

const getPrimaryBackground = (theme: SpotlightTheme) => {
  const background = theme.colors?.action?.background;
  const bgStart = background?.primary?.default;
  const bgMiddle = background?.secondary?.default;

  return `linear-gradient(270deg, ${bgStart}, ${bgMiddle}, ${bgStart})`;
};

const SpotlightButton = ({
  prop,
  variant,
  textColor,
  styles,
}: {
  prop: ButtonPropType;
  variant: string;
  textColor: string;
  styles: object;
}) => {
  if (!prop) return null;
  if (React.isValidElement(prop)) return prop;
  if (typeof prop !== 'object') return <>{prop}</>;

  const { sx, ...rest } = prop as ButtonProps;

  return (
    <Button
      variant={variant}
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
        flex: ['1 1 auto', '0 1 auto'],
        color: textColor,
        ...styles,
        ...sx,
      }}
      {...rest}
    />
  );
};

const SpotlightContent = ({
  icon,
  title,
  badge,
  description,
  tokens,
}: Pick<SpotlightCardProps, 'icon' | 'title' | 'badge' | 'description'> & {
  tokens: SpotlightTokens;
}) => {
  return (
    <Flex sx={{ alignItems: 'center', gap: ['4', '5'], flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          width: [48, 64],
          height: [48, 64],
          borderRadius: '2xl',
          backgroundColor: tokens.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: tokens.icon,
        }}
      >
        <Icon icon={icon} width={32} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Text
          as="div"
          sx={{
            fontFamily: 'mono',
            fontSize: ['24px', '32px'],
            lineHeight: 1.1,
            color: 'inherit',
            // On a phone a long title (an ad account name) was cut mid-word
            // with no ellipsis; wrapping keeps it readable.
            whiteSpace: ['normal', 'nowrap'],
            overflowWrap: 'anywhere',
            display: 'flex',
            flexWrap: ['wrap', 'nowrap'],
            alignItems: 'center',
            gap: '3',
          }}
        >
          {title}

          {badge && (
            <Box
              as="span"
              sx={{
                backgroundColor: tokens.badgeBg,
                color: tokens.badgeText,
                fontFamily: 'mono',
                fontWeight: 'bold',
                fontSize: '11px',
                lineHeight: 1,
                paddingX: '6px',
                paddingY: '3px',
                borderRadius: 'md',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                // Optical vertical alignment with the title.
                transform: 'translateY(3px)',
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
            fontSize: ['14px', '16px'],
            color: 'inherit',
            opacity: 0.9,
            mt: '1',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            // A phone line holds about half a desktop line, so two lines cut
            // most descriptions mid-sentence.
            WebkitLineClamp: [4, 2],
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </Text>
      </Box>
    </Flex>
  );
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
  const hasButtons = !!firstButton || !!secondButton;
  const isAccent = variant === 'accent';
  const tokens = TOKENS[isAccent ? 'accent' : 'primary'];

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: ['row'],
        // On a phone the buttons drop below the text instead of squeezing it.
        flexWrap: ['wrap', 'nowrap'],
        alignItems: 'center',
        justifyContent: 'space-between',
        background: (t) => {
          const theme = t as SpotlightTheme;
          return isAccent
            ? getAccentBackground(theme)
            : getPrimaryBackground(theme);
        },
        backgroundSize: tokens.backgroundSize,
        animation: `${gradientFlow} 6s ease infinite`,
        width: '100%',
        minHeight: '104px',
        borderRadius: 'xl',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        py: ['5', '7'],
        px: ['5', '8'],
        gap: ['4', '5'],
        color: tokens.text,
        overflow: 'hidden',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: tokens.border,
      }}
      data-testid="spotlight-card"
    >
      <SpotlightContent
        icon={icon}
        title={title}
        badge={badge}
        description={description}
        tokens={tokens}
      />

      {hasButtons && (
        <Flex
          sx={{
            gap: ['3', '4'],
            alignItems: 'center',
            flexShrink: 0,
            // On a phone the pair takes the card's width and wraps, rather
            // than running past the edge the card clips.
            flexWrap: ['wrap', 'nowrap'],
            width: ['100%', 'auto'],
            ml: 'auto',
          }}
        >
          <SpotlightButton
            prop={firstButton}
            variant={tokens.primaryButtonVariant}
            textColor={tokens.primaryButtonText}
            styles={{ ':hover': { transform: 'translateY(-1px)' } }}
          />

          <SpotlightButton
            prop={secondButton}
            variant="secondary"
            textColor={tokens.text}
            styles={{
              backgroundColor: 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: tokens.secondaryButtonBorder,
              opacity: isAccent ? 0.6 : 1,
              cursor: 'pointer',
              ':hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                opacity: 1,
                borderColor: tokens.secondaryButtonBorder,
              },
            }}
          />
        </Flex>
      )}
    </Card>
  );
};

SpotlightCard.displayName = 'SpotlightCard';
