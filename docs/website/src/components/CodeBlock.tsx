import * as React from 'react';
import ThemeCodeBlock from '@theme/CodeBlock';

export const CodeBlock = (props) => {
  return (
    <div
      style={{
        marginTop: '32px',
        fontSize: '0.9em',
        maxHeight: '600px',
        overflowY: 'auto',
        marginBottom: '32px',
      }}
    >
      <ThemeCodeBlock {...props} />
    </div>
  );
};
