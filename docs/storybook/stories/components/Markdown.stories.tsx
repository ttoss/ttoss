import { Heading, Link } from '@ttoss/ui/src';
import { Markdown } from '@ttoss/components/src';
import { Meta, StoryFn } from '@storybook/react';

export default {
  title: 'Components/Markdown',
} as Meta;

const Template: StoryFn<typeof Markdown> = (args) => {
  return <Markdown {...args} />;
};

export const Example = Template.bind({});

const INITIAL_MARKDOWN = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5

Lorem ipsum dolor sit, amet consectetur adipisicing elit. Odit quasi dolorum aperiam fugiat earum expedita non eligendi similique id minus explicabo, eum facere nihil aspernatur libero! Sapiente aliquid tenetur dolor.

- Item 1
- Item 2
- Item 3

![Alt text](https://fastly.picsum.photos/id/436/200/300.jpg?hmac=OuJRsPTZRaNZhIyVFbzDkMYMyORVpV86q5M8igEfM3Y "Alt Text")

[Google](https://google.com)
`;

Example.args = {
  children: INITIAL_MARKDOWN,
  components: {
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
