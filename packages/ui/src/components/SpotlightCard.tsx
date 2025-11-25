import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

export type SpotlightCardProps = {
  /** Main title (Required) */
  title: string;
  /** Subtitle (Optional) */
  subtitle?: string;
  /** Detailed description (Required) */
  description: string;
  /** Main button label (Required) */
  tutorialLabel: string;
  /** Secondary button label (Required) */
  articleLabel: string;
  /** Main button action */
  onTutorialClick?: () => void;
  /** Secondary button action */
  onArticleClick?: () => void;
  /** Icon name for compatible libraries (Required) */
  iconName: string;
  /** Material/SVG icon string (Required) */
  iconSymbol: string;
};

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  title,
  subtitle,
  description,
  tutorialLabel,
  articleLabel,
  onTutorialClick,
  onArticleClick,
  iconName,
  iconSymbol,
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
        minWidth: '1100px',
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
      {/* LEFT GROUP */}
      <Flex sx={{ alignItems: 'center', gap: '5', flex: 1, minWidth: 0 }}>
        {/* Icon Container */}
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon
            name={iconName}
            icon={iconSymbol}
            size={32}
            color="action.background.accent.default"
          />
        </Box>

        {/* Texts */}
        <Box sx={{ minWidth: 0 }}>
          <Text
            as="div"
            sx={{
              fontFamily: 'heading',
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.2,
              color: 'display.background.primary.default',
              whiteSpace: 'nowrap',
            }}
          >
            {title}{' '}
            {subtitle && (
              <span style={{ fontWeight: 400, opacity: 0.9 }}>{subtitle}</span>
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

      {/* RIGHT GROUP (Buttons) */}
      <Flex sx={{ gap: '4', alignItems: 'center', flexShrink: 0, ml: 'auto' }}>
        {/* MAIN TUTORIAL BUTTON */}
        <Button
          variant="accent"
          onClick={onTutorialClick}
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
            transition: 'transform 0.2s',
            ':hover': {
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Icon
            name="PlayCircle"
            icon="material-symbols:play-circle-outline"
            size={22}
          />
          {tutorialLabel}
        </Button>

        {/* SECONDARY ARTICLE BUTTON */}
        <Button
          onClick={onArticleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2',
            px: '6',
            py: '3',
            borderRadius: 'full',
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.3)',
            color: 'display.background.primary.default',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            ':hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'display.background.primary.default',
            },
          }}
        >
          <Icon
            name="BookOpen"
            icon="material-symbols:menu-book-outline"
            size={22}
          />
          {articleLabel}
        </Button>
      </Flex>
    </Card>
  );
};

SpotlightCard.displayName = 'SpotlightCard';
