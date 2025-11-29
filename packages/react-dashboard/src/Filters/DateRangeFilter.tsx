import 'react-day-picker/style.css';

import { Icon } from '@ttoss/react-icons';
import { Box, Button, Flex, Label, Text } from '@ttoss/ui';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePreset {
  label: string;
  getValue: () => DateRange;
}

interface DateRangePickerProps {
  label: string;
  value?: DateRange;
  presets?: DateRangePreset[];
  onChange?: (range: DateRange | undefined) => void;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR');
};

export const DateRangeFilter = ({
  label,
  value,
  presets,
  onChange,
}: DateRangePickerProps) => {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isResettingRangeRef = React.useRef(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = preset.getValue();
    handleSelect(range);
    setIsOpen(false);
  };

  const handleDayPickerSelect = (selected: DateRange | undefined) => {
    if (isResettingRangeRef.current && !selected) {
      isResettingRangeRef.current = false;
      return;
    }

    isResettingRangeRef.current = false;
    if (selected?.from || selected?.to) {
      handleSelect(selected);
    } else {
      handleSelect(undefined);
    }
  };

  const handleDayClick = (day: Date) => {
    if (date?.from && date?.to) {
      isResettingRangeRef.current = true;
      handleSelect({ from: day, to: undefined });
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Flex
      ref={containerRef}
      sx={{ flexDirection: 'column', gap: '1', position: 'relative' }}
    >
      <Label>{label}</Label>
      <Button
        variant="secondary"
        onClick={() => {
          return setIsOpen(!isOpen);
        }}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          fontSize: '14px',
          fontWeight: 400,
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: 'lg',
          border: 'md',
          borderColor: 'display.border.muted.default',
          height: '40px',
          minWidth: '240px',
        }}
      >
        {date?.from ? (
          date.to ? (
            <Text>
              {formatDate(date.from)} - {formatDate(date.to)}
            </Text>
          ) : (
            <Text>{formatDate(date.from)}</Text>
          )
        ) : (
          <Text>Selecione o período</Text>
        )}
        <Icon icon="mdi:chevron-down" size={16} />
      </Button>

      {isOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 50,
            backgroundColor: 'white',
            border: '1px solid',
            borderColor: 'display.border.muted.default',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Flex sx={{ minHeight: '300px' }}>
            {presets && presets.length > 0 && (
              <Flex
                sx={{
                  flexDirection: 'column',
                  gap: '4px',
                  padding: '12px',
                  borderRight: '1px solid',
                  borderColor: 'display.border.muted.default',
                  backgroundColor: 'navigation.background.muted.default',
                  minWidth: '140px',
                }}
              >
                {presets?.map((preset) => {
                  return (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      onClick={() => {
                        return handlePresetClick(preset);
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        fontSize: '14px',
                        fontWeight: 400,
                        padding: '8px 12px',
                        color: 'display.text.secondary.default',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'input.background.muted.active',
                        },
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </Flex>
            )}

            <Box
              sx={{
                padding: '16px',
                flex: 1,
                '& .rdp': {
                  margin: 0,
                },
                '& .rdp-month': {
                  width: '100%',
                },
                '& .rdp-day_button': {
                  borderRadius: '50% !important',
                  border: 'none',
                  fontSize: '14px',
                },
                '& .rdp-range_start .rdp-day_button': {
                  backgroundColor: 'action.background.primary.default',
                },
                '& .rdp-range_end .rdp-day_button': {
                  backgroundColor: 'action.background.primary.default',
                },
                '& .rdp-day_button:hover': {
                  backgroundColor: 'action.background.accent.default',
                },
                '& .rdp-day_selected': {
                  backgroundColor: 'action.background.accent.default',
                  color: 'white',
                  fontWeight: 600,
                },
                '& .rdp-day_range_middle': {
                  backgroundColor: 'action.background.accent.default',
                  color: 'white',
                },
                '& .rdp-day_range_start, & .rdp-day_range_end': {
                  backgroundColor: 'action.background.accent.default',
                  color: 'white',
                  fontWeight: 600,
                },
                '& .rdp-weekday': {
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'display.text.muted.default',
                },
                '& .rdp-month_caption': {
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '16px',
                },
              }}
            >
              <DayPicker
                mode="range"
                locale={ptBR}
                selected={date}
                onSelect={(selected) => {
                  return handleDayPickerSelect(
                    selected as DateRange | undefined
                  );
                }}
                onDayClick={handleDayClick}
                weekStartsOn={1}
                showOutsideDays
              />
            </Box>
          </Flex>
        </Box>
      )}
    </Flex>
  );
};
