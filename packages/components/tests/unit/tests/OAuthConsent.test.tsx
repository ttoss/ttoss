import { render, screen, userEvent } from '@ttoss/test-utils/react';

import type {
  ConsentScope,
  OAuthConsentProps,
} from '../../../src/components/OAuthConsent';
import {
  collectGrantedScopes,
  OAuthConsent,
} from '../../../src/components/OAuthConsent';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const flatScopes: ConsentScope[] = [
  {
    key: 'read',
    label: 'Read',
    description: 'Read access',
    required: true,
  },
  {
    key: 'write',
    label: 'Write',
    description: 'Write access',
  },
];

const groupedScopes: ConsentScope[] = [
  {
    key: 'repo',
    label: 'repo',
    description: 'Full control of repositories',
    children: [
      {
        key: 'repo:status',
        label: 'repo:status',
        description: 'Access commit status',
      },
      {
        key: 'repo:deployment',
        label: 'repo:deployment',
        description: 'Access deployment status',
      },
    ],
  },
  {
    key: 'write:packages',
    label: 'write:packages',
    description: 'Upload packages',
    children: [
      {
        key: 'read:packages',
        label: 'read:packages',
        description: 'Download packages',
      },
    ],
  },
  {
    key: 'admin:org',
    label: 'admin:org',
    description: 'Full control of orgs',
    children: [
      {
        key: 'write:org',
        label: 'write:org',
        description: 'Read and write org',
      },
      {
        key: 'read:org',
        label: 'read:org',
        description: 'Read org',
      },
    ],
  },
];

const defaultLabels: OAuthConsentProps['labels'] = {
  title: 'Authorize access',
  requestedBy: (name) => {
    return `${name} is requesting access`;
  },
  permissionsHeading: 'Requested permissions',
  approve: 'Authorize',
  deny: 'Deny',
  invalidRequestTitle: 'Invalid request',
  invalidRequestBody:
    'The authorization request is missing required parameters.',
};

const makeProps = (
  overrides: Partial<OAuthConsentProps> = {}
): OAuthConsentProps => {
  return {
    clientName: 'TestApp',
    scopes: flatScopes,
    onAuthorize: jest.fn().mockResolvedValue({ ok: true }),
    onAuthorized: jest.fn(),
    onDeny: jest.fn(),
    labels: defaultLabels,
    ...overrides,
  };
};

// ---------------------------------------------------------------------------
// collectGrantedScopes unit tests (§7 table)
// ---------------------------------------------------------------------------

describe('collectGrantedScopes', () => {
  test('repo checked (children auto-locked) → [repo]', () => {
    const selected = new Set(['repo', 'repo:status', 'repo:deployment']);
    expect(collectGrantedScopes(groupedScopes, selected)).toEqual(['repo']);
  });

  test('only repo:status checked, repo off → [repo:status]', () => {
    const selected = new Set(['repo:status']);
    expect(collectGrantedScopes(groupedScopes, selected)).toEqual([
      'repo:status',
    ]);
  });

  test('write:packages checked → read:packages locked → [write:packages]', () => {
    const selected = new Set(['write:packages', 'read:packages']);
    expect(collectGrantedScopes(groupedScopes, selected)).toEqual([
      'write:packages',
    ]);
  });

  test('only read:packages checked → [read:packages]', () => {
    const selected = new Set(['read:packages']);
    expect(collectGrantedScopes(groupedScopes, selected)).toEqual([
      'read:packages',
    ]);
  });

  test('admin:org off, read:org + write:org checked → [write:org, read:org]', () => {
    const selected = new Set(['write:org', 'read:org']);
    const result = collectGrantedScopes(groupedScopes, selected);
    expect(result).toContain('write:org');
    expect(result).toContain('read:org');
    expect(result).not.toContain('admin:org');
    expect(result).toHaveLength(2);
  });

  test('required read + optional write checked → [read, write]', () => {
    const selected = new Set(['read', 'write']);
    expect(collectGrantedScopes(flatScopes, selected)).toEqual([
      'read',
      'write',
    ]);
  });

  test('empty selected set → []', () => {
    expect(collectGrantedScopes(flatScopes, new Set())).toEqual([]);
  });

  test('only required read checked → [read]', () => {
    const selected = new Set(['read']);
    expect(collectGrantedScopes(flatScopes, selected)).toEqual(['read']);
  });
});

