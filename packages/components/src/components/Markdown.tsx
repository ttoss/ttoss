import { BaseStyles, FlexProps } from '@ttoss/ui';
import ReactMarkdown, { ReactMarkdownOptions } from 'react-markdown';

export type MarkdownProps = ReactMarkdownOptions & {
  children: string;
  sx?: FlexProps['sx'];
};

export const Markdown = ({ children, sx, ...props }: MarkdownProps) => {
  return (
    <BaseStyles sx={sx}>
      <ReactMarkdown {...props}>{children}</ReactMarkdown>
    </BaseStyles>
  );
};
