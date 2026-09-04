/**
 * `useNumberFormat` formats against the locale the application declared, which
 * is not the one react-intl resolves messages with unless a message bundle was
 * loaded for it. The timeline surfaces that read it are covered in
 * LeftSidebar.test.tsx.
 */

import { DEFAULT_LOCALE, I18nProvider } from '@ttoss/react-i18n';
import { renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { useNumberFormat } from 'src/hooks/useNumberFormat';

const ptBr = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider locale="pt-BR">{children}</I18nProvider>;
};

test('groups by the declared locale, message bundle or not', () => {
  const { result } = renderHook(
    () => {
      return useNumberFormat();
    },
    { wrapper: ptBr }
  );

  expect(result.current(13453245)).toBe('13.453.245');
});

const plain = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

test('a provider with no locale of its own formats as the default one', () => {
  const { result } = renderHook(
    () => {
      return useNumberFormat();
    },
    { wrapper: plain }
  );

  expect(result.current(13453245)).toBe(
    new Intl.NumberFormat(DEFAULT_LOCALE).format(13453245)
  );
});
