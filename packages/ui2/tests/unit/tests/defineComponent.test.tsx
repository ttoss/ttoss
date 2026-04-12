/**
 * defineComponent() factory tests.
 *
 * These tests verify that the factory correctly produces:
 *   1. A React component with proper role resolution and data-variant attribute
 *   2. Correct semantic data attributes (scope, part, variant, size)
 *   3. Consumer style merging without overriding semantic attrs
 *   4. Correct contractConfig for testComponentContract()
 *   5. Correct componentMeta for the CSS generation build step
 *   6. All configuration options: fixed evaluation, withInvalidOverlay, dimensions,
 *      hasConsequence, isVoid, sizes, wrapperForTests
 *
 * The factory is tested with minimal configurations first (the invariants),
 * then with each option permutation that changes component behaviour.
 *
 * Note: The factory uses the real resolver — no mocking. The tests assert
 * structural behaviour (DOM attributes, contract config shape, component meta),
 * not specific token values (those are resolver.test.ts's domain).
 *
 * Architecture: Components do NOT inject inline --_* CSS custom properties.
 * Instead, resolveRole() is called at render time to set data-variant={role},
 * and static CSS selectors (generated at build time) apply colors via direct
 * var(--tt-*) theme token references.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import {
  type ComponentMeta,
  defineComponent,
} from 'src/_model/defineComponent';
import { resolveRole } from 'src/_model/resolver';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the element into the DOM and returns it via data-testid. */
const tid = 'subject';

/**
 * Returns all --_* CSS custom properties from an element's inline style.
 * Used to assert that no inline color vars are injected.
 */
const getScopedVars = (el: HTMLElement): string[] => {
  return el.style.cssText
    .split(';')
    .map((s) => {
      return s.trim();
    })
    .filter((s) => {
      return s.startsWith('--_');
    })
    .map((s) => {
      return s.split(':')[0]?.trim();
    })
    .filter(Boolean) as string[];
};

// ---------------------------------------------------------------------------
// 1. Minimal component — native element, variable evaluation
// ---------------------------------------------------------------------------

