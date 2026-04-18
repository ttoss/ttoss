import { accordion } from '../../../src/chakra/slotRecipes/accordion';
import { checkbox } from '../../../src/chakra/slotRecipes/checkbox';
import { progress } from '../../../src/chakra/slotRecipes/progress';
import { radioGroup } from '../../../src/chakra/slotRecipes/radioGroup';
import { select } from '../../../src/chakra/slotRecipes/select';
import { steps } from '../../../src/chakra/slotRecipes/steps';
import { switch as switchSlotRecipe } from '../../../src/chakra/slotRecipes/switch';
import { toast } from '../../../src/chakra/slotRecipes/toast';

describe('chakra slot recipes', () => {
  test('should export semantic slot recipes for the contract components', () => {
    expect(accordion.className).toBe('accordion');
    expect(checkbox.className).toBe('checkbox');
    expect(switchSlotRecipe.className).toBe('switch');
    expect(radioGroup.className).toBe('radio-group');
    expect(select.className).toBe('select');
    expect(progress.className).toBe('progress');
    expect(toast.className).toBe('toast');
    expect(steps.className).toBe('steps');
  });

  test('should provide evaluation variants for feedback components', () => {
    expect(progress.variants?.evaluation?.primary).toBeDefined();
    expect(progress.variants?.evaluation?.positive).toBeDefined();
    expect(progress.variants?.evaluation?.caution).toBeDefined();
    expect(progress.variants?.evaluation?.negative).toBeDefined();

    expect(toast.variants?.evaluation?.primary).toBeDefined();
    expect(toast.variants?.evaluation?.positive).toBeDefined();
    expect(toast.variants?.evaluation?.caution).toBeDefined();
    expect(toast.variants?.evaluation?.negative).toBeDefined();
  });

  test('should use unambiguous semantic color token names in steps', () => {
    expect(steps.base?.indicator?._current?.color).toBe(
      'display.text.accent.default'
    );
    expect(steps.base?.title?._current?.color).toBe(
      'display.text.accent.default'
    );
  });
});
