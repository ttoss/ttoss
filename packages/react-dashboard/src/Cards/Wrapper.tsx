import { Box, Flex, Text, TooltipIcon } from '@ttoss/ui';

import { CardVariant } from '../DashboardCard';

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
        return 'display.background.primary.default';
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
        return 'display.text.primary.default';
    }
  };

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '3',
        backgroundColor: getBackgroundColor(),
        borderRadius: 'lg',
        padding: '4',
        width: '100%',
        height: '100%',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          gap: '2',
        }}
      >
        <Text
          variant="h5"
          sx={{
            color: getTitleColor(),
            flex: 1,
            minWidth: 0,
          }}
        >
          {title}
        </Text>
        {description && (
          <TooltipIcon
            variant="info"
            icon="ant-design:info-circle-outlined"
            tooltip={{
              children: description,
            }}
            sx={{
              marginLeft: '2',
              flexShrink: 0,
            }}
          />
        )}
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
