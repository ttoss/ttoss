import { Meta, StoryObj } from '@storybook/react-webpack5';
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Flex } from '@ttoss/ui';

export default {
  title: 'Components/NotificationCard',
  component: NotificationCard,
} as Meta;

export const Success: StoryObj = {
  args: {
    type: 'success',
    title: 'Success',
    message: 'This is a success message',
  },
};

export const Error: StoryObj = {
  args: {
    type: 'error',
    title: 'Error',
    message: (
      <Flex sx={{ gap: '4' }}>
        This is an error message
        <Flex
          sx={{ color: 'blue', cursor: 'pointer' }}
          onClick={() => {
            window.open('http://www.google.com', '_blank');
          }}
        >
          Clique aqui
        </Flex>
      </Flex>
    ),
  },
};

export const Warning: StoryObj = {
  args: {
    type: 'warning',
    title: 'Warning',
    message: 'This is a warning message',
  },
};

export const Info: StoryObj = {
  args: {
    type: 'info',
    title: 'Info',
    message: 'This is an info message',
  },
};

export const NoTitle: StoryObj = {
  args: {
    type: 'info',
    message: 'This is an info message without a title',
  },
};

export const CloseButtonOnTitle: StoryObj = {
  args: {
    type: 'info',
    title: 'Info',
    message: 'This is an info message with a close button on the title',
    onClose: () => {},
  },
};

export const CloseButtonOnBody: StoryObj = {
  args: {
    type: 'info',
    message:
      'This is an info message with a close button on the body. This is an info message with a close button on the body. This is an info message with a close button on the body. This is an info message with a close button on the body',
    onClose: () => {},
  },
};

export const WithMetaInfo: StoryObj = {
  args: {
    type: 'info',
    title: 'New notification',
    message: 'You have a new pending notification.',
    caption: '5 min ago',
  },
};

export const WithTag: StoryObj = {
  args: {
    type: 'success',
    title: 'Action completed',
    message: 'Your action has been completed and new features are now working.',
    caption: '2d ago',
    tags: ['New', 'Feature', 'Available'],
  },
};

export const WithOCANotification: StoryObj = {
  args: {
    title: `Sua campanha está ganhando performance!`,
    message: (
      <>
        <p>
          🎯 BOAS NOTÍCIAS! O OneClick Ads reduziu significativamente o Custo
          por Conversão da sua Campanha!
        </p>
        <p>
          Nome da Campanha:{' '}
          <strong>
            $🤖 [Simbiose Digital ON] TESTE VENDAS ADV FEVEREIRO. Campanha —
            mussela
          </strong>
        </p>
        <p>
          Nome da Conta de Anúncio: <strong>BM 02 | Ecommerce | RDD</strong>
        </p>
        <p>Custo por conversão do dia 29/08 até 11/09: R$ 37,17</p>
        <p>
          Custo por conversão dos últimos 14 dias (12/09 até 25/09) com o
          OneClick Ads: R$ 32,86
        </p>
        <p>Redução total no Custo por Conversão: 12%</p>
        <p>
          🚀 Continue otimizando mais campanhas com o OneClickAds para manter a
          performance e escalar suas campanhas!
        </p>
        <p>
          Precisa de ajuda?{' '}
          <a
            href="https://api.whatsapp.com/send?phone=5516936180293&text=%22Ol%C3%A1,%20Sou%20usuario%20ativo%20e%20tenho%20perguntas%20sobre%20o%20OneClick%20Ads.%20Podem%20me%20orientar?%22"
            target="_blank"
            rel="noreferrer"
          >
            Clique aqui
          </a>{' '}
          para falar com nossos especialistas.
        </p>
      </>
    ),
    type: 'success',
  },
};
