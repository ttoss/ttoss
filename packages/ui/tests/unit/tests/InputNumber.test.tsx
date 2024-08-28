import * as React from 'react';
import { InputNumber, InputNumberProps } from '../../../src';
import { render, screen, userEvent } from '@ttoss/test-utils';

const onChange = jest.fn();

const INITIAL_VALUE = 0;

const Component = (props?: Partial<InputNumberProps>) => {
  const [value, setValue] = React.useState(INITIAL_VALUE);

  return (
    <InputNumber
      {...props}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        onChange(newValue);
      }}
    />
  );
};

test('should render Input component with trailingIcon and leadingIcon as string', async () => {
  const user = userEvent.setup({ delay: null });
  render(<Component />);

  const [downIcon, upIcon] = screen.getAllByTestId('iconify-icon');

  await user.click(upIcon);
  expect(onChange).toHaveBeenCalledWith(INITIAL_VALUE + 1);

  await user.click(downIcon);
  expect(onChange).toHaveBeenCalledWith(INITIAL_VALUE);
});

test("should render infoIcon if it's passed by params and call onClickInfoIcon if it's clicked", async () => {
  const user = userEvent.setup({ delay: null });
  const onClickInfoIcon = jest.fn();
  const { container } = render(
    <Component onClickInfoIcon={onClickInfoIcon} infoIcon />
  );

  const infoIcon = container.querySelector('span > iconify-icon[icon="info"]');
  expect(infoIcon).toBeInTheDocument();

  await user.click(infoIcon as Element);
  expect(onClickInfoIcon).toHaveBeenCalled();
});