// ---------------------------------------------------------------------------
// OAuthConsent rendering
// ---------------------------------------------------------------------------

describe('OAuthConsent', () => {
  test('renders title, request line, permissions heading, and buttons', () => {
    render(<OAuthConsent {...makeProps()} />);

    expect(
      screen.getByRole('heading', { name: 'Authorize access', level: 1 })
    ).toBeInTheDocument();
    expect(
      screen.getByText('TestApp is requesting access')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Requested permissions', level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Authorize' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeInTheDocument();
  });

  test('renders scope labels and descriptions', () => {
    render(<OAuthConsent {...makeProps()} />);

    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('Read access')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Write access')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // required scopes
  // ---------------------------------------------------------------------------

  test('required scope is checked and disabled', () => {
    render(<OAuthConsent {...makeProps()} />);
    const readCheckbox = screen.getByRole('checkbox', { name: 'Read' });
    expect(readCheckbox).toBeChecked();
    expect(readCheckbox).toBeDisabled();
  });

  test('required scope remains checked after click attempt', async () => {
    const user = userEvent.setup();
    render(<OAuthConsent {...makeProps()} />);
    const readCheckbox = screen.getByRole('checkbox', { name: 'Read' });
    await user.click(readCheckbox);
    expect(readCheckbox).toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // optional flat scope toggle
  // ---------------------------------------------------------------------------

  test('optional scope starts unchecked and can be toggled on', async () => {
    const user = userEvent.setup();
    render(<OAuthConsent {...makeProps()} />);
    const writeCheckbox = screen.getByRole('checkbox', { name: 'Write' });
    expect(writeCheckbox).not.toBeChecked();
    await user.click(writeCheckbox);
    expect(writeCheckbox).toBeChecked();
  });

  test('checked optional scope can be toggled off', async () => {
    const user = userEvent.setup();
    render(
      <OAuthConsent
        {...makeProps({
          scopes: [
            {
              key: 'write',
              label: 'Write',
              description: 'Write',
              defaultGranted: true,
            },
          ],
        })}
      />
    );
    const writeCheckbox = screen.getByRole('checkbox', { name: 'Write' });
    expect(writeCheckbox).toBeChecked();
    await user.click(writeCheckbox);
    expect(writeCheckbox).not.toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // Hierarchical / grouped scope behavior
  // ---------------------------------------------------------------------------

  test('checking a parent locks and checks all descendants', async () => {
    const user = userEvent.setup();
    render(<OAuthConsent {...makeProps({ scopes: groupedScopes })} />);

    const repoCheckbox = screen.getByRole('checkbox', { name: 'repo' });
    expect(repoCheckbox).not.toBeChecked();

    await user.click(repoCheckbox);

    expect(screen.getByRole('checkbox', { name: 'repo' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'repo:status' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'repo:status' })
    ).toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'repo:deployment' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'repo:deployment' })
    ).toBeDisabled();
  });

  test('unchecking parent releases descendants to independent state', async () => {
    const user = userEvent.setup();
    render(<OAuthConsent {...makeProps({ scopes: groupedScopes })} />);

    const repoCheckbox = screen.getByRole('checkbox', { name: 'repo' });
    await user.click(repoCheckbox); // check parent
    await user.click(repoCheckbox); // uncheck parent

    expect(screen.getByRole('checkbox', { name: 'repo' })).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'repo:status' })
    ).not.toBeDisabled();
    expect(
      screen.getByRole('checkbox', { name: 'repo:deployment' })
    ).not.toBeDisabled();
  });

  test('children can be toggled independently when parent is unchecked', async () => {
    const user = userEvent.setup();
    render(<OAuthConsent {...makeProps({ scopes: groupedScopes })} />);

    const statusCheckbox = screen.getByRole('checkbox', {
      name: 'repo:status',
    });
    expect(statusCheckbox).not.toBeChecked();
    await user.click(statusCheckbox);
    expect(statusCheckbox).toBeChecked();

    // sibling stays unchecked
    expect(
      screen.getByRole('checkbox', { name: 'repo:deployment' })
    ).not.toBeChecked();
  });

  // ---------------------------------------------------------------------------
  // onAuthorize / onAuthorized / onDeny callbacks
  // ---------------------------------------------------------------------------

  test('onAuthorize receives minimal scope set on Authorize click', async () => {
    const user = userEvent.setup();
    const onAuthorize = jest.fn().mockResolvedValue({ ok: true });
    const onAuthorized = jest.fn();

    render(<OAuthConsent {...makeProps({ onAuthorize, onAuthorized })} />);
    await user.click(screen.getByRole('button', { name: 'Authorize' }));

    expect(onAuthorize).toHaveBeenCalledWith(['read']);
    expect(onAuthorized).toHaveBeenCalled();
  });

  test('onAuthorize receives write scope when write is also checked', async () => {
    const user = userEvent.setup();
    const onAuthorize = jest.fn().mockResolvedValue({ ok: true });
    render(<OAuthConsent {...makeProps({ onAuthorize })} />);

    await user.click(screen.getByRole('checkbox', { name: 'Write' }));
    await user.click(screen.getByRole('button', { name: 'Authorize' }));

    expect(onAuthorize).toHaveBeenCalledWith(
      expect.arrayContaining(['read', 'write'])
    );
    expect(onAuthorize).toHaveBeenCalledWith(
      expect.not.arrayContaining(['extra'])
    );
  });

  test('onAuthorized is NOT called when onAuthorize returns { ok: false }', async () => {
    const user = userEvent.setup();
    const onAuthorize = jest.fn().mockResolvedValue({ ok: false });
    const onAuthorized = jest.fn();

    render(<OAuthConsent {...makeProps({ onAuthorize, onAuthorized })} />);
    await user.click(screen.getByRole('button', { name: 'Authorize' }));

    expect(onAuthorized).not.toHaveBeenCalled();
  });

  test('onDeny is called when Deny is clicked', async () => {
    const user = userEvent.setup();
    const onDeny = jest.fn();

    render(<OAuthConsent {...makeProps({ onDeny })} />);
    await user.click(screen.getByRole('button', { name: 'Deny' }));

    expect(onDeny).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // isAuthorizing prop
  // ---------------------------------------------------------------------------

  test('buttons are disabled when isAuthorizing is true', () => {
    render(<OAuthConsent {...makeProps({ isAuthorizing: true })} />);
    expect(screen.getByRole('button', { name: /Authorize/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // isValidRequest={false}
  // ---------------------------------------------------------------------------

  test('renders invalid-request state when isValidRequest is false', () => {
    render(<OAuthConsent {...makeProps({ isValidRequest: false })} />);
    expect(screen.getByText('Invalid request')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The authorization request is missing required parameters.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Authorize' })
    ).not.toBeInTheDocument();
  });

  test('renders consent form when isValidRequest is true (default)', () => {
    render(<OAuthConsent {...makeProps({ isValidRequest: true })} />);
    expect(
      screen.getByRole('button', { name: 'Authorize' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Invalid request')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Hierarchical onAuthorize minimal set
  // ---------------------------------------------------------------------------

  test('onAuthorize receives [repo] when repo is checked (children implied)', async () => {
    const user = userEvent.setup();
    const onAuthorize = jest.fn().mockResolvedValue({ ok: true });
    render(
      <OAuthConsent {...makeProps({ scopes: groupedScopes, onAuthorize })} />
    );

    await user.click(screen.getByRole('checkbox', { name: 'repo' }));
    await user.click(screen.getByRole('button', { name: 'Authorize' }));

    expect(onAuthorize).toHaveBeenCalledWith(['repo']);
  });

  test('onAuthorize receives [read:org, write:org] when children checked and parent unchecked', async () => {
    const user = userEvent.setup();
    const onAuthorize = jest.fn().mockResolvedValue({ ok: true });
    render(
      <OAuthConsent {...makeProps({ scopes: groupedScopes, onAuthorize })} />
    );

    await user.click(screen.getByRole('checkbox', { name: 'read:org' }));
    await user.click(screen.getByRole('checkbox', { name: 'write:org' }));
    await user.click(screen.getByRole('button', { name: 'Authorize' }));

    const called = onAuthorize.mock.calls[0][0] as string[];
    expect(called).toContain('read:org');
    expect(called).toContain('write:org');
    expect(called).not.toContain('admin:org');
  });
});
