import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { Markdown } from '@ttoss/components/Markdown';
import { Box, Heading, Link } from '@ttoss/ui';

export default {
  title: 'Components/Markdown',
  component: Markdown,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Markdown renderer with theme integration. Supports GFM (GitHub Flavored Markdown) including tables, strikethrough, and task lists. Custom component overrides allow full styling control.',
      },
    },
  },
} as Meta;

const Template: StoryFn<typeof Markdown> = (args) => {
  return <Markdown {...args} />;
};

/**
 * Markdown rendering with custom component styling.
 * Demonstrates headings, tables, lists, images, links, and text formatting.
 * The `components` prop allows overriding default element rendering with custom components.
 */
export const Example = Template.bind({});

const INITIAL_MARKDOWN = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5

| Feature          | Support              |
| ---------:       | :------------------- |
| Aligned to right | Aligned to left      |
| GFM              | 100% w/ "remark-gfm" |

Lorem ipsum dolor sit, amet consectetur adipisicing elit. Odit quasi dolorum aperiam fugiat earum expedita non eligendi similique id minus explicabo, eum facere nihil aspernatur libero! Sapiente aliquid tenetur dolor.

- Item 1
- Item 2
- Item 3

![Alt text](https://fastly.picsum.photos/id/436/200/300.jpg?hmac=OuJRsPTZRaNZhIyVFbzDkMYMyORVpV86q5M8igEfM3Y "Alt Text")

[Google](https://google.com)

<u style="color:grey">Underline text</u>
**Bold Text**
_Italic Text_
~~Strikethrough Text~~
`;

Example.args = {
  children: INITIAL_MARKDOWN,
  components: {
    thead: (props) => {
      return (
        <Box
          as="thead"
          sx={{ backgroundColor: 'primary', color: 'onPrimary' }}
          {...props}
        />
      );
    },
    h1: (props) => {
      return <Heading as="h1" variant="h1" {...props} />;
    },
    h2: (props) => {
      return <Heading as="h2" variant="h2" {...props} />;
    },
    a: ({ children, ...props }) => {
      return (
        <Link {...props} quiet>
          {children}
        </Link>
      );
    },
  },
};
