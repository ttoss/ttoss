import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Box } from '@ttoss/ui';
import { SpotlightCard } from '@ttoss/components/SpotlightCard';

const meta: Meta<typeof SpotlightCard> = {
  title: 'Components/SpotlightCard',
  component: SpotlightCard,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    description: { control: 'text' },
    tutorialLabel: { control: 'text' },
    articleLabel: { control: 'text' },
    onTutorialClick: { action: 'tutorial clicked' },
    onArticleClick: { action: 'article clicked' },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

/**
 * Story Padrão: Simula o uso real no produto OneClick.
 * Agora passamos todas as props explicitamente.
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description: 'Entenda para que serve e como utilizar o OneClick Tracking para maximizar o rastreamento das suas conversões em múltiplas plataformas.',
    tutorialLabel: 'Assistir Tutorial',
    articleLabel: 'Ler Artigo',
    iconName: 'AdsClick',
    iconSymbol: 'material-symbols:ads-click',
  },
};

/**
 * Exemplo de outro contexto (Dashboard Financeiro)
 * para provar a reutilização do componente.
 */
export const FinanceDashboardContext: Story = {
  args: {
    title: 'Painel',
    subtitle: 'Financeiro',
    description: 'Acompanhe seus rendimentos e dividendos em tempo real com gráficos avançados.',
    tutorialLabel: 'Ver Demo',
    articleLabel: 'Documentação',
    iconName: 'AttachMoney',
    iconSymbol: 'material-symbols:attach-money',
  },
};

/**
 * Teste de comportamento responsivo (Scroll)
 */
export const ScrollTest: Story = {
  render: (args) => (
    <Box
      sx={{
        width: '800px',
        border: '2px dashed #ccc',
        overflowX: 'auto',
        p: 4,
      }}
    >
      <SpotlightCard {...args} />
    </Box>
  ),
  args: {
    ...Default.args, // Herda os args da Default
  },
};