/**
 * @jest-environment jsdom
 *
 * The hook's server path: SSR has no viewport to measure, so it must commit to
 * the roomy layout and let the client collapse on hydration. Rendering through
 * `react-dom/server` is the only way to reach `getServerSnapshot` — the client
 * renderer never calls it.
 */

import { renderToString } from 'react-dom/server';
import { useCompactViewport } from 'src/ui/useCompactViewport';

const Probe = () => {
  return <span>{String(useCompactViewport())}</span>;
};

describe('useCompactViewport', () => {
  test('reports the roomy layout when rendered on the server', () => {
    expect(renderToString(<Probe />)).toContain('false');
  });
});
