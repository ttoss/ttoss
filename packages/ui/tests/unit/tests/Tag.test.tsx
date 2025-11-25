import { render, screen } from '@ttoss/test-utils/react';

import { Tag } from '../../../src';

describe('Tag', () => {
  test('should render Tag with text', () => {
    render(<Tag>Tag content</Tag>);
    expect(screen.getByText('Tag content')).toBeInTheDocument();
  });

  test('should render Tag with custom variant', () => {
    render(<Tag variant="positive">Positive Tag</Tag>);
    expect(screen.getByText('Positive Tag')).toBeInTheDocument();
  });

  test('should apply custom styles', () => {
    render(<Tag sx={{ backgroundColor: 'red' }}>Styled Tag</Tag>);
    expect(screen.getByText('Styled Tag')).toBeInTheDocument();
  });

  test('should render multiple children as tags', () => {
    render(
      <Tag>
        <span>One</span>
        <span>Two</span>
      </Tag>
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
