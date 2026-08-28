/**
 * AppShell — Structure-entity application-frame primitive.
 *
 * Verifies the region slots render (header/sidebar/main/aside), the body
 * column template reflects which side panels are present and their named
 * widths, and the main region is always present.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell, type AppShellSidebarWidth } from 'src/index';
import { PANEL_WIDTH } from 'src/tokens/panelWidth';

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

  test('every region is a size container for the theme cqi scales (ADR-011)', () => {
    render(
      <AppShell header={<i>h</i>} sidebar={<i>n</i>} aside={<i>i</i>}>
        main
      </AppShell>
    );
    for (const region of ['header', 'sidebar', 'main', 'aside'] as const) {
      expect(part(region)?.style.containerType).toBe('inline-size');
    }
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

// ---------------------------------------------------------------------------
// The temporary sidebar (F-023)
//
// The shell used to compose its body as a fixed grid with no way out, so at
// 390px the document scrolled to 442px and nothing in the system could express
// the alternative. The axis is the reference systems' — MUI names exactly this
// distinction on its Drawer — and it lives on the navigation region because
// that is the part whose behaviour changes.
// ---------------------------------------------------------------------------

describe('AppShell — temporary sidebar', () => {
  const temporary = (props: Record<string, unknown> = {}) => {
    return (
      <AppShell
        header={<i>h</i>}
        sidebar={<nav>links</nav>}
        sidebarLabel="Navigation"
        sidebarTriggerLabel="Open navigation"
        sidebarVariant="temporary"
        {...props}
      >
        main
      </AppShell>
    );
  };

  test('drops the sidebar track — the overflow F-023 measured is gone', () => {
    render(temporary());
    expect(part('sidebar')).toBeNull();
    // The body is main-only: no fixed start column to overflow the viewport.
    expect(part('body')?.style.gridTemplateColumns).toBe('minmax(0, 1fr)');
  });

  test('reveals the panel through a named trigger in the header row', () => {
    render(temporary());
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    expect(trigger).toBeVisible();
    // It sits in the header row rather than floating over the content — the
    // placement all three reference systems use, and the only one that does
    // not depend on what the host put in its header.
    expect(part('header')?.contains(trigger)).toBe(true);
  });

  test('forces a header row into existence when the host supplied none', () => {
    // Otherwise the trigger has nowhere to live and the panel is unreachable —
    // the failure this variant exists to prevent.
    render(temporary({ header: undefined }));
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    expect(part('header')?.contains(trigger)).toBe(true);
  });

  test('opens the drawer on press, with the sidebar inside it', async () => {
    const user = userEvent.setup();
    render(temporary());
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog).toBeVisible();
    expect(dialog.textContent).toContain('links');
  });

  test('the drawer keeps the width the sidebar track would have had', async () => {
    const user = userEvent.setup();
    render(temporary({ sidebarWidth: 'lg' }));
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const surface = document.querySelector<HTMLElement>(
      '[data-scope="drawer"][data-part="surface"]'
    );
    expect(surface?.style.inlineSize).toBe(PANEL_WIDTH.lg);
  });

  test('reports open state, and a controlled host owns it', async () => {
    const user = userEvent.setup();
    const onSidebarOpenChange = jest.fn();
    render(temporary({ isSidebarOpen: false, onSidebarOpenChange }));
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    expect(onSidebarOpenChange).toHaveBeenCalledWith(true);
    // Controlled: the shell did not open itself behind the host's back.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('without a trigger label it stays permanent rather than hide the panel', () => {
    // The safety rule, and the reason `sidebarTriggerLabel` is not optional in
    // spirit: an English default is forbidden (ADR-001), and a shell that
    // scrolls beats one whose navigation cannot be reached at all.
    render(temporary({ sidebarTriggerLabel: undefined }));
    expect(part('sidebar')).not.toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Open navigation' })
    ).toBeNull();
    expect(part('body')?.style.gridTemplateColumns).toBe(
      `${PANEL_WIDTH.sm} minmax(0, 1fr)`
    );
  });

  test('permanent is untouched — the default frame did not move', () => {
    render(
      <AppShell header={<i>h</i>} sidebar={<nav>links</nav>}>
        main
      </AppShell>
    );
    expect(part('sidebar')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(part('body')?.style.gridTemplateColumns).toBe(
      `${PANEL_WIDTH.sm} minmax(0, 1fr)`
    );
  });
});
