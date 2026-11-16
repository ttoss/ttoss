import * as React from 'react';

import { createFakeApi } from './fakeApi';

/**
 * A fake API whose requests are recorded, so a story can show exactly what
 * the components sent.
 */
export const useLoggedFakeApi = (
  options: Omit<Parameters<typeof createFakeApi>[0], 'onRequest'> = {}
) => {
  const [log, setLog] = React.useState<string[]>([]);
  const fetcher = React.useMemo(() => {
    return createFakeApi({
      ...options,
      onRequest: (entry) => {
        setLog((current) => {
          return [entry, ...current].slice(0, 8);
        });
      },
    });
    // The fake keeps its data in a closure; create it once per story.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { fetcher, log };
};

export const Frame = ({
  children,
  maxWidth = 1100,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) => {
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: 24,
        maxWidth,
      }}
    >
      {children}
    </div>
  );
};

export const RequestLog = ({ log }: { log: string[] }) => {
  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#737373',
          marginBottom: 8,
        }}
      >
        {'Requests sent to the fake API (newest first)'}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 6,
          background: '#171717',
          color: '#e5e5e5',
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          minHeight: 40,
        }}
      >
        {log.length > 0 ? log.join('\n') : '—'}
      </pre>
    </div>
  );
};
