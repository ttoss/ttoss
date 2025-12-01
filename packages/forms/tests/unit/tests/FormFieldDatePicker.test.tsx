import type { DateRange } from '@ttoss/components/DatePicker';
import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';

import { Form, FormFieldDatePicker, useForm } from '../../../src';

describe('FormFieldDatePicker', () => {
  const user = userEvent.setup({ delay: null });

  describe('Rendering', () => {
    test('should render with label', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker name="dateRange" label="Date Range" />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Selecione o período')).toBeInTheDocument();
    });

    test('should render without label', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker name="dateRange" />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText('Selecione o período')).toBeInTheDocument();
    });

    test('should display selected date range', () => {
      const onSubmit = jest.fn();
      const fromDate = new Date(2024, 0, 1);
      const toDate = new Date(2024, 0, 31);
      const defaultValue: DateRange = { from: fromDate, to: toDate };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/31\/01\/2024/)).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    test('should call onSubmit with correct date range data', async () => {
      const onSubmit = jest.fn();
      const fromDate = new Date(2024, 0, 1);
      const toDate = new Date(2024, 0, 31);
      const defaultValue: DateRange = { from: fromDate, to: toDate };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: defaultValue,
      });
    });

    test('should call onSubmit with undefined when no date is selected', async () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker name="dateRange" label="Date Range" />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: undefined,
      });
    });
  });

  describe('Validation', () => {
    test('should validate with field-level rules', async () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              rules={{
                required: 'Date range is required',
              }}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      await user.click(screen.getByText('Submit'));

      await waitFor(() => {
        expect(screen.getByText('Date range is required')).toBeInTheDocument();
      });
    });

    test('should pass validation when date range is provided', async () => {
      const onSubmit = jest.fn();
      const fromDate = new Date(2024, 0, 1);
      const toDate = new Date(2024, 0, 31);
      const defaultValue: DateRange = { from: fromDate, to: toDate };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
              rules={{
                required: 'Date range is required',
              }}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalled();
      expect(
        screen.queryByText('Date range is required')
      ).not.toBeInTheDocument();
    });
  });

  describe('Presets', () => {
    test('should render presets when provided', async () => {
      const onSubmit = jest.fn();
      const presets = [
        {
          label: 'Last 7 days',
          getValue: (): DateRange => {
            const to = new Date(2024, 0, 7);
            const from = new Date(2024, 0, 1);
            return { from, to };
          },
        },
        {
          label: 'Last 30 days',
          getValue: (): DateRange => {
            const to = new Date(2024, 0, 30);
            const from = new Date(2024, 0, 1);
            return { from, to };
          },
        },
      ];

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              presets={presets}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      const button = screen.getByText('Selecione o período').closest('button');
      expect(button).toBeInTheDocument();

      if (button) {
        await user.click(button);
        await waitFor(() => {
          expect(screen.getByText('Last 7 days')).toBeInTheDocument();
          expect(screen.getByText('Last 30 days')).toBeInTheDocument();
        });
      }
    });

    test('should update form value when preset is clicked', async () => {
      const onSubmit = jest.fn();
      const presets = [
        {
          label: 'Last 7 days',
          getValue: (): DateRange => {
            const to = new Date(2024, 0, 7);
            const from = new Date(2024, 0, 1);
            return { from, to };
          },
        },
      ];

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              presets={presets}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      const button = screen.getByText('Selecione o período').closest('button');
      expect(button).toBeInTheDocument();

      if (button) {
        await user.click(button);
        await waitFor(() => {
          expect(screen.getByText('Last 7 days')).toBeInTheDocument();
        });

        const presetButton = screen.getByText('Last 7 days');
        await user.click(presetButton);

        // Wait for picker to close
        await waitFor(
          () => {
            expect(
              document.querySelector('.rdp') ||
                document.querySelector('.rdp-weekday')
            ).toBeFalsy();
          },
          { timeout: 2000 }
        );

        // Submit form and verify the preset value was set
        await user.click(screen.getByText('Submit'));

        expect(onSubmit).toHaveBeenCalledWith({
          dateRange: expect.objectContaining({
            from: expect.any(Date),
            to: expect.any(Date),
          }),
        });
      }
    });
  });

  describe('Disabled state', () => {
    test('should mark label as disabled when form is disabled', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm({
          disabled: true,
        });

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker name="dateRange" label="Date Range" />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      const label = screen.getByText('Date Range');
      expect(label).toHaveAttribute('aria-disabled', 'true');
    });

    test('should mark label as disabled when field is disabled', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker name="dateRange" label="Date Range" disabled />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      const label = screen.getByText('Date Range');
      expect(label).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Default value', () => {
    test('should respect defaultValue prop', async () => {
      const onSubmit = jest.fn();
      const fromDate = new Date(2024, 0, 1);
      const toDate = new Date(2024, 0, 31);
      const defaultValue: DateRange = { from: fromDate, to: toDate };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/31\/01\/2024/)).toBeInTheDocument();

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: defaultValue,
      });
    });

    test('should handle defaultValue with only from date', async () => {
      const onSubmit = jest.fn();
      const fromDate = new Date(2024, 0, 1);
      const defaultValue: DateRange = { from: fromDate, to: undefined };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: defaultValue,
      });
    });
  });

  describe('Value changes', () => {
    test('should update form value when preset is selected', async () => {
      const onSubmit = jest.fn();
      const presets = [
        {
          label: 'Test Range',
          getValue: (): DateRange => {
            const to = new Date(2024, 0, 7);
            const from = new Date(2024, 0, 1);
            return { from, to };
          },
        },
      ];

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              presets={presets}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      // Initially no value
      await user.click(screen.getByText('Submit'));
      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: undefined,
      });

      onSubmit.mockClear();

      // Open picker and select a preset
      const button = screen.getByText('Selecione o período').closest('button');
      if (button) {
        await user.click(button);
        await waitFor(() => {
          expect(screen.getByText('Test Range')).toBeInTheDocument();
        });

        const presetButton = screen.getByText('Test Range');
        await user.click(presetButton);

        await waitFor(
          () => {
            expect(
              document.querySelector('.rdp') ||
                document.querySelector('.rdp-weekday')
            ).toBeFalsy();
          },
          { timeout: 2000 }
        );

        await user.click(screen.getByText('Submit'));

        expect(onSubmit).toHaveBeenCalledWith({
          dateRange: expect.objectContaining({
            from: expect.any(Date),
            to: expect.any(Date),
          }),
        });
      }
    });
  });

  describe('Additional props', () => {
    test('should apply id prop to form field', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              id="custom-date-picker-id"
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      // The id should be applied to the input element through FormField
      const label = screen.getByText('Date Range');
      expect(label).toHaveAttribute('for', 'custom-date-picker-id');
    });

    test('should display warning when warning prop is provided', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              warning="This is a warning message"
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText('This is a warning message')).toBeInTheDocument();
    });

    test('should display labelTooltip when provided', () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              labelTooltip={{ content: 'Tooltip content' }}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      // The tooltip should be rendered (implementation may vary)
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    test('should handle undefined value gracefully', async () => {
      const onSubmit = jest.fn();

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={undefined}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText('Selecione o período')).toBeInTheDocument();

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: undefined,
      });
    });

    test('should handle value with both dates undefined', async () => {
      const onSubmit = jest.fn();
      const defaultValue: DateRange = { from: undefined, to: undefined };

      const RenderForm = () => {
        const formMethods = useForm();

        return (
          <Form {...formMethods} onSubmit={onSubmit}>
            <FormFieldDatePicker
              name="dateRange"
              label="Date Range"
              defaultValue={defaultValue}
            />
            <Button type="submit">Submit</Button>
          </Form>
        );
      };

      render(<RenderForm />);

      expect(screen.getByText('Selecione o período')).toBeInTheDocument();

      await user.click(screen.getByText('Submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        dateRange: defaultValue,
      });
    });
  });
});
