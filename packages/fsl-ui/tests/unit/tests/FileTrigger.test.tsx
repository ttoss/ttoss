/**
 * FileTrigger — Action-entity file-picker trigger over RAC `FileTrigger`.
 *
 * Verifies identity (the reused Button root), that the hidden file input
 * carries the configured attributes, and that onSelect fires on selection.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { FileTrigger } from 'src/index';

describe('FileTrigger', () => {
  test('renders the Action trigger identity', () => {
    render(<FileTrigger>Upload avatar</FileTrigger>);
    const root = document.querySelector(
      '[data-scope="file-trigger"][data-part="root"]'
    );
    expect(root).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Upload avatar' })).toBe(root);
    expect(root).toHaveAttribute('data-evaluation', 'primary');
  });

  test('configures the hidden file input', () => {
    render(
      <FileTrigger acceptedFileTypes={['image/*']} allowsMultiple>
        Upload
      </FileTrigger>
    );
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('multiple');
  });

  test('fires onSelect when a file is chosen', () => {
    const onSelect = jest.fn();
    render(<FileTrigger onSelect={onSelect}>Upload</FileTrigger>);
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['data'], 'report.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('reflects a custom evaluation on the trigger', () => {
    render(<FileTrigger evaluation="negative">Delete uploads</FileTrigger>);
    expect(
      document.querySelector('[data-scope="file-trigger"][data-part="root"]')
    ).toHaveAttribute('data-evaluation', 'negative');
  });
});
