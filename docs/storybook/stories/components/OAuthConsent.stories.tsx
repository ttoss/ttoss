import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { OAuthConsentProps } from '@ttoss/components';
import { OAuthConsent } from '@ttoss/components';
import { action } from 'storybook/actions';

const defaultLabels: OAuthConsentProps['labels'] = {
  title: 'Authorize access',
  requestedBy: (name) => {
    return (
      <>
        <strong>{name}</strong> is requesting access to your account.
      </>
    );
  },
  permissionsHeading: 'Requested permissions',
  approve: 'Authorize',
  deny: 'Deny',
  invalidRequestTitle: 'Invalid request',
  invalidRequestBody:
    'The authorization request is missing required parameters. Please return to the application and try again.',
};

const noop = async (_scopes: string[]) => {
  action('onAuthorize')(_scopes);
  return { ok: true };
};

export default {
  title: 'Components/OAuthConsent',
  component: OAuthConsent,
  parameters: {
    docs: {
      description: {
        component:
          'OAuth consent screen component with support for flat and GitHub-style grouped/hierarchical scopes. ' +
          'All copy is injected via the `labels` prop — zero hardcoded strings inside the component. ' +
          'Granting a parent scope automatically locks all descendant scopes (checked + disabled).',
      },
    },
  },
  tags: ['autodocs'],
} as Meta<OAuthConsentProps>;

// ---------------------------------------------------------------------------
// With client logo
// ---------------------------------------------------------------------------

const PLACEHOLDER_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%234a90e2'/%3E%3Ctext x='50%25' y='55%25' font-family='sans-serif' font-size='26' fill='white' text-anchor='middle' dominant-baseline='middle'%3EC%3C/text%3E%3C/svg%3E";

export const WithClientLogo: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="Claude"
      clientLogoUrl={PLACEHOLDER_LOGO}
      scopes={[
        {
          key: 'read',
          label: 'Read',
          description: 'List ad accounts and campaigns',
          required: true,
        },
        {
          key: 'write',
          label: 'Write',
          description: 'Pause and activate campaigns',
        },
      ]}
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
WithClientLogo.parameters = {
  docs: {
    description: {
      story:
        'When `clientLogoUrl` is provided, the client logo is rendered above the heading. ' +
        'If the image fails to load, the first letter of `clientName` is shown as a fallback.',
    },
  },
};

// ---------------------------------------------------------------------------
// Flat scopes (OCA read/write case)
// ---------------------------------------------------------------------------

export const FlatScopes: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="OneClick Ads"
      scopes={[
        {
          key: 'read',
          label: 'Read',
          description: 'List ad accounts and campaigns',
          required: true,
        },
        {
          key: 'write',
          label: 'Write',
          description: 'Pause and activate campaigns',
        },
      ]}
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
FlatScopes.parameters = {
  docs: {
    description: {
      story:
        'Flat read/write scope layout matching the OneClick Ads consent screen. ' +
        'The `read` scope is marked `required` (always checked, always disabled).',
    },
  },
};

// ---------------------------------------------------------------------------
// GitHub-style grouped / hierarchical scopes
// ---------------------------------------------------------------------------

export const GroupedScopes: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="GitHub App"
      scopes={[
        {
          key: 'repo',
          label: 'repo',
          description: 'Full control of private repositories',
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
            {
              key: 'public_repo',
              label: 'public_repo',
              description: 'Access public repositories',
            },
          ],
        },
        {
          key: 'write:packages',
          label: 'write:packages',
          description: 'Upload packages to GitHub Packages',
          children: [
            {
              key: 'read:packages',
              label: 'read:packages',
              description: 'Download packages from GitHub Packages',
            },
          ],
        },
        {
          key: 'admin:org',
          label: 'admin:org',
          description:
            'Fully control orgs and teams, read and write org projects',
          children: [
            {
              key: 'write:org',
              label: 'write:org',
              description:
                'Read and write org and team membership, read and write org projects',
            },
            {
              key: 'read:org',
              label: 'read:org',
              description: 'Read org and team membership, read org projects',
            },
          ],
        },
      ]}
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
GroupedScopes.parameters = {
  docs: {
    description: {
      story:
        'GitHub-style hierarchical scopes. Checking a parent (`repo`, `write:packages`, `admin:org`) ' +
        'locks all its children as checked + disabled. Children toggle independently when the parent is unchecked.',
    },
  },
};

// ---------------------------------------------------------------------------
// Required baseline scope
// ---------------------------------------------------------------------------

export const RequiredScope: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="My Service"
      scopes={[
        {
          key: 'openid',
          label: 'OpenID Connect',
          description: 'Verify your identity',
          required: true,
        },
        {
          key: 'profile',
          label: 'Profile',
          description: 'Read your public profile information',
        },
        {
          key: 'email',
          label: 'Email',
          description: 'Read your email address',
        },
      ]}
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
RequiredScope.parameters = {
  docs: {
    description: {
      story:
        'The `openid` scope is `required: true` — it is always checked and disabled. ' +
        'Optional scopes can be freely toggled.',
    },
  },
};

// ---------------------------------------------------------------------------
// Invalid request state
// ---------------------------------------------------------------------------

export const InvalidRequest: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="Unknown App"
      scopes={[]}
      isValidRequest={false}
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
InvalidRequest.parameters = {
  docs: {
    description: {
      story:
        'When `isValidRequest` is `false` (missing `client_id`, `code_challenge`, or `redirect_uri`), ' +
        'the consent form is replaced by the invalid-request error state.',
    },
  },
};

// ---------------------------------------------------------------------------
// Loading / isAuthorizing state
// ---------------------------------------------------------------------------

export const AuthorizingState: StoryFn<OAuthConsentProps> = () => {
  return (
    <OAuthConsent
      clientName="Slow Service"
      scopes={[
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
      ]}
      isAuthorizing
      onAuthorize={noop}
      onAuthorized={action('onAuthorized')}
      onDeny={action('onDeny')}
      labels={defaultLabels}
    />
  );
};
AuthorizingState.parameters = {
  docs: {
    description: {
      story:
        'When `isAuthorizing` is `true`, both buttons are disabled and the Authorize button shows a loading indicator.',
    },
  },
};
