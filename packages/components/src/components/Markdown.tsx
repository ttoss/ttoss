import { BaseStyles, FlexProps } from '@ttoss/ui';
import ReactMarkdown, { ReactMarkdownOptions } from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type MarkdownProps = ReactMarkdownOptions & {
  children: string;
  sx?: FlexProps['sx'];
};

export const Markdown = ({ children, sx, ...props }: MarkdownProps) => {
  return (
    <BaseStyles sx={sx}>
      <ReactMarkdown plugins={[remarkGfm]} {...props}>
        {children}
      </ReactMarkdown>
    </BaseStyles>
  );
};
