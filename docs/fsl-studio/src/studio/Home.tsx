import { Container, Grid, Heading, Stack, Text } from '@ttoss/fsl-ui';

import { type Lens } from './lenses';
import { listDrafts } from './session/drafts';

/**
 * Task-first home (PRD §6.2): a question, not a dashboard. Each task opens
 * the studio with the right lens pre-loaded, never an empty screen. Drafts
 * autosaved from previous sessions continue from here (PRD F1.3) — with the
 * last-write-wins limitation stated in place, not in a modal.
 */
const TASKS: { lens: Lens; title: string; description: string }[] = [
  {
    lens: 'theme',
    title: 'Create a theme',
    description:
      'Edit tokens, watch a page re-theme in light and dark, export DTCG, CSS, or code.',
  },
  {
    lens: 'components',
    title: 'Explore components',
    description:
      'The full catalog with only the prop combinations the FSL grammar allows.',
  },
  {
    lens: 'generate',
    title: 'Generate a composite',
    description:
      'AI-assisted composition with verified proposals — the lens ships in a later phase.',
  },
];

export const Home = ({
  onStartTask,
  onOpenDraft,
  onDeleteDraft,
}: {
  /** Open the studio on a lens with fresh defaults. */
  onStartTask: (lens: Lens) => void;
  /** Continue an autosaved draft (same draft id). */
  onOpenDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
}) => {
  const drafts = listDrafts();

  return (
    <main className="home">
      <Stack gap="md" align="center">
        <Heading level={1} size="headline-md" align="center">
          FSL Studio
        </Heading>
        <Text variant="body-lg" tone="muted" align="center">
          What do you want to do?
        </Text>
      </Stack>

      <Container size="surface" gutter="none">
        <Grid columns={3} gap="sm">
          {TASKS.map((task) => {
            return (
              <button
                key={task.lens}
                type="button"
                className="home-task"
                onClick={() => {
                  return onStartTask(task.lens);
                }}
              >
                <Stack gap="xs">
                  <Text as="span" variant="label-lg">
                    {task.title}
                  </Text>
                  <Text as="span" variant="body-sm" tone="muted">
                    {task.description}
                  </Text>
                </Stack>
              </button>
            );
          })}
        </Grid>
      </Container>

      {drafts.length > 0 ? (
        <Container size="surface" gutter="none">
          <section aria-label="Drafts">
            <Stack gap="sm">
              <Heading level={2} size="title-sm">
                Continue
              </Heading>
              <ul className="home-drafts-list">
                {drafts.map((draft) => {
                  const edits = Object.keys(
                    draft.snapshot.theme.overrides
                  ).length;
                  return (
                    <li key={draft.id}>
                      <Stack direction="horizontal" gap="sm" align="center">
                        <button
                          type="button"
                          className="home-draft-open"
                          onClick={() => {
                            return onOpenDraft(draft.id);
                          }}
                        >
                          {draft.snapshot.theme.preset} · {edits} edit
                          {edits === 1 ? '' : 's'} ·{' '}
                          {new Date(draft.updatedAt).toLocaleString()}
                        </button>
                        <button
                          type="button"
                          className="home-draft-delete"
                          aria-label={`Delete draft ${draft.id}`}
                          onClick={() => {
                            return onDeleteDraft(draft.id);
                          }}
                        >
                          Delete
                        </button>
                      </Stack>
                    </li>
                  );
                })}
              </ul>
              <Text variant="body-sm" tone="muted">
                Drafts autosave locally in this browser. The same draft open in
                two tabs saves last-write-wins.
              </Text>
            </Stack>
          </section>
        </Container>
      ) : null}
    </main>
  );
};