describe('defineComponent — minimal native element component', () => {
  const {
    Component: MinimalButton,
    contractConfig,
    componentMeta,
  } = defineComponent({
    name: 'MinimalButton',
    scope: 'min-button',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: true,
  });

  test('Component renders a <button> element', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid).tagName).toBe('BUTTON');
  });

  test('data-scope matches the defined scope', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'min-button');
  });

  test('data-part="root" is always applied', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(screen.getByTestId(tid)).toHaveAttribute('data-part', 'root');
  });

  test('data-variant reflects the resolved role (defaults to "primary")', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    const expectedRole = resolveRole({ responsibility: 'Action' });
    expect(screen.getByTestId(tid)).toHaveAttribute(
      'data-variant',
      expectedRole
    );
  });

  test('evaluation prop changes data-variant to the resolved role', () => {
    render(
      <MinimalButton data-testid={tid} evaluation="secondary">
        Click
      </MinimalButton>
    );
    const expectedRole = resolveRole({
      responsibility: 'Action',
      evaluation: 'secondary',
    });
    expect(screen.getByTestId(tid)).toHaveAttribute(
      'data-variant',
      expectedRole
    );
  });

  test('no --_* inline CSS custom properties are injected', () => {
    render(<MinimalButton data-testid={tid}>Click</MinimalButton>);
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });

  test('consumer style is merged (no --_* vars present)', () => {
    render(
      <MinimalButton data-testid={tid} style={{ opacity: 0.5 }}>
        Click
      </MinimalButton>
    );
    expect(screen.getByTestId(tid).style.opacity).toBe('0.5');
    // No --_* scoped vars exist alongside consumer style
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });

  test('data-scope cannot be overridden by consumer props', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(
      <MinimalButton data-testid={tid} {...({ 'data-scope': 'hacked' } as any)}>
        Click
      </MinimalButton>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'min-button');
  });

  test('children are forwarded', () => {
    render(<MinimalButton data-testid={tid}>Hello</MinimalButton>);
    expect(screen.getByTestId(tid).textContent).toBe('Hello');
  });

  test('hasConsequence defaults to true when not provided', () => {
    // Exercises the Babel default-parameter branch for hasConsequence
    const { contractConfig } = defineComponent({
      name: 'DefaultConsq',
      scope: 'default-consq',
      responsibility: 'Action',
      element: 'button',
      // hasConsequence intentionally omitted -> defaults to true -> reflected in contractConfig
    });
    // When evaluation is not fixed, hasConsequence reflects the default (true)
    expect(contractConfig.hasConsequence).toBe(true);
  });

  test('Component.displayName matches the name option', () => {
    expect(MinimalButton.displayName).toBe('MinimalButton');
  });

  // contractConfig assertions
  test('contractConfig.scope matches', () => {
    expect(contractConfig.scope).toBe('min-button');
  });

  test('contractConfig.responsibility matches', () => {
    expect(contractConfig.responsibility).toBe('Action');
  });

  test('contractConfig.evaluation is undefined (variable evaluation)', () => {
    expect(contractConfig.evaluation).toBeUndefined();
  });

  test('contractConfig.hasConsequence is true', () => {
    expect(contractConfig.hasConsequence).toBe(true);
  });

  test('contractConfig.isVoid is false (default)', () => {
    expect(contractConfig.isVoid).toBe(false);
  });

  test('contractConfig.wrapper is undefined (no wrapper needed)', () => {
    expect(contractConfig.wrapper).toBeUndefined();
  });

  test('contractConfig.Component is the same as the produced Component', () => {
    expect(contractConfig.Component).toBe(MinimalButton);
  });

  // componentMeta assertions
  test('componentMeta.scope matches', () => {
    expect(componentMeta.scope).toBe('min-button');
  });

  test('componentMeta.responsibility matches', () => {
    expect(componentMeta.responsibility).toBe('Action');
  });

  test('componentMeta.dimensions is undefined (full dimensions)', () => {
    expect(componentMeta.dimensions).toBeUndefined();
  });

  test('componentMeta.withInvalidOverlay is false (default)', () => {
    expect(componentMeta.withInvalidOverlay).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. consequence prop wiring
// ---------------------------------------------------------------------------

describe('defineComponent — consequence override', () => {
  const { Component: ActionButton } = defineComponent({
    name: 'ActionButton',
    scope: 'action-btn',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: true,
  });

  test('consequence="destructive" resolves to negative role', () => {
    render(
      <ActionButton data-testid={tid} consequence="destructive">
        Delete
      </ActionButton>
    );
    const expectedRole = resolveRole({
      responsibility: 'Action',
      consequence: 'destructive',
    });
    expect(screen.getByTestId(tid)).toHaveAttribute(
      'data-variant',
      expectedRole
    );
  });

  test('consequence="destructive" does not inject inline color styles', () => {
    render(
      <ActionButton data-testid={tid} consequence="destructive">
        Delete
      </ActionButton>
    );
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Fixed evaluation (hasConsequence=false)
// ---------------------------------------------------------------------------

describe('defineComponent — fixed evaluation', () => {
  const {
    Component: HelperLabel,
    contractConfig,
    componentMeta,
  } = defineComponent({
    name: 'HelperLabel',
    scope: 'helper-label',
    responsibility: 'Feedback',
    element: 'span',
    evaluation: 'muted',
    hasConsequence: false,
    dimensions: ['text'],
  });

  test('renders with the fixed evaluation role', () => {
    render(<HelperLabel data-testid={tid}>Help</HelperLabel>);
    const expectedRole = resolveRole({
      responsibility: 'Feedback',
      evaluation: 'muted',
    });
    expect(screen.getByTestId(tid)).toHaveAttribute(
      'data-variant',
      expectedRole
    );
  });

  test('no --_* inline CSS custom properties are injected', () => {
    render(<HelperLabel data-testid={tid}>Help</HelperLabel>);
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });

  test('contractConfig.evaluation is "muted"', () => {
    expect(contractConfig.evaluation).toBe('muted');
  });

  test('contractConfig.hasConsequence is false (fixed evaluation suppresses consequence)', () => {
    // When evaluation is fixed, consequence semantics are meaningless
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('componentMeta.dimensions is ["text"]', () => {
    expect(componentMeta.dimensions).toEqual(['text']);
  });
});

// ---------------------------------------------------------------------------
// 4. withInvalidOverlay
// ---------------------------------------------------------------------------

describe('defineComponent — withInvalidOverlay', () => {
  const {
    Component: FormInput,
    contractConfig,
    componentMeta,
  } = defineComponent({
    name: 'FormInput',
    scope: 'form-input',
    responsibility: 'Input',
    element: 'input',
    isVoid: true,
    hasConsequence: false,
    withInvalidOverlay: true,
  });

  test('renders with correct data-variant (no inline invalid overlay styles)', () => {
    render(<FormInput data-testid={tid} />);
    const expectedRole = resolveRole({ responsibility: 'Input' });
    expect(screen.getByTestId(tid)).toHaveAttribute(
      'data-variant',
      expectedRole
    );
  });

  test('no --_* inline CSS custom properties are injected', () => {
    render(<FormInput data-testid={tid} />);
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });

  test('contractConfig.isVoid is true', () => {
    expect(contractConfig.isVoid).toBe(true);
  });

  test('componentMeta.withInvalidOverlay is true', () => {
    expect(componentMeta.withInvalidOverlay).toBe(true);
  });

  test('componentMeta.scope matches', () => {
    expect(componentMeta.scope).toBe('form-input');
  });

  test('componentMeta.responsibility matches', () => {
    expect(componentMeta.responsibility).toBe('Input');
  });
});

// ---------------------------------------------------------------------------
// 5. isVoid — no children
// ---------------------------------------------------------------------------

describe('defineComponent — isVoid', () => {
  const { Component: VoidEl } = defineComponent({
    name: 'VoidEl',
    scope: 'void-el',
    responsibility: 'Action',
    element: 'button',
    isVoid: true,
    hasConsequence: false,
  });

  test('renders without children (void element)', () => {
    render(<VoidEl data-testid={tid} />);
    expect(screen.getByTestId(tid).childNodes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Sizes
// ---------------------------------------------------------------------------

describe('defineComponent — sizes', () => {
  const { Component: SizedButton } = defineComponent({
    name: 'SizedButton',
    scope: 'sized-button',
    responsibility: 'Action',
    element: 'button',
    sizes: ['sm', 'md', 'lg'],
    hasConsequence: false,
  });

  test('size="md" writes data-size="md"', () => {
    render(
      <SizedButton data-testid={tid} size="md">
        Click
      </SizedButton>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'md');
  });

  test('size="sm" writes data-size="sm"', () => {
    render(
      <SizedButton data-testid={tid} size="sm">
        Click
      </SizedButton>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'sm');
  });

  test('size="lg" writes data-size="lg"', () => {
    render(
      <SizedButton data-testid={tid} size="lg">
        Click
      </SizedButton>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-size', 'lg');
  });

  test('no size prop -> no data-size attribute', () => {
    render(<SizedButton data-testid={tid}>Click</SizedButton>);
    expect(screen.getByTestId(tid)).not.toHaveAttribute('data-size');
  });
});

// ---------------------------------------------------------------------------
// 7. Native HTML element — label
// ---------------------------------------------------------------------------

describe('defineComponent — Native HTML element (label)', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  const { Component: NativeLabel, contractConfig } = defineComponent({
    name: 'NativeLabel',
    scope: 'native-label',
    responsibility: 'Structure',
    element: 'label',
    evaluation: 'secondary',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
  });

  test('renders a <label> element', () => {
    render(
      <Wrapper>
        <NativeLabel data-testid={tid}>Name</NativeLabel>
      </Wrapper>
    );
    expect(screen.getByTestId(tid).tagName).toBe('LABEL');
  });

  test('data-scope and data-part are applied', () => {
    render(
      <Wrapper>
        <NativeLabel data-testid={tid}>Name</NativeLabel>
      </Wrapper>
    );
    expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', 'native-label');
    expect(screen.getByTestId(tid)).toHaveAttribute('data-part', 'root');
  });

  test('no --_* inline CSS custom properties are injected', () => {
    render(
      <Wrapper>
        <NativeLabel data-testid={tid}>Name</NativeLabel>
      </Wrapper>
    );
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });

  test('contractConfig.wrapper matches the provided wrapper', () => {
    expect(contractConfig.wrapper).toBe(Wrapper);
  });
});

// ---------------------------------------------------------------------------
// 8. Native HTML element — span (for feedback text like HelperText)
// ---------------------------------------------------------------------------

describe('defineComponent — Native HTML element (span, text-only)', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  const { Component: NativeSpan } = defineComponent({
    name: 'NativeSpan',
    scope: 'native-span',
    responsibility: 'Feedback',
    element: 'span',
    evaluation: 'muted',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
  });

  test('renders a <span> element', () => {
    render(
      <Wrapper>
        <NativeSpan data-testid={tid}>Hint</NativeSpan>
      </Wrapper>
    );
    expect(screen.getByTestId(tid)).toBeInTheDocument();
    expect(screen.getByTestId(tid).tagName).toBe('SPAN');
  });

  test('no --_* inline CSS custom properties are injected', () => {
    render(
      <Wrapper>
        <NativeSpan data-testid={tid}>Hint</NativeSpan>
      </Wrapper>
    );
    expect(getScopedVars(screen.getByTestId(tid))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 9. contractConfig — full shape validation for testComponentContract() use
// ---------------------------------------------------------------------------

describe('defineComponent — contractConfig is ready to pass to testComponentContract', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  const { Component, contractConfig, componentMeta } = defineComponent({
    name: 'ConfigTest',
    scope: 'config-test',
    responsibility: 'Feedback',
    element: 'span',
    evaluation: 'negative',
    hasConsequence: false,
    dimensions: ['text'],
    wrapperForTests: Wrapper,
    isVoid: false,
  });

  test('Component in contractConfig is the same reference as the returned Component', () => {
    expect(contractConfig.Component).toBe(Component);
  });

  test('scope', () => {
    expect(contractConfig.scope).toBe('config-test');
  });

  test('responsibility', () => {
    expect(contractConfig.responsibility).toBe('Feedback');
  });

  test('evaluation', () => {
    expect(contractConfig.evaluation).toBe('negative');
  });

  test('hasConsequence is false (fixed evaluation)', () => {
    // When evaluation is fixed, hasConsequence is always false
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('isVoid is false', () => {
    expect(contractConfig.isVoid).toBe(false);
  });

  test('wrapper is forwarded', () => {
    expect(contractConfig.wrapper).toBe(Wrapper);
  });

  // componentMeta assertions
  test('componentMeta.scope matches', () => {
    expect(componentMeta.scope).toBe('config-test');
  });

  test('componentMeta.responsibility matches', () => {
    expect(componentMeta.responsibility).toBe('Feedback');
  });

  test('componentMeta.dimensions matches', () => {
    expect(componentMeta.dimensions).toEqual(['text']);
  });

  test('componentMeta.withInvalidOverlay is false (default)', () => {
    expect(componentMeta.withInvalidOverlay).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. Two calls to defineComponent are independent — no shared state
// ---------------------------------------------------------------------------

describe('defineComponent — factory calls are independent', () => {
  const { Component: A } = defineComponent({
    name: 'ButtonA',
    scope: 'btn-a',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: false,
  });

  const { Component: B } = defineComponent({
    name: 'ButtonB',
    scope: 'btn-b',
    responsibility: 'Feedback',
    element: 'button',
    evaluation: 'negative',
    hasConsequence: false,
  });

  test('A and B are different component functions', () => {
    expect(A).not.toBe(B);
  });

  test('A renders scope btn-a', () => {
    render(<A data-testid="a">A</A>);
    expect(screen.getByTestId('a')).toHaveAttribute('data-scope', 'btn-a');
  });

  test('B renders scope btn-b', () => {
    render(<B data-testid="b">B</B>);
    expect(screen.getByTestId('b')).toHaveAttribute('data-scope', 'btn-b');
  });

  test('A and B resolve to different data-variant values', () => {
    render(
      <>
        <A data-testid="a">A</A>
        <B data-testid="b">B</B>
      </>
    );
    const variantA = screen.getByTestId('a').getAttribute('data-variant');
    const variantB = screen.getByTestId('b').getAttribute('data-variant');
    // Action (default primary) vs Feedback (fixed negative) — different roles
    expect(variantA).toBe('primary');
    expect(variantB).toBe('negative');
    expect(variantA).not.toBe(variantB);
  });

  test('neither A nor B injects inline --_* vars', () => {
    render(
      <>
        <A data-testid="a">A</A>
        <B data-testid="b">B</B>
      </>
    );
    expect(getScopedVars(screen.getByTestId('a'))).toHaveLength(0);
    expect(getScopedVars(screen.getByTestId('b'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 12. componentMeta — full shape for each configuration variant
// ---------------------------------------------------------------------------

describe('defineComponent — componentMeta shape', () => {
  test('minimal component returns componentMeta with defaults', () => {
    const { componentMeta } = defineComponent({
      name: 'MetaMin',
      scope: 'meta-min',
      responsibility: 'Action',
      element: 'button',
    });
    expect(componentMeta).toEqual({
      scope: 'meta-min',
      responsibility: 'Action',
      dimensions: undefined,
      withInvalidOverlay: false,
      layout: undefined,
    });
  });

  test('component with dimensions returns componentMeta with dimensions', () => {
    const { componentMeta } = defineComponent({
      name: 'MetaDims',
      scope: 'meta-dims',
      responsibility: 'Feedback',
      element: 'span',
      evaluation: 'muted',
      dimensions: ['text'],
      hasConsequence: false,
    });
    expect(componentMeta.dimensions).toEqual(['text']);
  });

  test('component with withInvalidOverlay returns componentMeta with withInvalidOverlay=true', () => {
    const { componentMeta } = defineComponent({
      name: 'MetaInvalid',
      scope: 'meta-invalid',
      responsibility: 'Input',
      element: 'input',
      isVoid: true,
      withInvalidOverlay: true,
      hasConsequence: false,
    });
    expect(componentMeta.withInvalidOverlay).toBe(true);
  });

  test('componentMeta satisfies ComponentMeta type shape', () => {
    const { componentMeta } = defineComponent({
      name: 'MetaShape',
      scope: 'meta-shape',
      responsibility: 'Structure',
      element: 'span',
      dimensions: ['text', 'background'],
      withInvalidOverlay: false,
      hasConsequence: false,
    });
    // Verify the shape has exactly the expected keys
    const meta: ComponentMeta = componentMeta;
    expect(meta.scope).toBe('meta-shape');
    expect(meta.responsibility).toBe('Structure');
    expect(meta.dimensions).toEqual(['text', 'background']);
    expect(meta.withInvalidOverlay).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 13. hasConsequence interaction with fixedEvaluation in contractConfig
// ---------------------------------------------------------------------------

describe('defineComponent — hasConsequence / fixedEvaluation contractConfig logic', () => {
  test('hasConsequence=true + no fixedEvaluation -> contractConfig.hasConsequence=true', () => {
    const { contractConfig } = defineComponent({
      name: 'ConsqTrue',
      scope: 'consq-true',
      responsibility: 'Action',
      element: 'button',
      hasConsequence: true,
    });
    expect(contractConfig.hasConsequence).toBe(true);
  });

  test('hasConsequence=true + fixedEvaluation -> contractConfig.hasConsequence=false', () => {
    const { contractConfig } = defineComponent({
      name: 'ConsqFixed',
      scope: 'consq-fixed',
      responsibility: 'Action',
      element: 'button',
      evaluation: 'secondary',
      hasConsequence: true,
    });
    // fixedEvaluation suppresses consequence in contractConfig
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('hasConsequence=false + no fixedEvaluation -> contractConfig.hasConsequence=false', () => {
    const { contractConfig } = defineComponent({
      name: 'ConsqFalse',
      scope: 'consq-false',
      responsibility: 'Action',
      element: 'button',
      hasConsequence: false,
    });
    expect(contractConfig.hasConsequence).toBe(false);
  });

  test('consequence prop is ignored when hasConsequence is false', () => {
    const { Component: NoConsq } = defineComponent({
      name: 'NoConsq',
      scope: 'no-consq',
      responsibility: 'Action',
      element: 'button',
      hasConsequence: false,
    });
    render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <NoConsq data-testid={tid} {...({ consequence: 'destructive' } as any)}>
        Click
      </NoConsq>
    );
    // With hasConsequence=false, consequence is not forwarded to resolveRole
    // so data-variant should be 'primary' (default), not 'negative'
    expect(screen.getByTestId(tid)).toHaveAttribute('data-variant', 'primary');
  });
});

// ---------------------------------------------------------------------------
// 14. Ref forwarding
// ---------------------------------------------------------------------------

describe('defineComponent — ref forwarding', () => {
  const { Component: RefButton } = defineComponent({
    name: 'RefButton',
    scope: 'ref-button',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: false,
  });

  test('ref is forwarded to the root DOM element (native element)', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <RefButton ref={ref} data-testid={tid}>
        Click
      </RefButton>
    );
    expect(ref.current).toBe(screen.getByTestId(tid));
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  test('ref is forwarded to native input element', () => {
    const { Component: RefInput } = defineComponent({
      name: 'RefInput',
      scope: 'ref-input',
      responsibility: 'Input',
      element: 'input',
      isVoid: true,
      hasConsequence: false,
      wrapperForTests: ({ children }) => {
        return <>{children}</>;
      },
    });

    const ref = React.createRef<HTMLElement>();
    render(<RefInput ref={ref} data-testid={tid} />);
    expect(ref.current).toBe(screen.getByTestId(tid));
    expect(ref.current?.tagName).toBe('INPUT');
  });

  test('callback ref works', () => {
    let node: HTMLButtonElement | null = null;
    render(
      <RefButton
        ref={(el) => {
          node = el;
        }}
        data-testid={tid}
      >
        Click
      </RefButton>
    );
    expect(node).toBe(screen.getByTestId(tid));
  });

  test('Component.displayName is set on forwardRef component', () => {
    expect(RefButton.displayName).toBe('RefButton');
  });
});

// ---------------------------------------------------------------------------
// 15. Interaction — onClick, disabled, focus/blur
// ---------------------------------------------------------------------------

describe('defineComponent — interaction events', () => {
  const { Component: InteractiveButton } = defineComponent({
    name: 'InteractiveButton',
    scope: 'interactive-btn',
    responsibility: 'Action',
    element: 'button',
    hasConsequence: false,
  });

  test('onClick fires when clicked', () => {
    const onClick = jest.fn();
    render(
      <InteractiveButton data-testid={tid} onClick={onClick}>
        Click
      </InteractiveButton>
    );
    fireEvent.click(screen.getByTestId(tid));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('onClick does NOT fire when disabled (native <button> behavior)', () => {
    const onClick = jest.fn();
    render(
      <InteractiveButton data-testid={tid} onClick={onClick} disabled>
        Click
      </InteractiveButton>
    );
    fireEvent.click(screen.getByTestId(tid));
    expect(onClick).not.toHaveBeenCalled();
  });

  test('onFocus fires on focus', () => {
    const onFocus = jest.fn();
    render(
      <InteractiveButton data-testid={tid} onFocus={onFocus}>
        Click
      </InteractiveButton>
    );
    fireEvent.focus(screen.getByTestId(tid));
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  test('onBlur fires on blur', () => {
    const onBlur = jest.fn();
    render(
      <InteractiveButton data-testid={tid} onBlur={onBlur}>
        Click
      </InteractiveButton>
    );
    const el = screen.getByTestId(tid);
    fireEvent.focus(el);
    fireEvent.blur(el);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
