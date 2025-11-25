import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

export type SpotlightCardProps = {
  /** Título principal (Obrigatório) */
  title: string;
  /** Subtítulo (Opcional) */
  subtitle?: string;
  /** Descrição detalhada (Obrigatório) */
  description: string;
  /** Texto do botão principal (Obrigatório) */
  tutorialLabel: string;
  /** Texto do botão secundário (Obrigatório) */
  articleLabel: string;
  /** Ação do botão principal */
  onTutorialClick?: () => void;
  /** Ação do botão secundário */
  onArticleClick?: () => void;
  /** Nome do ícone para libs compatíveis (Obrigatório) */
  iconName: string;
  /** String do ícone Material/SVG (Obrigatório) */
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
        // AUMENTO 1: Altura mínima maior para dar imponência
        minHeight: '104px',

        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',

        // AUMENTO 2: Mais padding vertical (eixo Y)
        py: '7', // Aumentado (era implícito no p:6)
        px: '8', // Aumentado nas laterais também
        gap: '5',

        color: '#fff',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
      data-testid="spotlight-card"
    >
      {/* --- GRUPO ESQUERDA --- */}
      <Flex sx={{ alignItems: 'center', gap: '5', flex: 1, minWidth: 0 }}>
        {/* Ícone Container */}
        <Box
          sx={{
            // AUMENTO 3: Container do ícone levemente maior
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
            size={32} // Ícone maior (era 28)
            color="action.background.accent.default"
          />
        </Box>

        {/* Textos */}
        <Box sx={{ minWidth: 0 }}>
          <Text
            as="div"
            sx={{
              fontFamily: 'heading',
              fontWeight: 700,
              fontSize: 22, // Título maior (era 20)
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
              fontSize: 15, // Fonte de leitura levemente maior (era 14)
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

      {/* --- GRUPO DIREITA (Botões) --- */}
      <Flex sx={{ gap: '4', alignItems: 'center', flexShrink: 0, ml: 'auto' }}>
        {/* BOTÃO TUTORIAL MAIOR */}
        <Button
          variant="accent"
          onClick={onTutorialClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2',
            // AUMENTO 4: Botões mais robustos
            px: '6', // Mais largo (era 4)
            py: '3', // Mais alto (era padrão ou 2)
            fontSize: 15, // Texto maior
            fontWeight: 700, // Mais peso
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
            size={22} // Ícone interno maior (era 18)
          />
          {tutorialLabel}
        </Button>

        {/* BOTÃO ARTIGO MAIOR */}
        <Button
          onClick={onArticleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2',
            // AUMENTO 5: Mesmas dimensões do botão primário
            px: '6',
            py: '3',
            borderRadius: 'full',
            fontWeight: 600,
            fontSize: 15,
            backgroundColor: 'transparent',
            border: '1.5px solid rgba(255,255,255,0.3)', // Borda um pouco mais espessa
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
