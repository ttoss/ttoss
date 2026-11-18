/**
 * A selection replaced whole — the other side of a split map — is read again
 * by the controls that hold a value locally, instead of being written over.
 */

import { act, render, screen } from '@ttoss/test-utils/react';
import * as React from 'react';
import { useSettingValue } from 'src/components/LeftSidebar/useSettingValue';
import { GeovisWorkspaceProvider } from 'src/GeovisWorkspaceProvider';
import { useGeovisWorkspace } from 'src/hooks/useGeovisWorkspace';

import { Provider } from './geovisWorkspaceTestUtils';

type Replace = (next: Record<string, string>) => void;

const Probe = ({ onReplace }: { onReplace: (replace: Replace) => void }) => {
  const { selection, replaceSelection } = useGeovisWorkspace();
  const [opacity] = useSettingValue({ menuId: 'opacity', defaultValue: '85' });
  React.useEffect(() => {
    onReplace(replaceSelection);
  });
  return (
    <output>
      {opacity}|{selection.opacity}|{selection.variation}
    </output>
  );
};

test('an uncontrolled workspace takes the replaced selection, and a missing setting its default', () => {
  const onSelectionChange = jest.fn();
  let replace: Replace = () => {};
  render(
    <GeovisWorkspaceProvider config={{}} onSelectionChange={onSelectionChange}>
      <Probe
        onReplace={(next) => {
          replace = next;
        }}
      />
    </GeovisWorkspaceProvider>,
    { wrapper: Provider }
  );
  expect(screen.getByRole('status').textContent).toBe('85|85|');

  act(() => {
    replace({ opacity: '40', variation: 'b' });
  });
  expect(screen.getByRole('status').textContent).toBe('40|40|b');
  expect(onSelectionChange).toHaveBeenCalledWith({
    opacity: '40',
    variation: 'b',
  });

  act(() => {
    replace({ variation: 'c' });
  });
  // The new selection has no opacity: the setting falls back to its default.
  expect(screen.getByRole('status').textContent).toBe('85|85|c');
});
