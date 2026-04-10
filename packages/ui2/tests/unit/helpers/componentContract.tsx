/**
 * Component contract test factory for @ttoss/ui2.
 *
 * Generates 5 invariant tests (or 4 when hasConsequence=false) that verify the
 * architectural bridge between a component and the FSL token system:
 *
 *   ComponentExpression → resolveTokens() → scoped CSS vars → DOM
 *
 * These are integration tests — they cover what resolver.test.ts cannot:
 * whether the component actually calls the resolver correctly and injects
 * the result into the DOM as --_* scoped vars.
 *
 * NOT tested here (resolver.test.ts covers): formula correctness, state sets,
 * UxContext mapping, consequence override logic.
 *
 * NOT tested here (standard HTML): className forwarding, onClick, aria-*,
 * disabled — these don't require per-component assertions.
 *
 * To register a new component, add one testComponentContract() call in
 * tests/unit/tests/components.contract.test.tsx.
 */
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import type { ComponentContractConfig } from 'src/_model/factory.types';
import type { ColorSpec, Dimension, FslState } from 'src/_model/resolver';
import { resolveTokens } from 'src/_model/resolver';
import type { Consequence } from 'src/_model/taxonomy';

export type { ComponentContractConfig };

export const testComponentContract = ({
  Component,
  scope,
  responsibility,
  evaluation,
  hasConsequence = true,
  isVoid = false,
  probeVar,
  wrapper: Wrapper,
}: ComponentContractConfig): void => {
  describe(`${scope} — component contract`, () => {
    const tid = `${scope}-contract`;

    // Void elements (e.g. <input>) cannot have children.
    const content = isVoid ? undefined : 'test';

    const probe = probeVar ?? {
      cssVar: '--_bg',
      dimension: 'background' as Dimension,
      state: 'default' as FslState,
    };

    const wrap = (el: React.ReactElement): React.ReactElement => {
      return Wrapper ? React.createElement(Wrapper, null, el) : el;
    };

    test(`resolveTokens output reaches DOM as ${probe.cssVar} scoped var`, () => {
      render(wrap(<Component data-testid={tid}>{content}</Component>));
      const resolved = resolveTokens({ responsibility, evaluation }).colors as ColorSpec;
      const expected = resolved[probe.dimension][probe.state];
      expect(screen.getByTestId(tid).style.getPropertyValue(probe.cssVar)).toBe(
        expected
      );
    });

    if (hasConsequence) {
      test('consequence="destructive" propagates to --_bg (negative role)', () => {
        const destructive: Consequence = 'destructive';
        render(
          wrap(
            <Component data-testid={tid} consequence={destructive}>
              {content}
            </Component>
          )
        );
        const expected = resolveTokens({
          responsibility,
          consequence: destructive,
        }).colors.background.default;
        expect(screen.getByTestId(tid).style.getPropertyValue('--_bg')).toBe(
          expected
        );
      });
    }

    test(`data-scope="${scope}" is applied`, () => {
      render(wrap(<Component data-testid={tid}>{content}</Component>));
      expect(screen.getByTestId(tid)).toHaveAttribute('data-scope', scope);
    });

    test('data-scope cannot be overridden by consumer props', () => {
      // Verifies semantic attrs are placed AFTER {...rest} spread in the component.
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

    test('consumer style prop is merged alongside scoped vars', () => {
      render(
        wrap(
          <Component data-testid={tid} style={{ opacity: 0.5 }}>
            {content}
          </Component>
        )
      );
      const el = screen.getByTestId(tid);
      expect(el.style.opacity).toBe('0.5');
      const resolved = resolveTokens({ responsibility, evaluation }).colors as ColorSpec;
      const expected = resolved[probe.dimension][probe.state];
      expect(el.style.getPropertyValue(probe.cssVar)).toBe(expected);
    });
  });
};
