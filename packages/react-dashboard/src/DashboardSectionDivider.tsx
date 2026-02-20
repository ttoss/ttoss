import { Divider, Flex, Input, Text } from '@ttoss/ui';

export type SectionDivider = {
  type: string;
  title: string;
};

export const DashboardSectionDivider = ({
  title,
  editable,
  onTitleChange,
}: SectionDivider & {
  editable?: boolean;
  onTitleChange?: (title: string) => void;
}) => {
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
      {editable && onTitleChange ? (
        <Input
          value={title}
          onChange={(e) => {
            return onTitleChange(e.target.value);
          }}
          sx={{
            flex: 'none',
            fontSize: 'md',
            fontWeight: 'bold',
            minWidth: '120px',
          }}
        />
      ) : (
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
      )}
      <Divider sx={{ width: '100%', color: 'display.border.muted.default' }} />
    </Flex>
  );
};
