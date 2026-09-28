import * as React from 'react';

import type { DateRange, DateRangePreset } from './DatePicker.types';

const isFullRange = (range: DateRange | undefined) => {
  return Boolean(range?.from && range?.to);
};

const isPartialRange = (range: DateRange | undefined) => {
  return Boolean(range?.from && !range?.to);
};

type SelectOutcome =
  | { kind: 'commit'; range: DateRange | undefined; close: boolean }
  | { kind: 'edit'; selection: DateRange | undefined };

type SelectArgs = {
  selected: DateRange | undefined;
  date: DateRange | undefined;
  pickerSelection: DateRange | undefined;
  isResettingRange: boolean;
};

// DayPicker deselects when the start day of a reset range is clicked again;
// treat that as picking a single-day range.
const resolveResetToSingleDay = ({
  selected,
  pickerSelection,
  isResettingRange,
}: SelectArgs): SelectOutcome[] | undefined => {
  if (!isResettingRange || selected || !isPartialRange(pickerSelection)) {
    return undefined;
  }
  const day = pickerSelection!.from;
  return [{ kind: 'commit', range: { from: day, to: day }, close: true }];
};

// With a full range committed, the first click starts a new range from the
// clicked day instead of extending the old one.
const resolveRestartFromClickedDay = ({
  selected,
  date,
  pickerSelection,
}: SelectArgs): SelectOutcome[] | undefined => {
  if (
    !isFullRange(date) ||
    isPartialRange(pickerSelection) ||
    !isFullRange(selected)
  ) {
    return undefined;
  }
  const clickedDay =
    selected!.from!.getTime() === date!.from!.getTime()
      ? selected!.to
      : selected!.from;
  return [{ kind: 'edit', selection: { from: clickedDay, to: undefined } }];
};

/**
 * What a DayPicker `onSelect` means for the picker, given the committed range
 * and the range being edited.
 */
export const resolveDayPickerSelect = (args: SelectArgs): SelectOutcome[] => {
  const special =
    resolveResetToSingleDay(args) ?? resolveRestartFromClickedDay(args);
  if (special) {
    return special;
  }
  const { selected } = args;
  const edit: SelectOutcome = { kind: 'edit', selection: selected };
  if (isFullRange(selected)) {
    return [edit, { kind: 'commit', range: selected, close: true }];
  }
  if (!selected?.from && !selected?.to) {
    return [edit, { kind: 'commit', range: undefined, close: false }];
  }
  return [edit];
};

const useCloseOnClickOutside = ({
  containerRef,
  isOpen,
  close,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  close: () => void;
}) => {
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef, isOpen, close]);
};

/**
 * Selection state of the DatePicker: `date` is the committed range shown on
 * the trigger, `pickerSelection` the range being edited while the calendar is
 * open.
 */
export const useDatePicker = ({
  value,
  onChange,
  containerRef,
}: {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  containerRef: React.RefObject<HTMLElement | null>;
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [pickerSelection, setPickerSelection] = React.useState<
    DateRange | undefined
  >(value);
  const [isOpen, setIsOpen] = React.useState(false);
  const [prevValue, setPrevValue] = React.useState(value);
  const isResettingRangeRef = React.useRef(false);

  if (value !== prevValue) {
    setPrevValue(value);
    setDate(value);
    if (isOpen) {
      setPickerSelection(value);
    }
  }

  const close = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  useCloseOnClickOutside({ containerRef, isOpen, close });

  const toggle = () => {
    if (!isOpen) {
      setPickerSelection(date);
    }
    setIsOpen(!isOpen);
  };

  const commitSelection = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    commitSelection(preset.getValue());
    close();
  };

  const handleDayPickerSelect = (selected: DateRange | undefined) => {
    const outcomes = resolveDayPickerSelect({
      selected,
      date,
      pickerSelection,
      isResettingRange: isResettingRangeRef.current,
    });
    isResettingRangeRef.current = false;
    for (const outcome of outcomes) {
      if (outcome.kind === 'edit') {
        setPickerSelection(outcome.selection);
        continue;
      }
      commitSelection(outcome.range);
      if (outcome.close) {
        close();
      }
    }
  };

  const handleDayClick = (day: Date) => {
    if (isFullRange(date)) {
      isResettingRangeRef.current = true;
      setPickerSelection({ from: day, to: undefined });
    }
  };

  return {
    date,
    pickerSelection,
    isOpen,
    toggle,
    close,
    handlePresetClick,
    handleDayPickerSelect,
    handleDayClick,
  };
};
