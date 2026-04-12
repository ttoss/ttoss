/**
 * Component contract test factory for @ttoss/ui2.
 *
 * Generates 5 invariant tests (or 4 when hasConsequence=false) that verify the
 * architectural bridge between a component and the FSL semantic system:
 *
 *   ComponentExpression → resolveRole() → data-variant → static CSS
 *
 * These are integration tests — they cover what resolver.test.ts cannot:
 * whether the component actually calls the resolver correctly and sets
 * the correct `data-variant` attribute on the DOM element.
 *
 * NOT tested here (resolver.test.ts covers): formula correctness, state sets,
 * UxContext mapping, consequence override logic.
 *
 * NOT tested here (standard HTML): className forwarding, onClick, aria-*,
 * disabled — these don't require per-component assertions.
 */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentContractConfig } from 'src/_model/factory.types';
import { resolveRole } from 'src/_model/resolver';
import type { Consequence } from 'src/_model/taxonomy';

export type { ComponentContractConfig };

export const testComponentContract = ({
  Component,
  scope,
  responsibility,
  evaluation,
  hasConsequence = true,
  isVoid = false,
  wrapper: Wrapper,
}: ComponentContractConfig): void => {
  describe(`${scope} — component contract`, () => {
    const tid = `${scope}-contract`;

    // Void elements (e.g. <input>) cannot have children.
    const content = isVoid ? undefined : 'test';

    const wrap = (el: React.ReactElement): React.ReactElement => {
      return Wrapper ? React.createElement(Wrapper, null, el) : el;
    };

    test('data-variant reflects resolved role', () => {
      render(wrap(<Component data-testid={tid}>{content}</Component>));
      const expectedRole = resolveRole({ responsibility, evaluation });
      expect(screen.getByTestId(tid)).toHaveAttribute(
        'data-variant',
        expectedRole
      );
    });

    if (hasConsequence) {
      test('consequence="destructive" sets data-variant="negative"', () => {
        const destructive: Consequence = 'destructive';
        render(
          wrap(
            <Component data-testid={tid} consequence={destructive}>
              {content}
            </Component>
          )
        );
        expect(screen.getByTestId(tid)).toHaveAttribute(
          'data-variant',
          'negative'
        );
      });
    }

    test(`data-scope="${scope}" is applied`, () => {
      render(wrap(<Component data-testid={tid}>{content}</Component>));
      expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', scope);
    });

    test('data-scope cannot be overridden by consumer props', () => {
      render(
        wrap(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Component data-testid={tid} {...({ 'data-scope': 'hacked' } as any)}>
            {content}
          </Component>
        )
      );
      expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', scope);
    });

    test('no inline color styles injected — consumer style is passed through', () => {
      render(
        wrap(
          <Component data-testid={tid} style={{ opacity: 0.5 }}>
            {content}
          </Component>
        )
      );
      const el = screen.getByTestId(tid);
      // Consumer style works
      expect(el.style.opacity).toBe('0.5');
      // No inline color styles — colors come from static CSS via data-variant
      expect(el.style.getPropertyValue('--_bg')).toBe('');
      expect(el.style.getPropertyValue('--_text')).toBe('');
      expect(el.style.getPropertyValue('--_border')).toBe('');
    });

    test('ref is forwarded to the root DOM element', () => {
      const ref = React.createRef<HTMLElement>();
      render(
        wrap(
          <Component ref={ref} data-testid={tid}>
            {content}
          </Component>
        )
      );
      expect(ref.current).toBe(screen.getByTestId(tid));
    });
  });
};
