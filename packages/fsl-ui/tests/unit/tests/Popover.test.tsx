/**
 * Popover — standalone anchored overlay surface.
 *
 * Verifies it opens from its trigger, renders content on the overlay surface,
 * exposes the A6 host knob (--fsl-popover-max-width) via fslVar, and closes on
 * Escape.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Popover, PopoverTrigger } from 'src/index';

const renderPopover = (defaultOpen?: boolean) => {
  return render(
    <PopoverTrigger defaultOpen={defaultOpen}>
      <Button>Open</Button>
      <Popover>anchored content</Popover>
    </PopoverTrigger>
  );
};

const getSurface = (): HTMLElement | null => {
  return document.querySelector('[data-scope="popover"][data-part="root"]');
};

describe('Popover', () => {
  test('is closed until the trigger is activated', async () => {
    const user = userEvent.setup();
    renderPopover();
    expect(getSurface()).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(getSurface()).not.toBeNull();
    expect(screen.getByText('anchored content')).toBeInTheDocument();
  });

  test('surface reads the --fsl-popover-max-width knob with fallback', () => {
    renderPopover(true);
    expect(getSurface()?.style.maxWidth).toBe(
      'var(--fsl-popover-max-width, min(320px, 90vw))'
    );
  });

  test('closes on Escape', async () => {
    const user = userEvent.setup();
    renderPopover(true);
    expect(getSurface()).not.toBeNull();
    await user.keyboard('[Escape]');
    expect(getSurface()).toBeNull();
  });
});
