import type { Meta, StoryObj } from '@storybook/react-vite';
import { FieldGroup, Form, Select, SelectItem, TextField } from '@ttoss/fsl-ui';

const meta: Meta<typeof FieldGroup> = {
  title: 'Input/FieldGroup',
  component: FieldGroup,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FieldGroup>;

const MONTHS = ['01', '02', '03', '04', '05', '06'];
const YEARS = ['2026', '2027', '2028'];

/**
 * One label over several controls — a `role="group"` named by
 * `aria-labelledby`. Each inner control keeps its own `aria-label`: the group
 * names the cluster, screen readers still need each member named.
 */
export const Default: Story = {
  render: () => {
    return (
      <FieldGroup label="Expiry" description="As printed on the card.">
        <Select aria-label="Expiry month" placeholder="MM">
          {MONTHS.map((month) => {
            return (
              <SelectItem key={month} id={month}>
                {month}
              </SelectItem>
            );
          })}
        </Select>
        <Select aria-label="Expiry year" placeholder="YYYY">
          {YEARS.map((year) => {
            return (
              <SelectItem key={year} id={year}>
                {year}
              </SelectItem>
            );
          })}
        </Select>
      </FieldGroup>
    );
  },
};

/**
 * Inside a `labelPosition="side"` Form the group becomes a subgrid row like
 * any other field: its label joins the shared label column.
 */
export const SideLabels: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Form labelPosition="side" aria-label="Payment">
        <TextField label="Card number" name="card" />
        <FieldGroup label="Expiry">
          <Select aria-label="Expiry month" placeholder="MM">
            <SelectItem id="04">04</SelectItem>
          </Select>
          <Select aria-label="Expiry year" placeholder="YYYY">
            <SelectItem id="2028">2028</SelectItem>
          </Select>
        </FieldGroup>
        <TextField label="Name on card" name="holder" />
      </Form>
    );
  },
};
