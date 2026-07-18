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
      <h1 className="home-brand">FSL Studio</h1>
      <p className="home-question">What do you want to do?</p>
      <div className="home-tasks">
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
              <span className="home-task-title">{task.title}</span>
              <span className="home-task-description">{task.description}</span>
            </button>
          );
        })}
      </div>

      {drafts.length > 0 ? (
        <section className="home-drafts" aria-label="Drafts">
          <h2 className="home-drafts-title">Continue</h2>
          <ul className="home-drafts-list">
            {drafts.map((draft) => {
              const edits = Object.keys(draft.snapshot.theme.overrides).length;
              return (
                <li key={draft.id} className="home-draft-row">
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
                </li>
              );
            })}
          </ul>
          <p className="theme-hint">
            Drafts autosave locally in this browser. The same draft open in two
            tabs saves last-write-wins.
          </p>
        </section>
      ) : null}
    </main>
  );
};
