/**
 * Tooltip — hover/focus overlay.
 *
 * Verifies it appears on trigger focus, exposes the tooltip role and the A6
 * max-width knob, and reads the informational overlay surface tokens.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Tooltip, TooltipTrigger } from 'src/index';

const getSurface = (): HTMLElement | null => {
  return document.querySelector('[data-scope="tooltip"][data-part="root"]');
};

describe('Tooltip', () => {
  test('appears on keyboard focus of the trigger', async () => {
    const user = userEvent.setup();
    render(
      <TooltipTrigger>
        <Button>Save</Button>
        <Tooltip>Saves the draft</Tooltip>
      </TooltipTrigger>
    );
    expect(getSurface()).toBeNull();
    await user.tab();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Saves the draft');
  });

  test('surface reads the --fsl-tooltip-max-width knob with fallback', () => {
    render(
      <TooltipTrigger defaultOpen>
        <Button>Save</Button>
        <Tooltip>Tip</Tooltip>
      </TooltipTrigger>
    );
    expect(getSurface()?.style.maxWidth).toBe(
      'var(--fsl-tooltip-max-width, min(280px, 90vw))'
    );
  });
});
