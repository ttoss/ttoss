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

interface DatePickerProps {
  label?: string;
  value?: DateRange;
  presets?: DateRangePreset[];
  onChange?: (range: DateRange | undefined) => void;
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR');
};

export const DatePicker = ({
  label,
  value,
  presets,
  onChange,
}: DatePickerProps) => {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [pickerSelection, setPickerSelection] = React.useState<
    DateRange | undefined
  >(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isResettingRangeRef = React.useRef(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  React.useEffect(() => {
    if (isOpen) {
      setPickerSelection(date);
    }
  }, [isOpen, date]);

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

  const commitSelection = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    const range = preset.getValue();
    commitSelection(range);
    setIsOpen(false);
  };

  const handleDayPickerSelect = (selected: DateRange | undefined) => {
    if (
      isResettingRangeRef.current &&
      !selected &&
      pickerSelection?.from &&
      !pickerSelection?.to
    ) {
      commitSelection({ from: pickerSelection.from, to: pickerSelection.from });
      setIsOpen(false);
      return;
    }

    isResettingRangeRef.current = false;

    const hadFullRange = date?.from && date?.to;
    const hadPartialPicker = pickerSelection?.from && !pickerSelection?.to;
    if (hadFullRange && !hadPartialPicker && selected?.from && selected?.to) {
      const clickedDay =
        selected.from.getTime() === date?.from?.getTime()
          ? selected.to
          : selected.from;
      setPickerSelection({ from: clickedDay, to: undefined });
      return;
    }

    setPickerSelection(selected);

    if (selected?.from && selected?.to) {
      commitSelection(selected);
      setIsOpen(false);
    } else if (!selected?.from && !selected?.to) {
      commitSelection(undefined);
    }
  };

  const handleDayClick = (day: Date) => {
    if (date?.from && date?.to) {
      isResettingRangeRef.current = true;
      setPickerSelection({ from: day, to: undefined });
    }
  };

  return (
    <Flex
      ref={containerRef}
      sx={{ flexDirection: 'column', gap: '1', position: 'relative' }}
    >
      {label && <Label>{label}</Label>}
      <Button
        variant="secondary"
        onClick={() => {
          return setIsOpen(!isOpen);
        }}
        sx={{
          width: '100%',
          justifyContent: 'space-between',
          fontSize: ['14px', '14px'],
          fontWeight: 400,
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: 'lg',
          border: 'md',
          borderColor: 'display.border.muted.default',
          height: '40px',
          minWidth: ['auto', '240px'],
        }}
      >
        {date?.from ? (
          date.to ? (
            <Text
              sx={{
                fontSize: ['12px', '14px'],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(date.from)} - {formatDate(date.to)}
            </Text>
          ) : (
            <Text
              sx={{
                fontSize: ['12px', '14px'],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(date.from)}
            </Text>
          )
        ) : (
          <Text sx={{ fontSize: ['12px', '14px'] }}>Selecione o período</Text>
        )}
        <Icon icon="mdi:chevron-down" size={16} />
      </Button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <Box
            sx={{
              display: ['block', 'none'],
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 49,
            }}
            onClick={() => {
              return setIsOpen(false);
            }}
          />
          <Box
            sx={{
              position: ['fixed', 'absolute'],
              top: ['auto', 'calc(100% + 4px)'],
              bottom: ['0', 'auto'],
              left: ['0', '0'],
              right: ['0', 'auto'],
              width: ['100%', 'auto'],
              maxWidth: ['100%', '650px'],
              zIndex: 50,
              backgroundColor: 'white',
              border: '1px solid',
              borderColor: 'display.border.muted.default',
              borderRadius: ['16px 16px 0 0', '8px'],
              boxShadow: [
                '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
                '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              ],
              overflow: 'hidden',
              maxHeight: ['80vh', 'none'],
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Mobile header with close button */}
            <Flex
              sx={{
                display: ['flex', 'none'],
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid',
                borderColor: 'display.border.muted.default',
              }}
            >
              <Text sx={{ fontSize: '16px', fontWeight: 600 }}>
                {label || 'Selecione o período'}
              </Text>
              <Button
                variant="ghost"
                onClick={() => {
                  return setIsOpen(false);
                }}
                sx={{
                  padding: '4px',
                  minWidth: 'auto',
                  width: '32px',
                  height: '32px',
                }}
              >
                <Icon icon="mdi:close" size={20} />
              </Button>
            </Flex>
            <Flex
              sx={{
                minHeight: '300px',
                flexDirection: ['column', 'row'],
                maxHeight: ['calc(80vh - 60px)', 'none'],
                overflow: ['auto', 'visible'],
              }}
            >
              {presets && presets.length > 0 && (
                <Flex
                  sx={{
                    flexDirection: ['row', 'column'],
                    gap: '4px',
                    padding: ['8px', '12px'],
                    borderRight: ['none', '1px solid'],
                    borderBottom: ['1px solid', 'none'],
                    borderColor: 'display.border.muted.default',
                    backgroundColor: 'navigation.background.muted.default',
                    minWidth: ['auto', '140px'],
                    width: ['100%', 'auto'],
                    overflowX: ['auto', 'visible'],
                    overflowY: ['visible', 'auto'],
                    flexWrap: ['nowrap', 'wrap'],
                    '@media (max-width: 768px)': {
                      '&::-webkit-scrollbar': {
                        display: 'none',
                      },
                      scrollbarWidth: 'none',
                    },
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
                          justifyContent: ['center', 'flex-start'],
                          fontSize: ['12px', '14px'],
                          fontWeight: 400,
                          padding: ['6px 8px', '8px 12px'],
                          color: 'display.text.secondary.default',
                          backgroundColor: 'transparent',
                          whiteSpace: 'nowrap',
                          minWidth: ['auto', 'auto'],
                          flexShrink: 0,
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
                  padding: ['12px', '16px'],
                  flex: 1,
                  overflow: 'auto',
                  '& .rdp': {
                    margin: 0,
                  },
                  '& .rdp-month': {
                    width: '100%',
                  },
                  '& .rdp-day_button': {
                    borderRadius: '50% !important',
                    border: 'none',
                    fontSize: ['12px', '14px'],
                    width: ['32px', '36px'],
                    height: ['32px', '36px'],
                    cursor: 'pointer',
                  },
                  '& .rdp-range_start .rdp-day_button': {
                    backgroundColor: 'action.background.accent.default',
                    color: 'black',
                  },
                  '& .rdp-range_end .rdp-day_button': {
                    backgroundColor: 'action.background.accent.default',
                    color: 'black',
                  },
                  '& .rdp-day_button:hover': {
                    backgroundColor: 'action.background.primary.default',
                    color: 'action.text.primary.default',
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
                    fontSize: ['10px', '12px'],
                    fontWeight: 500,
                    color: 'display.text.muted.default',
                  },
                  '& .rdp-month_caption': {
                    fontSize: ['12px', '14px'],
                    fontWeight: 600,
                    marginBottom: ['12px', '16px'],
                  },
                  '@media (max-width: 768px)': {
                    '& .rdp-caption': {
                      marginBottom: '8px',
                    },
                    '& .rdp-table': {
                      width: '100%',
                    },
                  },
                }}
              >
                <DayPicker
                  mode="range"
                  locale={ptBR}
                  selected={
                    pickerSelection?.from
                      ? {
                          from: pickerSelection.from,
                          to: pickerSelection.to ?? pickerSelection.from,
                        }
                      : undefined
                  }
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
        </>
      )}
    </Flex>
  );
};
