import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import type * as React from 'react';
import { EXAMPLE_PAGES, findPage } from 'src/studio/components/examplePages';

const wrap = (node: React.ReactNode) => {
  return (
    <ThemeProvider theme={createTheme()} defaultMode="light">
      {node}
    </ThemeProvider>
  );
};

describe('example pages', () => {
  test.each(
    EXAMPLE_PAGES.map((page) => {
      return page.id;
    })
  )('%s page renders', (id) => {
    const page = findPage(id);
    const { container, unmount } = render(wrap(<>{page?.render()}</>));
    expect(container).toBeInTheDocument();
    unmount();
  });

  test('findPage misses gracefully', () => {
    expect(findPage('__missing__')).toBeUndefined();
  });

  test('form validates a required field on submit', async () => {
    const user = userEvent.setup();
    const page = findPage('form');
    render(wrap(<>{page?.render()}</>));

    // Submitting empty surfaces the validation error (invalid state).
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();

    // Providing a value and resubmitting clears it.
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.queryByText('Email is required.')).not.toBeInTheDocument();
  });

  test('wizard advances to the next step', async () => {
    const user = userEvent.setup();
    const page = findPage('wizard');
    render(wrap(<>{page?.render()}</>));

    expect(screen.getByText(/tell us about your project/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/invite your team/)).toBeInTheDocument();
  });

  test('dashboard shows feedback meters', () => {
    const page = findPage('dashboard');
    render(wrap(<>{page?.render()}</>));
    const meters = screen.getAllByRole('meter');
    expect(meters.length).toBeGreaterThanOrEqual(3);
  });

  test('confirm page renders both triggers', () => {
    const page = findPage('confirm');
    const { container } = render(wrap(<>{page?.render()}</>));
    expect(
      within(container).getByRole('button', { name: 'Publish post' })
    ).toBeInTheDocument();
    expect(
      within(container).getByRole('button', { name: 'Delete account' })
    ).toBeInTheDocument();
  });

  test('committing dialog confirms on a single click', async () => {
    const user = userEvent.setup();
    const page = findPage('confirm');
    render(wrap(<>{page?.render()}</>));

    await user.click(screen.getByRole('button', { name: 'Publish post' }));
    expect(screen.getByText('Publish post?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    // Confirming closes the dialog (onConfirm ran).
    expect(screen.queryByText('Publish post?')).not.toBeInTheDocument();
  });

  test('destructive dialog arms before confirming', async () => {
    const user = userEvent.setup();
    const page = findPage('confirm');
    render(wrap(<>{page?.render()}</>));

    await user.click(screen.getByRole('button', { name: 'Delete account' }));
    // First click arms (label changes); second click confirms.
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      screen.getByRole('button', { name: 'Click again to confirm' })
    );
    expect(screen.queryByText('Delete account?')).not.toBeInTheDocument();
  });
});
