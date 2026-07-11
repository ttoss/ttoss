import type { FlexProps } from '@ttoss/ui';
import { BaseStyles } from '@ttoss/ui';
import type { Options } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export type MarkdownProps = Options & {
  children: string;
  sx?: FlexProps['sx'];
};

export const Markdown = ({ children, sx, ...props }: MarkdownProps) => {
  return (
    <BaseStyles sx={sx}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        remarkPlugins={[remarkGfm]}
        {...props}
      >
        {children}
      </ReactMarkdown>
    </BaseStyles>
  );
};
