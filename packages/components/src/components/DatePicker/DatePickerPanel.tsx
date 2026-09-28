import { Icon } from '@ttoss/react-icons';
import { Box, Button, Flex, Text } from '@ttoss/ui';
import type { Locale } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';

import {
  backdropSx,
  calendarSx,
  closeButtonSx,
  mobileHeaderSx,
  panelBodySx,
  panelSx,
  presetButtonSx,
  presetsSx,
} from './DatePicker.styles';
import type { DateRange, DateRangePreset } from './DatePicker.types';

const toDayPickerSelection = (selection: DateRange | undefined) => {
  if (!selection?.from) {
    return undefined;
  }
  return { from: selection.from, to: selection.to ?? selection.from };
};

const Presets = ({
  presets,
  onPresetClick,
}: {
  presets: DateRangePreset[];
  onPresetClick: (preset: DateRangePreset) => void;
}) => {
  return (
    <Flex sx={presetsSx}>
      {presets.map((preset) => {
        return (
          <Button
            key={preset.label}
            variant="ghost"
            onClick={() => {
              return onPresetClick(preset);
            }}
            sx={presetButtonSx}
          >
            {preset.label}
          </Button>
        );
      })}
    </Flex>
  );
};

export const DatePickerPanel = ({
  title,
  presets,
  pickerSelection,
  dayPickerLocale,
  disabled,
  onClose,
  onPresetClick,
  onSelect,
  onDayClick,
}: {
  title: string;
  presets?: DateRangePreset[];
  pickerSelection: DateRange | undefined;
  dayPickerLocale: Locale;
  disabled?: boolean;
  onClose: () => void;
  onPresetClick: (preset: DateRangePreset) => void;
  onSelect: (selected: DateRange | undefined) => void;
  onDayClick: (day: Date) => void;
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      <Box sx={backdropSx} onClick={onClose} />
      <Box sx={panelSx}>
        {/* Mobile header with close button */}
        <Flex sx={mobileHeaderSx}>
          <Text sx={{ fontSize: '16px', fontWeight: 600 }}>{title}</Text>
          <Button variant="ghost" onClick={onClose} sx={closeButtonSx}>
            <Icon icon="mdi:close" size={20} />
          </Button>
        </Flex>
        <Flex sx={panelBodySx}>
          {presets && presets.length > 0 && (
            <Presets presets={presets} onPresetClick={onPresetClick} />
          )}
          <Box sx={calendarSx}>
            <DayPicker
              disabled={disabled}
              mode="range"
              locale={dayPickerLocale}
              selected={toDayPickerSelection(pickerSelection)}
              onSelect={(selected) => {
                return onSelect(selected as DateRange | undefined);
              }}
              onDayClick={onDayClick}
              weekStartsOn={1}
              showOutsideDays
            />
          </Box>
        </Flex>
      </Box>
    </>
  );
};
