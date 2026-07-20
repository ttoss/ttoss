import { render } from '@testing-library/react';
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import type * as React from 'react';
import { previewFor, PREVIEWS } from 'src/studio/components/previews';

const wrap = (node: React.ReactNode) => {
  return (
    <ThemeProvider theme={createTheme()} defaultMode="light">
      {node}
    </ThemeProvider>
  );
};

describe('preview registry', () => {
  const sel = { evaluation: 'primary', consequence: 'committing' };

  test.each(Object.keys(PREVIEWS))(
    '%s renders and generates a code snippet',
    (name) => {
      const def = PREVIEWS[name];

      // Renders with explicit props and with defaults, without throwing.
      const withProps = render(wrap(<>{def.render(sel)}</>));
      expect(withProps.container).toBeInTheDocument();
      withProps.unmount();

      const withDefaults = render(wrap(<>{def.render({})}</>));
      expect(withDefaults.container).toBeInTheDocument();
      withDefaults.unmount();

      // Code is a non-empty string in both cases.
      expect(def.code(sel).length).toBeGreaterThan(0);
      expect(def.code({}).length).toBeGreaterThan(0);
    }
  );

  test('code embeds the selected evaluation only when set', () => {
    expect(PREVIEWS.Button.code({ evaluation: 'accent' })).toContain(
      'evaluation="accent"'
    );
    expect(PREVIEWS.Button.code({})).not.toContain('evaluation=');
  });

  test('code embeds the selected consequence only when set', () => {
    expect(PREVIEWS.Button.code({ consequence: 'destructive' })).toContain(
      'consequence="destructive"'
    );
    expect(PREVIEWS.Button.code({})).not.toContain('consequence=');
  });

  test('previewFor resolves by display name and misses gracefully', () => {
    expect(previewFor('Button')).toBe(PREVIEWS.Button);
    expect(previewFor('DialogHeading')).toBeUndefined();
  });
});
