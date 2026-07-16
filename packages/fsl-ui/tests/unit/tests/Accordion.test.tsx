/**
 * AccordionTrigger — full Button API pass-through (audit A7).
 *
 * The trigger extends React Aria's Button props; `isDisabled`, `onPress`,
 * `id` must reach the underlying button, and the wrapping heading level is
 * configurable so the accordion fits any page outline.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from 'src/index';

const renderAccordion = (
  triggerProps: React.ComponentProps<typeof AccordionTrigger> = {}
) => {
  return render(
    <Accordion>
      <AccordionItem id="terms">
        <AccordionTrigger {...triggerProps}>Terms</AccordionTrigger>
        <AccordionPanel>Panel body</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

describe('AccordionTrigger — Button API pass-through', () => {
  test('isDisabled disables the trigger button', () => {
    renderAccordion({ isDisabled: true });
    expect(screen.getByRole('button', { name: 'Terms' })).toBeDisabled();
  });

  test('a disabled trigger does not toggle the panel', () => {
    renderAccordion({ isDisabled: true });
    const trigger = screen.getByRole('button', { name: 'Terms' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('onPress fires alongside the disclosure toggle', () => {
    const onPress = jest.fn();
    renderAccordion({ onPress });
    fireEvent.click(screen.getByRole('button', { name: 'Terms' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('id is forwarded to the button element', () => {
    renderAccordion({ id: 'terms-trigger' });
    expect(screen.getByRole('button', { name: 'Terms' })).toHaveAttribute(
      'id',
      'terms-trigger'
    );
  });
});

describe('AccordionTrigger — headingLevel', () => {
  test('defaults to an h3 heading', () => {
    renderAccordion();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Terms' })
    ).toBeInTheDocument();
  });

  test('headingLevel renders the requested heading element', () => {
    renderAccordion({ headingLevel: 2 });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Terms' })
    ).toBeInTheDocument();
  });
});
