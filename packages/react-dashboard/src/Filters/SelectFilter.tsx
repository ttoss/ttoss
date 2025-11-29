import { Flex, Label, Select } from '@ttoss/ui';

import { DashboardFilterValue } from '../DashboardFilters';

type SelectValue = string | number | boolean;

export const SelectFilter = (props: {
  name: string;
  label: string;
  value: DashboardFilterValue;
  options: { label: string; value: string | number | boolean }[];
  onChange: (value: DashboardFilterValue | undefined) => void;
}) => {
  return (
    <Flex sx={{ gap: '1', flexDirection: 'column', fontSize: 'sm' }}>
      <Label>{props.label}</Label>
      <Select
        value={props.value as SelectValue}
        options={props.options}
        onChange={(value) => {
          props.onChange(value);
        }}
      />
    </Flex>
  );
};
