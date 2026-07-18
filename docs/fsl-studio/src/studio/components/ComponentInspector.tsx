import { Button, Heading, Link, Stack, Text } from '@ttoss/fsl-ui';
import * as React from 'react';

import {
  CONTRACT_URL,
  findEntry,
  legalConsequences,
  legalEvaluations,
} from './catalog';
import { useComponentStore } from './componentStore';
import { findPage } from './examplePages';
import { previewFor } from './previews';

/** A legal-only segmented selector; `undefined` = the component's own default. */
const PropSelector = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value?: string) => void;
}) => {
  return (
    <Stack gap="xs">
      <Text as="span" variant="label-sm" tone="muted">
        {label}
      </Text>
      <div className="component-prop-options" role="group" aria-label={label}>
        <button
          type="button"
          className="component-chip"
          aria-pressed={value === undefined}
          onClick={() => {
            return onChange(undefined);
          }}
        >
          default
        </button>
        {options.map((option) => {
          return (
            <button
              key={option}
              type="button"
              className="component-chip"
              aria-pressed={value === option}
              onClick={() => {
                return onChange(option);
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </Stack>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const copied = copiedText === text;

  return (
    <Button
      evaluation="muted"
      onPress={() => {
        const clipboard = navigator.clipboard;
        if (!clipboard) {
          return;
        }
        const copying = text;
        clipboard.writeText(copying).then(
          () => {
            return setCopiedText(copying);
          },
          () => {
            return setCopiedText(null);
          }
        );
      }}
    >
      {copied ? 'Copied' : 'Copy JSX'}
    </Button>
  );
};

/**
 * Component lens inspector (PRD F3.2/F3.3/F3.4): the legality props panel
 * (only legal values are offered — an illegal combination cannot be
 * expressed), the copy-JSX snippet, the data-part convention, and the
 * per-entity CONTRACT link.
 */
export const ComponentInspector = () => {
  const store = useComponentStore();

  if (store.selection.kind === 'page') {
    const page = findPage(store.selection.id);
    return (
      <Stack gap="md">
        <Stack gap="sm">
          <Heading level={2} size="title-sm">
            Example page
          </Heading>
          <Text variant="label-lg">{page?.label}</Text>
          <Text variant="body-sm" tone="muted">
            {page?.description}
          </Text>
          <Text variant="body-sm" tone="muted">
            Rendered live on the stage and themed by the current theme. Switch
            to the Theme lens to see edits flow through it.
          </Text>
        </Stack>
      </Stack>
    );
  }

  const entry = findEntry(store.selection.key);
  if (!entry) {
    return null;
  }

  const { meta } = entry;
  const evaluations = legalEvaluations(meta.entity);
  const consequences = legalConsequences(meta.entity);
  const preview = previewFor(meta.displayName);
  const code = preview?.code({
    evaluation: store.evaluation,
    consequence: store.consequence,
  });

  return (
    <Stack gap="md">
      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Component
        </Heading>
        <Text variant="label-lg">{meta.displayName}</Text>
        <ul className="component-identity">
          <li>
            <span className="component-identity-key">entity</span> {meta.entity}
          </li>
          <li>
            <span className="component-identity-key">structure</span>{' '}
            {meta.structure}
          </li>
          {meta.composition ? (
            <li>
              <span className="component-identity-key">composition</span>{' '}
              {meta.composition}
            </li>
          ) : null}
          {/* `meta.consequence` is an optional intrinsic field no shipped
              component declares today; authorial consequence surfaces in the
              legal-props panel below. Re-add an identity row here if a future
              component sets it. */}
        </ul>
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Legal props
        </Heading>
        {evaluations.length > 0 ? (
          <PropSelector
            label="evaluation"
            value={store.evaluation}
            options={evaluations}
            onChange={store.setEvaluation}
          />
        ) : (
          <Text variant="body-sm" tone="muted">
            {meta.entity} carries no <code>evaluation</code> — validation is a
            runtime state (<code>isInvalid</code>), never a color prop.
          </Text>
        )}
        {consequences.length > 0 ? (
          <PropSelector
            label="consequence"
            value={store.consequence}
            options={consequences}
            onChange={store.setConsequence}
          />
        ) : null}
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Anatomy
        </Heading>
        <Text variant="body-sm" tone="muted">
          Root: <code>data-scope</code> on the component,{' '}
          <code>data-part=&quot;{meta.structure}&quot;</code> on its root
          element (CONTRACT §5).
        </Text>
        <Link href={CONTRACT_URL} target="_blank" rel="noreferrer">
          Open the {meta.entity} contract →
        </Link>
      </Stack>

      <Stack gap="sm">
        <Heading level={2} size="title-sm">
          Copy
        </Heading>
        {code ? (
          <>
            <pre className="component-code" data-testid="component-code">
              <code>{code}</code>
            </pre>
            <CopyButton text={code} />
            <Text variant="body-sm" tone="muted">
              Flow-critical labels are required props with no English defaults —
              supply localized copy from your app&apos;s i18n.
            </Text>
          </>
        ) : (
          <Text variant="body-sm" tone="muted">
            A verified snippet for {meta.displayName} isn&apos;t in the registry
            yet. Composites like this are shown live in the example pages.
          </Text>
        )}
      </Stack>
    </Stack>
  );
};
