import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { ENTITIES } from '@ttoss/fsl-ui/semantics';
import { axe } from 'jest-axe';

import { CATALOG } from '../../../src/catalog/catalog';
import { ComponentsPage } from '../../../src/pages/ComponentsPage';
import { ThemePage } from '../../../src/pages/ThemePage';
import { theme } from '../../../src/theme';

const renderPage = (page: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{page}</ThemeProvider>);
};

describe('catalog derivation', () => {
  test('covers every Entity from the package meta exports', () => {
    for (const entity of ENTITIES) {
      expect(CATALOG[entity].length).toBeGreaterThan(0);
    }
  });

  test('well-known identities land under their Entity', () => {
    expect(
      CATALOG.Action.map((e) => {
        return e.name;
      })
    ).toContain('Button');
    expect(
      CATALOG.Structure.map((e) => {
        return e.name;
      })
    ).toContain('AppShell');
    expect(
      CATALOG.Structure.map((e) => {
        return e.name;
      })
    ).toContain('Icon');
    expect(
      CATALOG.Collection.map((e) => {
        return e.name;
      })
    ).toContain('Table');
    expect(
      CATALOG.Selection.map((e) => {
        return e.name;
      })
    ).toContain('TableRow');
  });

  test('entries are sorted and carry structural roles', () => {
    for (const entity of ENTITIES) {
      const names = CATALOG[entity].map((e) => {
        return e.name;
      });
      expect(names).toEqual(
        [...names].sort((a, b) => {
          return a.localeCompare(b);
        })
      );
      for (const entry of CATALOG[entity]) {
        expect(entry.structure.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('ComponentsPage', () => {
  test('renders one section per Entity, derived live, with no a11y violations', async () => {
    const { container } = renderPage(<ComponentsPage />);

    for (const entity of ENTITIES) {
      expect(
        screen.getByRole('heading', { level: 3, name: entity })
      ).toBeInTheDocument();
    }

    const actionTable = screen.getByRole('grid', {
      name: 'Action components',
    });
    expect(
      within(actionTable).getByRole('rowheader', { name: 'Button' })
    ).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  }, 30000);
});

describe('ThemePage', () => {
  test('renders live color swatches and the type scale, with no a11y violations', async () => {
    const { container } = renderPage(<ThemePage />);

    expect(
      screen.getByRole('heading', { name: 'Semantic colors' })
    ).toBeInTheDocument();
    for (const family of [
      'action',
      'input',
      'navigation',
      'feedback',
      'informational',
    ]) {
      expect(
        screen.getByRole('heading', { level: 4, name: family })
      ).toBeInTheDocument();
    }

    const swatch = screen.getByTitle('action.primary');
    expect(swatch.style.backgroundColor).toBe(
      'var(--tt-colors-action-primary-background-default)'
    );

    expect(screen.getByText('display-lg')).toBeInTheDocument();
    expect(screen.getByText('label-sm')).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  }, 30000);
});
