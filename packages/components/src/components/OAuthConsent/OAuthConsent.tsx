import { Box, Button, Checkbox, Flex, Heading, Label, Text } from '@ttoss/ui';
import * as React from 'react';

/**
 * A single OAuth scope, optionally with implied child scopes.
 */
export type ConsentScope = {
  /** OAuth scope token, e.g. 'repo', 'write:packages', 'read'. */
  key: string;
  /** Bold display name shown on the left. Pre-translated by the consumer. */
  label: string;
  /** Scope description shown below the label. Pre-translated by the consumer. */
  description: string;
  /**
   * Child scopes implied by this one. When this scope is granted, every
   * descendant is granted and locked (checked + disabled).
   */
  children?: ConsentScope[];
  /**
   * Pre-checked on mount.
   * @default false
   */
  defaultGranted?: boolean;
  /**
   * Always granted; cannot be unchecked. Renders checked + disabled.
   * @default false
   */
  required?: boolean;
};

/**
 * All visible copy for the consent screen. Pre-translated by the consumer.
 */
export type OAuthConsentLabels = {
  /** Page heading, e.g. "Authorize access". */
  title: string;
  /** Client request line. Receives the client identifier for interpolation. */
  requestedBy: (clientName: string) => React.ReactNode;
  /** Section heading above the scope list, e.g. "Requested permissions". */
  permissionsHeading: string;
  /** Approve button label, e.g. "Authorize". */
  approve: string;
  /** Deny button label, e.g. "Deny". */
  deny: string;
  /** Heading shown when required OAuth params are missing. */
  invalidRequestTitle: string;
  /** Body text shown when required OAuth params are missing. */
  invalidRequestBody: string;
};

/**
 * Props for the OAuthConsent component.
 */
export type OAuthConsentProps = {
  /** Display name or identifier of the requesting OAuth client. */
  clientName: string;
  /** Scope tree to render. */
  scopes: ConsentScope[];
  /**
   * Called when the user approves. Receives the minimal granted scope set
   * (top-most selected keys; implied descendants omitted). Return `{ ok: true }`
   * to signal success; the component then calls `onAuthorized`.
   */
  onAuthorize: (grantedScopes: string[]) => Promise<{ ok: boolean }>;
  /**
   * Called after a successful `onAuthorize`. Use this to redirect to the OAuth
   * server's resumed /authorize URL. The component does not navigate itself.
   */
  onAuthorized: () => void;
  /** Called when the user clicks Deny. Use this to navigate away. */
  onDeny: () => void;
  /**
   * True while the authorize call is in flight (disables both buttons).
   * The component also tracks its own internal loading state.
   */
  isAuthorizing?: boolean;
  /**
   * When false, renders the invalid-request error state instead of the form.
   * @default true
   */
  isValidRequest?: boolean;
  /** All visible copy. Pre-translated by the consumer. */
  labels: OAuthConsentLabels;
};

/**
 * Walk the scope tree and return the minimal set of granted scope keys.
 * When a node is selected, its key is emitted and its subtree is skipped
 * (the server expands parent scopes to their children). Nodes not in
 * `selected` are recursed into so that individually-selected children
 * are still captured.
 */
export const collectGrantedScopes = (
  scopes: ConsentScope[],
  selected: Set<string>
): string[] => {
  const result: string[] = [];

  const walk = (nodes: ConsentScope[]) => {
    for (const node of nodes) {
      if (selected.has(node.key)) {
        result.push(node.key);
      } else if (node.children) {
        walk(node.children);
      }
    }
  };

  walk(scopes);
  return result;
};

const initSelected = (scopes: ConsentScope[]): Set<string> => {
  const selected = new Set<string>();

  const walk = (nodes: ConsentScope[]) => {
    for (const node of nodes) {
      if (node.required || node.defaultGranted) {
        selected.add(node.key);
      }
      if (node.children) {
        walk(node.children);
      }
    }
  };

  walk(scopes);
  return selected;
};

type ScopeRowProps = {
  scope: ConsentScope;
  depth: number;
  ancestorSelected: boolean;
  selected: Set<string>;
  busy: boolean;
  onToggle: (scope: ConsentScope, ancestorSelected: boolean) => void;
};

