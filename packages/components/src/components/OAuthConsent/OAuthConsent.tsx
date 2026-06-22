import {
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Flex,
  Heading,
  Label,
  Text,
} from '@ttoss/ui';
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
  ancestorSelected: boolean;
  selected: Set<string>;
  busy: boolean;
  onToggle: (scope: ConsentScope, ancestorSelected: boolean) => void;
};

const getScopeRowState = ({
  scope,
  ancestorSelected,
  selected,
  busy,
}: Omit<ScopeRowProps, 'onToggle'>) => {
  const isChecked = ancestorSelected || selected.has(scope.key);
  const isLocked = !!scope.required || ancestorSelected;

  return {
    isChecked,
    isDisabled: isLocked || busy,
    isInteractive: !isLocked && !busy,
  };
};

const ScopeRow = ({
  scope,
  ancestorSelected,
  selected,
  busy,
  onToggle,
}: ScopeRowProps) => {
  const { isChecked, isDisabled, isInteractive } = getScopeRowState({
    scope,
    ancestorSelected,
    selected,
    busy,
  });
  const checkboxId = `consent-scope-${scope.key}`;
  const descId = `consent-scope-desc-${scope.key}`;

  return (
    <Box as="li" sx={{ listStyle: 'none' }}>
      <Flex
        sx={{
          gap: 3,
          alignItems: 'flex-start',
          paddingX: 3,
          paddingY: 3,
          borderRadius: 'md',
          opacity: ancestorSelected ? 0.55 : 1,
          transition: 'background-color 0.15s ease',
          ...(isInteractive && {
            '&:hover': {
              backgroundColor: 'display.background.muted.default',
            },
          }),
        }}
      >
        <Box sx={{ paddingTop: '3px', flexShrink: 0 }}>
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Label
            htmlFor={checkboxId}
            sx={{
              fontWeight: 'semibold',
              fontSize: 'md',
              lineHeight: 'short',
              cursor: isInteractive ? 'pointer' : 'default',
              color: 'display.text.primary.default',
              width: 'fit-content',
            }}
          >
            {scope.label}
          </Label>
          <Text
            id={descId}
            sx={{
              fontSize: 'sm',
              lineHeight: 'short',
              color: 'display.text.muted.default',
              display: 'block',
              marginTop: '1',
            }}
          >
            {scope.description}
          </Text>
        </Box>
      </Flex>
      {scope.children?.length ? (
        <Box
          as="ul"
          sx={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            marginLeft: 5,
            paddingLeft: 2,
            borderLeft: 'sm',
            borderColor: 'display.border.muted.default',
          }}
        >
          {scope.children?.map((child) => {
            return (
              <ScopeRow
                key={child.key}
                scope={child}
                ancestorSelected={isChecked}
                selected={selected}
                busy={busy}
                onToggle={onToggle}
              />
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

/** Shared centered card shell for the consent and invalid-request views. */
const ConsentCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <Flex sx={{ justifyContent: 'center', paddingX: 4, paddingY: 6 }}>
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          alignItems: 'stretch',
          padding: 6,
        }}
      >
        {children}
      </Card>
    </Flex>
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
      <ConsentCard>
        <Heading
          as="h1"
          sx={{
            fontSize: '3xl',
            color: 'display.text.primary.default',
            marginBottom: 3,
          }}
        >
          {labels.invalidRequestTitle}
        </Heading>
        <Text
          sx={{
            fontSize: 'md',
            lineHeight: 'moderate',
            color: 'display.text.secondary.default',
          }}
        >
          {labels.invalidRequestBody}
        </Text>
      </ConsentCard>
    );
  }

  return (
    <ConsentCard>
      <Heading
        as="h1"
        sx={{
          fontSize: '3xl',
          lineHeight: 'shorter',
          color: 'display.text.primary.default',
          marginBottom: 2,
        }}
      >
        {labels.title}
      </Heading>

      <Text
        sx={{
          fontSize: 'md',
          lineHeight: 'moderate',
          color: 'display.text.secondary.default',
        }}
      >
        {labels.requestedBy(clientName)}
      </Text>

      <Divider
        sx={{ marginY: 5, borderColor: 'display.border.muted.default' }}
      />

      <Heading
        as="h3"
        sx={{
          fontSize: 'xs',
          fontWeight: 'semibold',
          letterSpacing: 'wider',
          textTransform: 'uppercase',
          color: 'display.text.muted.default',
          marginBottom: 2,
        }}
      >
        {labels.permissionsHeading}
      </Heading>

      <Box as="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {scopes.map((scope) => {
          return (
            <ScopeRow
              key={scope.key}
              scope={scope}
              ancestorSelected={false}
              selected={selected}
              busy={busy}
              onToggle={handleToggle}
            />
          );
        })}
      </Box>

      <Flex sx={{ gap: 3, marginTop: 6 }}>
        <Button
          variant="secondary"
          onClick={onDeny}
          disabled={busy}
          sx={{ flex: 1, justifyContent: 'center' }}
        >
          {labels.deny}
        </Button>
        <Button
          variant="accent"
          onClick={handleApprove}
          disabled={busy}
          loading={isLoading || isAuthorizing}
          sx={{ flex: 1, justifyContent: 'center' }}
        >
          {labels.approve}
        </Button>
      </Flex>
    </ConsentCard>
  );
};
