import { BaseStyles, FlexProps } from '@ttoss/ui';
import ReactMarkdown, { CoreOptions } from 'react-markdown';

export type MarkdownProps = CoreOptions & {
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
