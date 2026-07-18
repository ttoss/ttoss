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
    <div className="component-prop">
      <span className="component-prop-label">{label}</span>
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
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);
  const copied = copiedText === text;

  return (
    <button
      type="button"
      className="component-copy"
      onClick={() => {
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
    </button>
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
      <div className="component-inspector">
        <section className="theme-section">
          <h2 className="theme-section-title">Example page</h2>
          <p className="component-name">{page?.label}</p>
          <p className="theme-hint">{page?.description}</p>
          <p className="theme-hint">
            Rendered live on the stage and themed by the current theme. Switch
            to the Theme lens to see edits flow through it.
          </p>
        </section>
      </div>
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
    <div className="component-inspector">
      <section className="theme-section">
        <h2 className="theme-section-title">Component</h2>
        <p className="component-name">{meta.displayName}</p>
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
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Legal props</h2>
        {evaluations.length > 0 ? (
          <PropSelector
            label="evaluation"
            value={store.evaluation}
            options={evaluations}
            onChange={store.setEvaluation}
          />
        ) : (
          <p className="theme-hint">
            {meta.entity} carries no <code>evaluation</code> — validation is a
            runtime state (<code>isInvalid</code>), never a color prop.
          </p>
        )}
        {consequences.length > 0 ? (
          <PropSelector
            label="consequence"
            value={store.consequence}
            options={consequences}
            onChange={store.setConsequence}
          />
        ) : null}
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Anatomy</h2>
        <p className="theme-hint">
          Root: <code>data-scope</code> on the component,{' '}
          <code>data-part=&quot;{meta.structure}&quot;</code> on its root
          element (CONTRACT §5).
        </p>
        <a
          className="component-contract-link"
          href={CONTRACT_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open the {meta.entity} contract →
        </a>
      </section>

      <section className="theme-section">
        <h2 className="theme-section-title">Copy</h2>
        {code ? (
          <>
            <pre className="component-code" data-testid="component-code">
              <code>{code}</code>
            </pre>
            <CopyButton text={code} />
            <p className="theme-hint">
              Flow-critical labels are required props with no English defaults —
              supply localized copy from your app&apos;s i18n.
            </p>
          </>
        ) : (
          <p className="theme-hint">
            A verified snippet for {meta.displayName} isn&apos;t in the registry
            yet. Composites like this are shown live in the example pages.
          </p>
        )}
      </section>
    </div>
  );
};
