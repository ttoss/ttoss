import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dialog } from '@ttoss/ui2';
import { colorVar, resolveTokens } from '@ttoss/ui2/model';

/**
 * Canonical proof of the Semantic Contract: Dialog + ActionSet composition.
 *
 * This story demonstrates the **full chain** from semantic model to rendered output:
 * `resolveTokens()` → `TokenSpec` → CSS var names → rendered component.
 *
 * The Dialog is a **SurfaceFrame** host. Its Footer acts as an **ActionSet** host
 * where Button variants map to composition roles:
 * - `solid`   → ActionSet.primary (action.primary)
 * - `outline` → ActionSet.secondary (action.secondary)
 * - `ghost`   → ActionSet.dismiss (action.muted)
 */
const meta: Meta = {
  title: 'Sandbox/Semantic Composition',
  tags: ['autodocs'],
  parameters: {
    ttoss: {
      responsibility: 'Overlay',
      host: 'SurfaceFrame',
      composition: [
        'SurfaceFrame.heading → content.primary',
        'SurfaceFrame.body → content.primary',
        'SurfaceFrame.actions → ActionSet host',
        'ActionSet.primary → action.primary (solid button)',
        'ActionSet.secondary → action.secondary (outline button)',
        'ActionSet.dismiss → action.muted (ghost button)',
      ],
    },
  },
};

export default meta;
type Story = StoryObj;

/* ------------------------------------------------------------------ */
/*  Token Resolution Table                                             */
/* ------------------------------------------------------------------ */

const TokenRow = ({
  label,
  spec,
}: {
  label: string;
  spec: ReturnType<typeof resolveTokens>;
}) => {
  return (
    <tr>
      <td style={{ fontWeight: 600, padding: '4px 12px 4px 0' }}>{label}</td>
      <td
        style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px' }}
      >
        {spec.color ?? '—'}
      </td>
      <td
        style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px' }}
      >
        {spec.color ? colorVar(spec.color, 'background') : '—'}
      </td>
      <td
        style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px' }}
      >
        {spec.textStyle ?? '—'}
      </td>
      <td
        style={{ fontFamily: 'monospace', fontSize: 12, padding: '4px 12px' }}
      >
        {spec.elevation ?? '—'}
      </td>
    </tr>
  );
};

const TokenTable = () => {
  const rows = [
    {
      label: 'Dialog (Overlay)',
      spec: resolveTokens({ responsibility: 'Overlay' }),
    },
    {
      label: 'SurfaceFrame.heading',
      spec: resolveTokens({
        responsibility: 'Structure',
        host: 'SurfaceFrame',
        role: 'heading',
      }),
    },
    {
      label: 'SurfaceFrame.body',
      spec: resolveTokens({
        responsibility: 'Structure',
        host: 'SurfaceFrame',
        role: 'body',
      }),
    },
    {
      label: 'ActionSet.primary',
      spec: resolveTokens({
        responsibility: 'Action',
        host: 'ActionSet',
        role: 'primary',
      }),
    },
    {
      label: 'ActionSet.secondary',
      spec: resolveTokens({
        responsibility: 'Action',
        host: 'ActionSet',
        role: 'secondary',
      }),
    },
    {
      label: 'ActionSet.dismiss',
      spec: resolveTokens({
        responsibility: 'Action',
        host: 'ActionSet',
        role: 'dismiss',
      }),
    },
  ];

  return (
    <table
      style={{ borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}
    >
      <thead>
        <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
          <th style={{ textAlign: 'left', padding: '4px 12px 4px 0' }}>
            Context
          </th>
          <th style={{ textAlign: 'left', padding: '4px 12px' }}>color</th>
          <th style={{ textAlign: 'left', padding: '4px 12px' }}>
            CSS var (bg)
          </th>
          <th style={{ textAlign: 'left', padding: '4px 12px' }}>textStyle</th>
          <th style={{ textAlign: 'left', padding: '4px 12px' }}>elevation</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          return <TokenRow key={row.label} {...row} />;
        })}
      </tbody>
    </table>
  );
};

/**
 * Full composition example: Dialog with ActionSet footer.
 *
 * Below the rendered dialog, a token resolution table shows exactly
 * which `TokenSpec` each composition scope resolves to, and the
 * corresponding CSS custom property names.
 */
export const DialogWithActionSet: Story = {
  render: () => {
    return (
      <div>
        <h3 style={{ marginBottom: 8 }}>Token Resolution Trace</h3>
        <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
          Each row shows the output of{' '}
          <code>
            resolveTokens({'{'} responsibility, host, role {'}'})
          </code>{' '}
          for a composition scope inside this Dialog.
        </p>
        <TokenTable />

        <h3 style={{ marginBottom: 8 }}>Rendered Dialog</h3>
        <Dialog.Root open>
          <Dialog.Content
            title="Confirm deployment"
            description="This action will deploy the current build to production."
          >
            <Dialog.Body>
              <p>Review the changes below before proceeding.</p>
              <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 14 }}>
                <li>3 new features</li>
                <li>1 bug fix</li>
                <li>Updated dependencies</li>
              </ul>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost">Cancel</Button>
              <Button variant="outline">Save Draft</Button>
              <Button variant="solid">Deploy</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f8f8f8',
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            lineHeight: 1.6,
          }}
        >
          <strong>Composition mapping:</strong>
          <br />
          Dialog.Content → Overlay (content.primary, elevation.modal)
          <br />
          Dialog.Title → SurfaceFrame.heading (content.primary, title.md)
          <br />
          Dialog.Description → SurfaceFrame.body (content.primary, body.md)
          <br />
          Dialog.Footer → ActionSet host (separation.interactive)
          <br />
          Button[solid] → ActionSet.primary (action.primary)
          <br />
          Button[outline] → ActionSet.secondary (action.secondary)
          <br />
          Button[ghost] → ActionSet.dismiss (action.muted)
        </div>
      </div>
    );
  },
};
