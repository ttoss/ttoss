import { BaseStyles, FlexProps } from '@ttoss/ui';
import ReactMarkdown, { ReactMarkdownOptions } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

export type MarkdownProps = ReactMarkdownOptions & {
  children: string;
  sx?: FlexProps['sx'];
};

export const Markdown = ({ children, sx, ...props }: MarkdownProps) => {
  return (
    <BaseStyles sx={sx}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw] as ReactMarkdownOptions['rehypePlugins']}
        plugins={[remarkGfm]}
        {...props}
      >
        {children}
      </ReactMarkdown>
    </BaseStyles>
  );
};
