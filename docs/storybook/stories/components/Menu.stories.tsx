import { Meta, StoryFn } from '@storybook/react-webpack5';
import { Menu } from '@ttoss/components/Menu';
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';

export default {
  title: 'Components/Menu',
} as Meta;

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  {
    path: '#link1',
    label: 'Link 1',
    icon: 'streamline:customer-support-1',
  },
  {
    path: '#link2',
    label: 'Link 2',
    icon: 'cil:bus-alt',
  },
  {
    path: '#link3',
    label: 'Link 3',
    icon: 'ep:document',
  },
];

export const WithItens: StoryFn = () => {
  return (
    <Menu
      placement="bottom-start"
      menuButtonProps={{ 'aria-label': 'open-menu' }}
      menuListProps={{ maxH: '400px', p: 0 }}
    >
      {/* container único para todos os itens */}
      <Box
        sx={{
          backgroundColor: 'input.background.muted.default',
          borderRadius: 'md',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {menuItems.map((item) => {
          return (
            <a
              key={item.label}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <Flex
                sx={{
                  padding: '3',
                  color: 'display.text.secondary.default',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'display.background.secondary.default',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <Flex
                  sx={{
                    alignItems: 'center',
                    marginLeft: '4',
                    fontSize: 'md',
                    gap: '2',
                  }}
                >
                  <Icon icon={item.icon} width={18} height={18} />
                  {item.label}
                </Flex>
              </Flex>
            </a>
          );
        })}
      </Box>
    </Menu>
  );
};

export const WithNotificationCard: StoryFn = () => {
  return (
    <Menu
      triggerIcon={<Icon icon="mdi:bell-outline" width={20} height={20} />}
      fixedTrigger
      fixedOffset={{ top: 12, right: 12 }}
      menuButtonProps={{ 'aria-label': 'notifications' }}
      menuListProps={{ p: 0 }}
      sx={{
        width: '600px',
        backgroundColor: 'display.border.secondary.default',
      }}
      placement="bottom-end"
      isLazy
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2', p: 0 }}>
        <NotificationCard
          title="Notificação de Exemplo"
          message="Esta é uma notificação de exemplo para demonstrar o componente NotificationCard dentro do Menu."
          onClose={() => {
            return alert('Fechar notificação');
          }}
          actions={[
            {
              action: 'open_url',
              label: 'Acessar',
              url: 'https://example.com',
            },
          ]}
          caption="Enviada há 2 horas"
          type={'success'}
        />
        <NotificationCard
          title="Segunda Notificação"
          message="Outra notificação para demonstrar múltiplas entradas dentro da mesma janela de notificações."
          onClose={() => {
            return alert('Fechar segunda notificação');
          }}
          actions={[
            {
              action: 'open_url',
              label: 'Ver detalhes',
              url: 'https://example.com/2',
            },
          ]}
          caption="Enviada há 30 minutos"
          type={'info'}
        />
      </Box>
    </Menu>
  );
};
