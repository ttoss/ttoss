import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, tdStyle, thStyle } from '../../_lib/SharedComponents';
import { byPrefix, rawCoreTokens, toCssVarName } from '../../_lib/tokenUtils';

const meta: Meta = {
  title: 'theme-v2/Tokens/Motion',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: Durations — all core motion duration tokens
// ---------------------------------------------------------------------------

/**
 * **Motion durations** — `core.motion.duration.*` values from `0ms` to `500ms`.
 *
 * The animated bar transitions each duration value live so you can perceive
 * the difference in feedback speed. Duration tokens govern how quickly UI
 * interactions feel responsive vs. deliberate.
 */
export const Durations: StoryObj = {
  render: () => {
    const durationEntries = byPrefix(rawCoreTokens, 'core.motion.duration.');

    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          maxWidth: 800,
        }}
      >
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Duration tokens control how long transitions take. Hover each row to
          observe the animation at that duration. Shorter durations feel snappy
          and immediate; longer durations feel deliberate and flowing.
        </p>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 80 }}>Step</th>
              <th style={{ ...thStyle, width: 260 }}>CSS var</th>
              <th style={{ ...thStyle, width: 80 }}>Value</th>
              <th style={thStyle}>Demo (hover to animate)</th>
            </tr>
          </thead>
          <tbody>
            {durationEntries.map(([path, val]) => {
              const cssVar = toCssVarName(path);
              const step = path.split('.').pop() ?? '';
              return (
                <tr key={path}>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {step}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: 'var(--tt-colors-content-muted-text-default)',
                    }}
                  >
                    <Code>{cssVar}</Code>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                    {String(val)}
                  </td>
                  <td style={tdStyle}>
                    <style>{`
                      .dur-demo-${step}:hover .dur-bar-${step} {
                        width: 100% !important;
                        opacity: 1 !important;
                      }
                    `}</style>
                    <div
                      className={`dur-demo-${step}`}
                      style={{
                        width: '100%',
                        height: 28,
                        borderRadius: 6,
                        background:
                          'var(--tt-colors-action-secondary-background-default)',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        className={`dur-bar-${step}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: '10%',
                          opacity: 0.6,
                          borderRadius: 6,
                          background:
                            'var(--tt-colors-action-accent-background-default)',
                          transition: `width var(${cssVar}) cubic-bezier(0.4,0,0.2,1), opacity var(${cssVar}) linear`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: Easings — core easing curves
// ---------------------------------------------------------------------------

/**
 * **Easing functions** — `core.motion.easing.*` cubic-bezier curves that define
 * the acceleration profile of an animation.
 *
 * - **standard** — Material-style ease-in-out; most general-purpose transitions.
 * - **enter** — Decelerating; elements arriving on screen feel natural.
 * - **exit** — Accelerating; elements leaving screen feel purposeful.
 * - **linear** — Constant speed; for continuous looping or opacity fades.
 *
 * Hover the demo cards to trigger the animation with each easing curve.
 */
export const Easings: StoryObj = {
  render: () => {
    const easingEntries = byPrefix(rawCoreTokens, 'core.motion.easing.');
    const easingDescriptions: Record<string, string> = {
      standard: 'Ease in-out. General purpose for most UI transitions.',
      enter: 'Decelerate (ease-out). Elements arriving on screen.',
      exit: 'Accelerate (ease-in). Elements leaving the screen.',
      linear: 'Constant speed. Looping animations, opacity fades.',
    };

    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          maxWidth: 900,
        }}
      >
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Easing functions shape how motion feels. The same 300 ms animation can
          feel snappy, natural, or heavy depending on its easing curve. Hover
          each card to trigger a 300 ms slide using that easing.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {easingEntries.map(([path, val]) => {
            const cssVar = toCssVarName(path);
            const name = path.split('.').pop() ?? '';
            const desc = easingDescriptions[name] ?? '';
            return (
              <div key={path}>
                <style>{`
                  .ease-card-${name}:hover .ease-ball-${name} {
                    transform: translateX(140px) !important;
                  }
                `}</style>
                <div
                  className={`ease-card-${name}`}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border:
                      '1px solid var(--tt-colors-content-secondary-border-default)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Demo track */}
                  <div
                    style={{
                      height: 40,
                      position: 'relative',
                      marginBottom: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className={`ease-ball-${name}`}
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 0,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background:
                          'var(--tt-colors-action-accent-background-default)',
                        transition: `transform 300ms var(${cssVar})`,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      marginBottom: 4,
                      textTransform: 'capitalize',
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--tt-colors-content-muted-text-default)',
                      marginBottom: 8,
                    }}
                  >
                    {desc}
                  </div>
                  <Code>{String(val)}</Code>
                </div>
              </div>
            );
          })}
        </div>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '32px 0 12px',
            paddingBottom: 8,
            borderBottom:
              '1px solid var(--tt-colors-content-secondary-border-default)',
          }}
        >
          All easing vars
        </h2>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
        >
          <thead>
            <tr>
              {['Name', 'CSS var', 'Value'].map((h) => {
                return (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {easingEntries.map(([path, val]) => {
              const cssVar = toCssVarName(path);
              const name = path.split('.').pop() ?? '';
              return (
                <tr key={path}>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  >
                    {name}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      color: 'var(--tt-colors-content-muted-text-default)',
                    }}
                  >
                    <Code>{cssVar}</Code>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    {String(val)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
};
