/**
 * Unit tests for `resolveInteractiveStyle` — the shared state cascade helper
 * consumed by Button, Link, Checkbox, Switch, RadioGroup, and Select.
 */
import { STATE_PRIORITY } from 'src/semantics/taxonomy';
import {
  resolveInteractiveStyle,
  resolveStateKey,
} from 'src/tokens/resolveInteractiveStyle';

/** One distinct value per state in the cascade — every key of `InteractiveStates`. */
const states = {
  default: 'd',
  hover: 'h',
  active: 'a',
  disabled: 'x',
  focused: 'f',
  checked: 'c',
  selected: 's',
  indeterminate: 'i',
  invalid: 'v',
  expanded: 'e',
  current: 'n',
} as const;

describe('resolveInteractiveStyle', () => {
  test('returns default when no flags are set', () => {
    expect(resolveInteractiveStyle(states, {})).toBe('d');
  });

  test('returns hover when only isHovered is set', () => {
    expect(resolveInteractiveStyle(states, { isHovered: true })).toBe('h');
  });

  test('pressed wins over hovered', () => {
    expect(
      resolveInteractiveStyle(states, { isHovered: true, isPressed: true })
    ).toBe('a');
  });

  test('focused wins over pressed and hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isHovered: true,
        isPressed: true,
        isFocusVisible: true,
      })
    ).toBe('f');
  });

  test('disabled has the highest priority', () => {
    expect(
      resolveInteractiveStyle(states, {
        isHovered: true,
        isPressed: true,
        isFocusVisible: true,
        isDisabled: true,
      })
    ).toBe('x');
  });

  test('is strict: returns undefined when the prioritized state is missing', () => {
    // No `focused` key — mimics `action.primary.background` in the base theme.
    const noFocused = { default: 'd', hover: 'h', active: 'a', disabled: 'x' };
    expect(
      resolveInteractiveStyle(noFocused, { isFocusVisible: true })
    ).toBeUndefined();
  });

  test('callers omit flags to skip a level entirely', () => {
    // Button background pattern: isFocusVisible dropped so bg doesn't
    // collapse to the undefined `focused` key.
    const bg = { default: 'd', hover: 'h', active: 'a', disabled: 'x' };
    expect(
      resolveInteractiveStyle(bg, { isHovered: true, isPressed: true })
    ).toBe('a');
  });

  test('returns undefined for an undefined states object', () => {
    expect(
      resolveInteractiveStyle(undefined, { isHovered: true })
    ).toBeUndefined();
  });

  // --- Selection flags (isSelected context-aware, isIndeterminate → indeterminate) ---

  test('isSelected returns checked when the set declares both keys — the two-state reading wins', () => {
    // The fixture declares `checked` and `selected` — the shape of the base
    // theme's input backgrounds/borders. `checked` outranks `selected` there:
    // every consumer passing `isSelected` against those sets today is a
    // two-state control or ships the checked language (ADR-044).
    expect(resolveInteractiveStyle(states, { isSelected: true })).toBe('c');
  });

  test('isIndeterminate returns indeterminate state', () => {
    expect(resolveInteractiveStyle(states, { isIndeterminate: true })).toBe(
      'i'
    );
  });

  test('isIndeterminate wins over isSelected', () => {
    expect(
      resolveInteractiveStyle(states, {
        isSelected: true,
        isIndeterminate: true,
      })
    ).toBe('i');
  });

  test('disabled wins over isIndeterminate and isSelected', () => {
    expect(
      resolveInteractiveStyle(states, {
        isDisabled: true,
        isIndeterminate: true,
        isSelected: true,
      })
    ).toBe('x');
  });

  test('isSelected wins over focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('c');
  });

  // --- Validation State (isInvalid → invalid) ---
  // FSL §7 + §10.5 parallel: `invalid` is a runtime State (not an authorial
  // Evaluation). It sits below `disabled` because a disabled control cannot
  // surface validation feedback to the user.

  test('isInvalid returns invalid state', () => {
    expect(resolveInteractiveStyle(states, { isInvalid: true })).toBe('v');
  });

  test('disabled wins over isInvalid', () => {
    expect(
      resolveInteractiveStyle(states, { isDisabled: true, isInvalid: true })
    ).toBe('x');
  });

  test('isInvalid wins over isIndeterminate, isSelected, focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isInvalid: true,
        isIndeterminate: true,
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('v');
  });

  // --- Disclosure State (isExpanded → expanded) ---
  // FSL §7: `expanded` is a runtime State for the Disclosure entity, surfaced
  // by `disclose.toggle`. It sits above the selection states and below
  // `disabled`/`isInvalid` so a disabled or invalid disclosure cannot be
  // visually reported as expanded chrome.

  test('isExpanded returns expanded state', () => {
    expect(resolveInteractiveStyle(states, { isExpanded: true })).toBe('e');
  });

  test('disabled wins over isExpanded', () => {
    expect(
      resolveInteractiveStyle(states, { isDisabled: true, isExpanded: true })
    ).toBe('x');
  });

  test('isInvalid wins over isExpanded', () => {
    expect(
      resolveInteractiveStyle(states, { isInvalid: true, isExpanded: true })
    ).toBe('v');
  });

  test('isExpanded wins over isIndeterminate, isSelected, focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isExpanded: true,
        isIndeterminate: true,
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('e');
  });

  // --- Context-aware `isSelected` (ADR-044) ---
  // fsl-theme keeps two selection languages apart by law (families/colors.ts):
  // `checked` — a two-state control that is on; only the `input` context may
  // declare it — and `selected` — membership in a set; declared by
  // `navigation`/`informational`, and by input backgrounds/borders for picker
  // options. One RAC flag serves both, so the key is chosen per consulted
  // token set, in an explicit order: `checked` when declared → `selected`
  // when declared → strict miss (call-site `?? default` applies).

  describe('context-aware isSelected', () => {
    test('a set declaring `selected` and not `checked` resolves selected (navigation/informational shape)', () => {
      const nav = { default: 'd', hover: 'h', selected: 's' };
      expect(resolveInteractiveStyle(nav, { isSelected: true })).toBe('s');
    });

    test('a set declaring only `checked` resolves checked (input text shape)', () => {
      const inputText = { default: 'd', checked: 'c' };
      expect(resolveInteractiveStyle(inputText, { isSelected: true })).toBe(
        'c'
      );
    });

    test('a set declaring neither misses strictly — the normal fallback decides', () => {
      const bare = { default: 'd', hover: 'h' };
      expect(
        resolveInteractiveStyle(bare, { isSelected: true })
      ).toBeUndefined();
      // The documented call-site knob, not an accidental landing:
      expect(
        resolveInteractiveStyle(bare, { isSelected: true }) ?? bare.default
      ).toBe('d');
    });

    test('selected still loses to the states above it in the cascade', () => {
      const nav = { default: 'd', selected: 's', current: 'n', disabled: 'x' };
      expect(
        resolveInteractiveStyle(nav, { isSelected: true, isCurrent: true })
      ).toBe('n');
      expect(
        resolveInteractiveStyle(nav, { isSelected: true, isDisabled: true })
      ).toBe('x');
    });

    test('selected still wins over focusVisible, pressed, hovered', () => {
      const nav = {
        default: 'd',
        hover: 'h',
        active: 'a',
        focused: 'f',
        selected: 's',
      };
      expect(
        resolveInteractiveStyle(nav, {
          isSelected: true,
          isFocusVisible: true,
          isPressed: true,
          isHovered: true,
        })
      ).toBe('s');
    });

    test('isPressed still resolves active — the pressed collapse is retained', () => {
      const nav = { default: 'd', active: 'a', selected: 's' };
      expect(resolveInteractiveStyle(nav, { isPressed: true })).toBe('a');
    });
  });
});

