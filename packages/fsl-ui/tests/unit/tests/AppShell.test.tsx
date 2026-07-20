/**
 * AppShell — Structure-entity application-frame primitive.
 *
 * Verifies the region slots render (header/sidebar/main/aside), the body
 * column template reflects which side panels are present and their named
 * widths, and the main region is always present.
 */
import { render } from '@testing-library/react';
import { AppShell, type AppShellSidebarWidth } from 'src/index';

const part = (name: string) => {
  return document.querySelector<HTMLElement>(
    `[data-scope="app-shell"][data-part="${name}"]`
  );
};

describe('AppShell', () => {
  test('renders only the main region by default', () => {
    render(<AppShell>main</AppShell>);
    expect(part('root')).not.toBeNull();
    expect(part('main')).not.toBeNull();
    expect(part('header')).toBeNull();
    expect(part('sidebar')).toBeNull();
    expect(part('aside')).toBeNull();
    // No header → single body row.
    expect(part('root')?.style.gridTemplateRows).toBe('minmax(0, 1fr)');
    // No side panels → single main column.
    expect(part('body')?.style.gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  test('renders the header and reserves a row for it', () => {
    render(<AppShell header={<div>hdr</div>}>main</AppShell>);
    expect(part('header')?.textContent).toBe('hdr');
    expect(part('root')?.style.gridTemplateRows).toBe('auto minmax(0, 1fr)');
  });

  test('sidebar adds a leading column at the named width', () => {
    render(
      <AppShell sidebar={<div>nav</div>} sidebarWidth="md">
        main
      </AppShell>
    );
    expect(part('sidebar')?.textContent).toBe('nav');
    expect(part('body')?.style.gridTemplateColumns).toBe(
      '16rem minmax(0, 1fr)'
    );
  });

  test('aside adds a trailing column at the named width', () => {
    render(
      <AppShell aside={<div>insp</div>} asideWidth="lg">
        main
      </AppShell>
    );
    expect(part('aside')?.textContent).toBe('insp');
    expect(part('body')?.style.gridTemplateColumns).toBe(
      'minmax(0, 1fr) 20rem'
    );
  });

  test('both side panels frame the main region', () => {
    render(
      <AppShell sidebar={<i>n</i>} aside={<i>i</i>}>
        main
      </AppShell>
    );
    expect(part('body')?.style.gridTemplateColumns).toBe(
      '13rem minmax(0, 1fr) 13rem'
    );
  });

  test.each<[AppShellSidebarWidth, string]>([
    ['sm', '13rem'],
    ['md', '16rem'],
    ['lg', '20rem'],
  ])('sidebarWidth=%s resolves to %s', (width, css) => {
    render(
      <AppShell sidebar={<i>n</i>} sidebarWidth={width}>
        main
      </AppShell>
    );
    expect(part('body')?.style.gridTemplateColumns).toBe(
      `${css} minmax(0, 1fr)`
    );
  });

  test('names the sidebar and aside landmarks via labels', () => {
    render(
      <AppShell
        sidebar={<i>n</i>}
        aside={<i>i</i>}
        sidebarLabel="Navigator"
        asideLabel="Inspector"
      >
        main
      </AppShell>
    );
    expect(part('sidebar')).toHaveAttribute('aria-label', 'Navigator');
    expect(part('aside')).toHaveAttribute('aria-label', 'Inspector');
  });

  test('the shell fills the viewport height', () => {
    render(<AppShell>main</AppShell>);
    expect(part('root')?.style.blockSize).toBe('100dvh');
  });

  test('forwards pass-through props to the root', () => {
    render(
      <AppShell id="shell" aria-label="Studio">
        main
      </AppShell>
    );
    const el = part('root');
    expect(el).toHaveAttribute('id', 'shell');
    expect(el).toHaveAttribute('aria-label', 'Studio');
  });
});
