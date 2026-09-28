import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Flex, Label, Text } from '@ttoss/ui';
import * as React from 'react';

import { triggerSx, triggerTextSx } from './DatePicker.styles';
import type { DateRange, DateRangePreset } from './DatePicker.types';
import { DatePickerPanel } from './DatePickerPanel';
import { getDayPickerLocale } from './dayPickerLocale';
import { useDatePicker } from './useDatePicker';

export type { DateRange } from './DatePicker.types';

interface DatePickerProps {
  label?: string;
  value?: DateRange;
  presets?: DateRangePreset[];
  onChange?: (range: DateRange | undefined) => void;
  disabled?: boolean;
}

const messages = defineMessages({
  selectPeriod: {
    defaultMessage: 'Select a period',
    description:
      'Date range picker: placeholder when no range is selected, and the mobile panel title when there is no label.',
  },
});

const formatRange = ({
  range,
  formatDate,
}: {
  range: DateRange;
  formatDate: (date: Date) => string;
}) => {
  if (!range.from) {
    return undefined;
  }
  if (!range.to) {
    return formatDate(range.from);
  }
  return `${formatDate(range.from)} - ${formatDate(range.to)}`;
};

export const DatePicker = ({
  label,
  value,
  presets,
  onChange,
  disabled,
}: DatePickerProps) => {
  const { intl } = useI18n();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const picker = useDatePicker({ value, onChange, containerRef });
  const selectPeriod = intl.formatMessage(messages.selectPeriod);
  const rangeText = picker.date
    ? formatRange({
        range: picker.date,
        formatDate: (date) => {
          return intl.formatDate(date);
        },
      })
    : undefined;

  return (
    <Flex
      ref={containerRef}
      sx={{ flexDirection: 'column', gap: '1', position: 'relative' }}
    >
      {label && <Label>{label}</Label>}
      <Button
        disabled={disabled}
        variant="secondary"
        onClick={picker.toggle}
        sx={triggerSx}
      >
        {rangeText ? (
          <Text sx={triggerTextSx}>{rangeText}</Text>
        ) : (
          <Text sx={{ fontSize: ['12px', '14px'] }}>{selectPeriod}</Text>
        )}
      </Button>

      {picker.isOpen && (
        <DatePickerPanel
          title={label || selectPeriod}
          presets={presets}
          pickerSelection={picker.pickerSelection}
          dayPickerLocale={getDayPickerLocale(intl.locale)}
          disabled={disabled}
          onClose={picker.close}
          onPresetClick={picker.handlePresetClick}
          onSelect={picker.handleDayPickerSelect}
          onDayClick={picker.handleDayClick}
        />
      )}
    </Flex>
  );
};
