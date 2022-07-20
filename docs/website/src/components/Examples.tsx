import * as React from 'react';
import CodeBlock from '@theme/CodeBlock';

export const Examples = ({ examples }: { examples: [string, string][] }) => {
  return (
    <>
      {examples.map(([command, description]) => {
        return (
          <React.Fragment key={command}>
            <ul>
              <li>{description}</li>
            </ul>
            <div style={{ marginBottom: ' var(--ifm-leading)' }}>
              <CodeBlock className="bash">{command}</CodeBlock>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};
