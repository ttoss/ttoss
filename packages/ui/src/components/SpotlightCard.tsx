import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

interface SpotlightTheme {
  colors: {
    action: {
      background: {
        primary: { default: string };
        secondary: { default: string };
      };
    };
  };
}

type ButtonPropType = React.ComponentProps<typeof Button> | React.ReactNode;

export type SpotlightCardProps = {
  iconSymbol: string;
  title: string;
  subtitle?: string;
  description: string;
  firstButton?: ButtonPropType;
  secondButton?: ButtonPropType;
};

export const SpotlightCard = ({
  iconSymbol,
  title,
  subtitle,
  description,
  firstButton,
  secondButton,
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

  const renderButton = (
    prop: ButtonPropType,
    defaultVariant: string,
    customStyles: object = {}
  ) => {
    if (!prop) return null;

    if (React.isValidElement(prop)) {
      return prop;
    }

    const { sx, ...rest } = prop as React.ComponentProps<typeof Button>;

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
          ...customStyles,
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
          return `linear-gradient(270deg, 
            ${theme.colors?.action?.background?.primary?.default || '#111827'}, 
            ${theme.colors?.action?.background?.secondary?.default || '#465A69'}, 
            ${theme.colors?.action?.background?.primary?.default || '#111827'})`;
        },
        backgroundSize: '400% 400%',
        animation: 'ocaGradientFlow 8s ease infinite',
        width: '100%',
        minHeight: '104px',
        borderRadius: 'xl',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        py: '7',
        px: '8',
        gap: '5',
        color: 'action.text.primary.default',
        overflow: 'hidden',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'display.border.muted.default',
      }}
      data-testid="spotlight-card"
    >
      <Flex sx={{ alignItems: 'center', gap: '5', flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '2xl',
            backgroundColor: 'action.background.secondary.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'display.text.accent.default',
          }}
        >
          {/* O ícone principal continua usando o componente Icon diretamente, pois não é um botão */}
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
              color: 'action.text.secondary.default',
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
          {/* BOTÃO PRIMÁRIO */}
          {renderButton(firstButton, 'accent', {
            color: 'action.text.accent.default',
            ':hover': { transform: 'translateY(-1px)' },
          })}

          {/* BOTÃO SECUNDÁRIO */}
          {renderButton(secondButton, 'secondary', {
            backgroundColor: 'transparent',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'display.border.muted.default',
            color: 'action.text.primary.default',
            cursor: 'pointer',
            ':hover': {
              backgroundColor: 'action.background.secondary.default',
              borderColor: 'display.border.muted.default',
            },
          })}
        </Flex>
      )}
    </Card>
  );
};

SpotlightCard.displayName = 'SpotlightCard';
