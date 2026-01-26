import { Box, Flex, Heading, TooltipIcon } from '@ttoss/ui';

import type { CardVariant } from '../DashboardCard';

export const CardWrapper = ({
  title,
  children,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: CardVariant;
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'dark':
        return 'input.background.secondary.default';
      case 'light-green':
        return 'feedback.background.positive.default';
      case 'default':
      default:
        return '#f9fafb';
    }
  };

  const getTitleColor = () => {
    switch (variant) {
      case 'dark':
        return 'action.text.primary.default';
      case 'light-green':
        return 'feedback.text.positive.default';
      case 'default':
      default:
        return 'input.text.muted.default';
    }
  };

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '3',
        backgroundColor: getBackgroundColor(),
        border: 'md',
        borderColor: 'display.border.muted.default',
        borderRadius: 'lg',
        padding: '6',
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          gap: '2',
        }}
      >
        <Flex
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <Heading
            as="h6"
            sx={{
              textTransform: 'uppercase',
              color: getTitleColor(),
              textWrapStyle: 'pretty',
            }}
            title={title}
          >
            {title}
          </Heading>
          {description && (
            <TooltipIcon
              variant="info"
              icon="ant-design:info-circle-outlined"
              tooltip={{
                children: description,
              }}
              sx={{
                fontSize: 'sm',
                color: getTitleColor(),
                marginLeft: '2',
              }}
            />
          )}
        </Flex>
      </Box>
      <Flex
        sx={{
          flexDirection: 'column',
          flex: 'auto',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
};
