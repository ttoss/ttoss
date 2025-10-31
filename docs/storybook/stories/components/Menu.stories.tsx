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

export const WithItems: StoryFn = () => {
  return (
    <Menu
      menuButtonProps={{ 'aria-label': 'open-menu' }}
      menuListProps={{ maxH: '400px', p: 0 }}
    >
      <Box
        style={{
          backgroundColor:
            'var(--colors-input-background-muted-default, #f5f5f5)',
          borderRadius: '8px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {menuItems.map((item) => {
          return (
            <Flex
              key={item.path}
              style={{
                padding: 12,
                color: 'var(--colors-display-text-secondary-default, #333)',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--colors-display-background-secondary-default, #eee)';
                (e.currentTarget as HTMLElement).style.transform =
                  'translateX(4px)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '';
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              <Flex
                style={{
                  alignItems: 'center',
                  marginLeft: 16,
                  fontSize: 16,
                  gap: 8,
                }}
              >
                <Icon icon={item.icon} width={18} height={18} />
                {item.label}
              </Flex>
            </Flex>
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
      menuListProps={{
        p: 0,
        style: {
          width: '600px',
          backgroundColor:
            'var(--colors-display-border-secondary-default, #eee)',
        },
      }}
    >
      <Box
        style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 0 }}
      >
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

export const mergedMenu: StoryFn = () => {
  return (
    <Menu
      triggerIcon={<Icon icon="mdi:bell-outline" width={20} height={20} />}
      fixedTrigger
      fixedOffset={{ top: 12, right: 12 }}
      menuButtonProps={{ 'aria-label': 'notifications' }}
      menuListProps={{
        p: 0,
        bg: 'bg.primary', // Chakra resolve o token
        style: { width: '600px' },
      }}
    >
      ...
    </Menu>
  );
};
