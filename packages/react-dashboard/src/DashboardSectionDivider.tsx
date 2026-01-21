import { Divider, Flex, Text } from '@ttoss/ui';

export type SectionDivider = {
  type: string;
  title: string;
};

export const DashboardSectionDivider = ({ title }: SectionDivider) => {
  return (
    <Flex
      sx={{
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: '6',
        paddingTop: '6',
      }}
    >
      <Text
        sx={{
          color: 'input.background.muted.disabled',
          fontSize: 'md',
          fontWeight: 'bold',
          flex: 'none',
        }}
      >
        {title}
      </Text>
      <Divider sx={{ width: '100%', color: 'display.border.muted.default' }} />
    </Flex>
  );
};
