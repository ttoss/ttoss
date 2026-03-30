import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dialog } from '@ttoss/ui2';

/**
 * Side-by-side comparison: raw Ark UI vs ui2.
 *
 * Both render the same dialog footer with three action buttons.
 * The difference is **what guarantees exist**:
 *
 * - **Raw Ark UI**: developer manually picks CSS tokens. Nothing validates
 *   the choices. A button could use `--tt-content-*` in an action context
 *   and nothing would catch it.
 *
 * - **ui2**: tokens are resolved deterministically via `resolveTokens()`.
 *   Contract tests validate that CSS uses only the prescribed namespaces.
 *   Semantic drift is caught at build time.
 */
const meta: Meta = {
  title: 'Sandbox/Why ui2',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const SectionLabel = ({
  children,
  tag,
}: {
  children: string;
  tag: 'validated' | 'unvalidated';
}) => {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ margin: 0 }}>{children}</h4>
      <span
        style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 4,
          background: tag === 'validated' ? '#dcfce7' : '#fef3c7',
          color: tag === 'validated' ? '#166534' : '#92400e',
          fontWeight: 600,
        }}
      >
        {tag === 'validated'
          ? 'Contract-tested — drift = CI failure'
          : 'No validation — drift is silent'}
      </span>
    </div>
  );
};

const CodeBlock = ({ code }: { code: string }) => {
  return (
    <pre
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: 16,
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.5,
        overflow: 'auto',
        marginTop: 12,
      }}
    >
      {code}
    </pre>
  );
};

/**
 * Same dialog footer rendered two ways.
 *
 * **Left**: Raw Ark UI — developer manually writes inline styles
 * using `--tt-*` tokens. No validation that the token choices are
 * semantically correct.
 *
 * **Right**: ui2 — tokens are prescribed by `resolveTokens()` and
 * enforced by contract tests.
 */
export const Comparison: Story = {
  render: () => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
        }}
      >
        {/* ── Raw Ark UI ─────────────────────────────────────── */}
        <div>
          <SectionLabel tag="unvalidated">Raw Ark UI</SectionLabel>

          <ArkDialog.Root open>
            <Portal disabled>
              <ArkDialog.Positioner
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <ArkDialog.Content
                  style={{
                    background:
                      'var(--tt-content-primary-background-default, #fff)',
                    border:
                      '1px solid var(--tt-content-primary-border-default, #e0e0e0)',
                    borderRadius: 'var(--tt-radii-md, 8px)',
                    boxShadow: 'var(--tt-elevation-modal)',
                    padding: 'var(--tt-spacing-inset-surface-lg, 24px)',
                    width: '100%',
                    maxWidth: 440,
                  }}
                >
                  <ArkDialog.Title
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    Unsaved changes
                  </ArkDialog.Title>
                  <ArkDialog.Description style={{ fontSize: 14, opacity: 0.7 }}>
                    What would you like to do?
                  </ArkDialog.Description>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                      marginTop: 16,
                    }}
                  >
                    {/* Developer manually picks tokens — could be wrong */}
                    <button
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Discard
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        border:
                          '1px solid var(--tt-action-secondary-border-default, #ccc)',
                        background: 'transparent',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Go back
                    </button>
                    <button
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background:
                          'var(--tt-action-primary-background-default, #0469E3)',
                        color: 'var(--tt-action-primary-text-default, #fff)',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Save
                    </button>
                  </div>
                </ArkDialog.Content>
              </ArkDialog.Positioner>
            </Portal>
          </ArkDialog.Root>

          <CodeBlock
            code={`// Raw Ark UI — developer picks tokens manually
<ArkDialog.Content style={{
  background: 'var(--tt-content-primary-...)',
  // ^ could accidentally use --tt-navigation-*
  // Nothing catches semantic drift
}}>
  <button style={{
    background: 'var(--tt-action-primary-...)',
    // ^ correct, but not enforced
  }}>
    Save
  </button>
</ArkDialog.Content>`}
          />
        </div>

        {/* ── ui2 ────────────────────────────────────────────── */}
        <div>
          <SectionLabel tag="validated">ui2</SectionLabel>

          <Dialog.Root open>
            <Dialog.Content
              title="Unsaved changes"
              description="What would you like to do?"
            >
              <Dialog.Footer>
                <Button variant="ghost">Discard</Button>
                <Button variant="outline">Go back</Button>
                <Button variant="solid">Save</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Root>

          <CodeBlock
            code={`// ui2 — tokens resolved by the model
<Dialog.Content title="Unsaved changes" ...>
  <Dialog.Footer>
    {/* ActionSet.dismiss → action.muted */}
    <Button variant="ghost">Discard</Button>
    {/* ActionSet.secondary → action.secondary */}
    <Button variant="outline">Go back</Button>
    {/* ActionSet.primary → action.primary */}
    <Button variant="solid">Save</Button>
  </Dialog.Footer>
</Dialog.Content>

// Contract tests enforce:
// ✓ Dialog CSS uses only content.primary tokens
// ✓ Footer scope allows only action.* tokens
// ✓ Adding --tt-navigation-* = CI failure`}
          />
        </div>
      </div>
    );
  },
};

/**
 * What happens when drift occurs.
 *
 * In raw Ark UI, a developer could accidentally use the wrong semantic
 * namespace and nothing would catch it. In ui2, contract tests fail
 * immediately with a clear error message.
 */
export const DriftDetection: Story = {
  render: () => {
    return (
      <div style={{ maxWidth: 700 }}>
        <h3 style={{ marginBottom: 16 }}>What contract tests catch</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: '2px solid #dcfce7',
              background: '#f0fdf4',
            }}
          >
            <h4 style={{ color: '#166534', margin: '0 0 8px' }}>✓ Passes</h4>
            <code style={{ fontSize: 12, lineHeight: 1.5 }}>
              .ui2-button {'{'}
              <br />
              {'  '}background: var(--tt-action-primary-...);
              <br />
              {'  /* Action component → action.* tokens ✓ */'}
              <br />
              {'}'}
            </code>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: '2px solid #fecaca',
              background: '#fef2f2',
            }}
          >
            <h4 style={{ color: '#991b1b', margin: '0 0 8px' }}>✗ Fails</h4>
            <code style={{ fontSize: 12, lineHeight: 1.5 }}>
              .ui2-button {'{'}
              <br />
              {'  '}color: var(--tt-content-primary-...);
              <br />
              {'  /* Action component → content.* ✗ */'}
              <br />
              {'}'}
            </code>
          </div>
        </div>

        <div
          style={{
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: '#f87171' }}>FAIL</span> Button — resolveTokens
          enforcement
          <br />
          <br />
          <span style={{ color: '#f87171' }}>Expected: </span>
          {'[]'}
          <br />
          <span style={{ color: '#86efac' }}>Received: </span>
          {'['}
          <br />
          {'  '}&quot;--tt-content-primary-text-default → color namespace
          &quot;content&quot; not allowed
          <br />
          {'  '}for Responsibility=Action (resolveTokens →
          color=&quot;action.primary&quot;,
          <br />
          {'  '}allowed=[action, radii, spacing])&quot;
          <br />
          {']'}
        </div>
      </div>
    );
  },
};
