import { Flex, Input, Label } from '@ttoss/ui';

import { DashboardFilterValue } from '../DashboardFilters';

export const TextFilter = (props: {
  name: string;
  label: string;
  value: DashboardFilterValue;
  placeholder?: string;
  onChange: (value: DashboardFilterValue) => void;
}) => {
  return (
    <Flex sx={{ gap: '1', flexDirection: 'column', fontSize: 'sm' }}>
      <Label>{props.label}</Label>
      <Input
        sx={{ height: '2.8em' }}
        value={props.value.toString()}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
        placeholder={props.placeholder}
      />
    </Flex>
  );
};
