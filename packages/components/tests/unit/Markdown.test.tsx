import { Markdown } from '../../src';
import { render, screen } from '@ttoss/test-utils';

const HEADING_1 = 'HEADING_1';
const HEADING_2 = 'HEADING_2';
const HEADING_3 = 'HEADING_3';

const UNDERLINE_TEXT = 'Underline Text';
const BOLD_TEXT = 'Bold Text';
const ITALIC_TEXT = 'Italic Text';
const STRIKETHROUGH_TEXT = 'Strikethrough Text';

const LINK_HREF = 'https://ttoss.dev';

const TABLE = {
  columns: ['Column 1', 'Column 2'],
  rows: [
    { col1: 'value 1', col2: 'value 2' },
    { col1: 'value 3', col2: 'value 4' },
  ],
};

const MARKDOWN_CONTENT = `
# ${HEADING_1}
## ${HEADING_2}
## ${HEADING_3}

| ${TABLE.columns[0]}   | ${TABLE.columns[1]}   |
| --------------------: | :-------------------  |
| ${TABLE.rows[0].col1} | ${TABLE.rows[0].col2} |
| ${TABLE.rows[1].col1} | ${TABLE.rows[1].col2} |

- ListItem1
- ListItem2
- ListItem3

[Ttoss](${LINK_HREF})

<u>${UNDERLINE_TEXT}</u>
**${BOLD_TEXT}**
_${ITALIC_TEXT}_
~~${STRIKETHROUGH_TEXT}~~
`;

test('markdown should render html tags instead markdown tags', () => {
  render(<Markdown>{MARKDOWN_CONTENT}</Markdown>);

  const [heading1, heading2, heading3] = screen.getAllByRole('heading');
  const [listItem1, listItem2, listItem3] = screen.getAllByRole('listitem');
  const anchor = screen.getByRole('link');

  expect(heading1).toHaveTextContent(HEADING_1);
  expect(heading2).toHaveTextContent(HEADING_2);
  expect(heading3).toHaveTextContent(HEADING_3);

  expect(listItem1).toHaveTextContent('ListItem1');
  expect(listItem2).toHaveTextContent('ListItem2');
  expect(listItem3).toHaveTextContent('ListItem3');

  expect(anchor).toHaveTextContent('Ttoss');
  expect(anchor).toHaveAttribute('href', LINK_HREF);

  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();

  TABLE.columns.forEach((columnValue) => {
    const column = screen.getByText(columnValue);
    expect(column.tagName.toLowerCase()).toEqual('th');
  });

  TABLE.rows.forEach((rowValue) => {
    const column1 = screen.getByText(rowValue.col1);
    const column2 = screen.getByText(rowValue.col2);
    expect(column1.tagName.toLowerCase()).toEqual('td');
    expect(column2.tagName.toLowerCase()).toEqual('td');
  });

  const underlineText = screen.getByText(UNDERLINE_TEXT);
  expect(underlineText).toBeInTheDocument();
  expect(underlineText.tagName.toLowerCase()).toEqual('u');

  const boldText = screen.getByText(BOLD_TEXT);
  expect(boldText).toBeInTheDocument();
  expect(boldText.tagName.toLowerCase()).toEqual('strong');

  const italicText = screen.getByText(ITALIC_TEXT);
  expect(italicText).toBeInTheDocument();
  expect(italicText.tagName.toLowerCase()).toEqual('em');

  const strikethroughText = screen.getByText(STRIKETHROUGH_TEXT);
  expect(strikethroughText).toBeInTheDocument();
  expect(strikethroughText.tagName.toLowerCase()).toEqual('del');
});