const ScopeRow = ({
  scope,
  depth,
  ancestorSelected,
  selected,
  busy,
  onToggle,
}: ScopeRowProps) => {
  const isChecked = ancestorSelected || selected.has(scope.key);
  const isDisabled = scope.required === true || ancestorSelected || busy;
  const checkboxId = `consent-scope-${scope.key}`;
  const descId = `consent-scope-desc-${scope.key}`;

  return (
    <>
      <Flex
        sx={{
          pl: depth * 5,
          py: 2,
          alignItems: 'flex-start',
          gap: 3,
          opacity: ancestorSelected ? 0.6 : 1,
        }}
      >
        <Box sx={{ pt: '2px', flexShrink: 0 }}>
          <Checkbox
            id={checkboxId}
            checked={isChecked}
            disabled={isDisabled}
            aria-describedby={descId}
            onChange={() => {
              onToggle(scope, ancestorSelected);
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Label
            htmlFor={checkboxId}
            sx={{
              fontWeight: 'bold',
              cursor: isDisabled ? 'default' : 'pointer',
              color: 'display.text.primary.default',
              fontSize: 'inherit',
              display: 'block',
            }}
          >
            {scope.label}
          </Label>
          <Text
            id={descId}
            sx={{
              fontSize: 1,
              color: 'display.text.muted.default',
              display: 'block',
            }}
          >
            {scope.description}
          </Text>
        </Box>
      </Flex>
      {scope.children?.map((child) => {
        return (
          <ScopeRow
            key={child.key}
            scope={child}
            depth={depth + 1}
            ancestorSelected={isChecked}
            selected={selected}
            busy={busy}
            onToggle={onToggle}
          />
        );
      })}
    </>
  );
};

/**
 * Accessible, framework-agnostic OAuth consent screen component.
 *
 * Renders a standards-compliant "authorize this client" page with support for
 * flat and GitHub-style grouped/hierarchical scopes. Granting a parent scope
 * automatically locks all descendant scopes (checked + disabled). All visible
 * copy is injected via `labels`; no strings are hardcoded inside this component.
 *
 * @example
 * ```tsx
 * <OAuthConsent
 *   clientName="My App"
 *   scopes={[
 *     { key: 'read', label: 'Read', description: 'Read access', required: true },
 *     { key: 'write', label: 'Write', description: 'Write access' },
 *   ]}
 *   onAuthorize={async (scopes) => {
 *     const res = await authorize({ variables: { scopes } });
 *     return { ok: !!res.ok };
 *   }}
 *   onAuthorized={() => { window.location.href = resumeUrl; }}
 *   onDeny={() => navigate('/')}
 *   labels={labels}
 * />
 * ```
 */
export const OAuthConsent = ({
  clientName,
  scopes,
  onAuthorize,
  onAuthorized,
  onDeny,
  isAuthorizing = false,
  isValidRequest = true,
  labels,
}: OAuthConsentProps) => {
  const [selected, setSelected] = React.useState<Set<string>>(() => {
    return initSelected(scopes);
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const busy = isAuthorizing || isLoading;

  const handleToggle = React.useCallback(
    (scope: ConsentScope, ancestorSelected: boolean) => {
      if (scope.required || ancestorSelected) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(scope.key)) {
          next.delete(scope.key);
        } else {
          next.add(scope.key);
        }
        return next;
      });
    },
    []
  );

  const handleApprove = React.useCallback(async () => {
    const grantedScopes = collectGrantedScopes(scopes, selected);
    setIsLoading(true);
    try {
      const result = await onAuthorize(grantedScopes);
      if (result.ok) {
        onAuthorized();
      }
    } finally {
      setIsLoading(false);
    }
  }, [scopes, selected, onAuthorize, onAuthorized]);

  if (!isValidRequest) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6, p: 4 }}>
        <Heading as="h1" sx={{ mb: 3, color: 'display.text.primary.default' }}>
          {labels.invalidRequestTitle}
        </Heading>
        <Text sx={{ color: 'display.text.secondary.default' }}>
          {labels.invalidRequestBody}
        </Text>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6, p: 4 }}>
      <Heading as="h1" sx={{ mb: 2, color: 'display.text.primary.default' }}>
        {labels.title}
      </Heading>

      <Text sx={{ mb: 4, color: 'display.text.secondary.default' }}>
        {labels.requestedBy(clientName)}
      </Text>

      <Heading as="h3" sx={{ mb: 3, color: 'display.text.primary.default' }}>
        {labels.permissionsHeading}
      </Heading>

      <Box
        sx={{
          mb: 4,
          border: 'sm',
          borderColor: 'display.border.muted.default',
          borderRadius: 'md',
          px: 3,
          py: 1,
        }}
      >
        {scopes.map((scope) => {
          return (
            <ScopeRow
              key={scope.key}
              scope={scope}
              depth={0}
              ancestorSelected={false}
              selected={selected}
              busy={busy}
              onToggle={handleToggle}
            />
          );
        })}
      </Box>

      <Flex sx={{ gap: 3 }}>
        <Button
          onClick={handleApprove}
          disabled={busy}
          loading={isLoading || isAuthorizing}
          sx={{ flex: 1 }}
        >
          {labels.approve}
        </Button>
        <Button
          variant="secondary"
          onClick={onDeny}
          disabled={busy}
          sx={{ flex: 1 }}
        >
          {labels.deny}
        </Button>
      </Flex>
    </Box>
  );
};