/**
 * `resolveStateKey` is the same walk without the token lookup. It exists so a
 * caller that needs to know *which state the host is painting* — currently
 * `resolveConsequenceInk`, deciding whether its tint still holds — asks the
 * cascade instead of re-deriving the flag→state mapping and drifting from it.
 */
describe('resolveStateKey', () => {
  test('answers `default` when nothing is set', () => {
    expect(resolveStateKey({})).toBe('default');
  });

  test('names the token state, not the React Aria flag', () => {
    // `isPressed` → `active` is exactly the mapping a second reader would get
    // wrong by guessing.
    expect(resolveStateKey({ isPressed: true })).toBe('active');
  });

  test('reports the cascade winner, not the first flag passed', () => {
    expect(resolveStateKey({ isDisabled: true, isHovered: true })).toBe(
      'disabled'
    );
  });

  test('agrees with resolveInteractiveStyle on every state in the tuple', () => {
    for (const { flag, state } of STATE_PRIORITY) {
      expect(resolveStateKey({ [flag]: true })).toBe(state);
      expect(resolveInteractiveStyle(states, { [flag]: true })).toBe(
        states[state]
      );
    }
  });

  // --- Context steering (ADR-044) ---

  test('a token set steers isSelected: selected when the set declares it and not checked', () => {
    expect(
      resolveStateKey({ isSelected: true }, { default: 'd', selected: 's' })
    ).toBe('selected');
  });

  test('a token set steers isSelected: checked when declared, alone or beside selected', () => {
    expect(
      resolveStateKey({ isSelected: true }, { default: 'd', checked: 'c' })
    ).toBe('checked');
    expect(
      resolveStateKey(
        { isSelected: true },
        { default: 'd', selected: 's', checked: 'c' }
      )
    ).toBe('checked');
  });

  test('reports the two-state reading when neither key is declared or no set is in hand', () => {
    // The bare call is how `resolveConsequenceInk` / `resolveSurfaceBoundStyle`
    // ask — pre-ADR-044 behaviour, unchanged.
    expect(resolveStateKey({ isSelected: true })).toBe('checked');
    expect(resolveStateKey({ isSelected: true }, { default: 'd' })).toBe(
      'checked'
    );
  });
});
