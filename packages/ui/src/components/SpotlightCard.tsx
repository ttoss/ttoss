import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

// Typing to accept Button props or a custom component
type ButtonPropType = React.ComponentProps<typeof Button> | React.ReactNode;

export type SpotlightCardProps = {
  /** Main title (Required) */
  title: string;
  /** Subtitle (Optional) */
  subtitle?: string;
  /** Detailed description (Required) */
  description: string;
  /** Material/SVG icon string (Required) */
  iconSymbol: string;
  /** First button: Can be an object (ButtonProps) or a ReactNode */
  firstButton?: ButtonPropType;
  /** Second button: Can be an object (ButtonProps) or a ReactNode */
  secondButton?: ButtonPropType;
};

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  title,
  subtitle,
  description,
  iconSymbol,
  firstButton,
  secondButton,
}) => {
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

  // Helper function to render a Button or ReactNode
  const renderButton = (
    prop: ButtonPropType,
    defaultVariant: string,
    customStyles: object = {}
  ) => {
    if (!prop) return null;

    // If it's a valid React element (e.g., <div />, <CustomButton />), render directly
    if (React.isValidElement(prop)) {
      return prop;
    }

    // Otherwise, treat as props for the @ttoss/ui Button component
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
          fontSize: 15,
          fontWeight: 700,
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
        background: 'linear-gradient(270deg, #006241, #008558, #006241)',
        backgroundSize: '400% 400%',
        animation: 'ocaGradientFlow 8s ease infinite',
        width: '100%',
        minHeight: '104px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        py: '7',
        px: '8',
        gap: '5',
        color: '#fff',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      data-testid="spotlight-card"
    >
      <Flex sx={{ alignItems: 'center', gap: '5', flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '2xl',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
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
              fontSize: 24,
              lineHeight: 1.2,
              color: 'display.background.primary.default',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2',
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 24,
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
                  fontSize: 20,
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
              fontSize: 15,
              color: 'rgba(255,255,255,0.85)',
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
          {renderButton(firstButton, 'accent', {
            ':hover': { transform: 'translateY(-1px)' },
          })}
          {renderButton(secondButton, 'transparent', {
            borderRadius: 'full',
            fontWeight: 600,
            backgroundColor: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: 'display.background.primary.default',
            cursor: 'pointer',
            ':hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'display.background.primary.default',
            },
          })}
        </Flex>
      )}
    </Card>
  );
};

SpotlightCard.displayName = 'SpotlightCard';
