import type { GeoVisIssue, RepairOption } from '@ttoss/geovis';
import { useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Text } from '@ttoss/ui';

import { getWarningMessage, warningMessages } from '../warningMessages';
import { type IssueSeverity } from '../warnings';

/** One rendered repair button: its label and the `RepairOption` to apply when pressed. */
interface RepairButtonSpec {
  key: string;
  label: string;
  apply: RepairOption;
}

/**
 * Flattens `issue.repair` into one button per candidate: `allowed-values`
 * expands to one button per value (each applying as a `set-value` for that
 * one chosen value, since `onRepair` always receives a single value to set);
 * `set-value` is already a single button.
 */
const buildRepairButtonSpecs = (
  repair: RepairOption[] | undefined
): RepairButtonSpec[] => {
  if (!repair) return [];

  return repair.flatMap((option, optionIndex) => {
    if (option.kind === 'allowed-values') {
      return option.values.map((value) => {
        return {
          key: `${optionIndex}-${value}`,
          label: String(value),
          apply: { kind: 'set-value' as const, path: option.path, value },
        };
      });
    }

    return [
      {
        key: `${optionIndex}`,
        label: option.label ?? String(option.value),
        apply: option,
      },
    ];
  });
};

/** Monospace reference to the issue's location in the spec. */
const IssueSubject = ({ subject }: { subject: GeoVisIssue['subject'] }) => {
  return (
    <Text
      as="code"
      sx={{
        fontFamily: 'monospace',
        fontSize: 'xs',
        color: 'display.text.secondary.default',
      }}
    >
      {subject.path}
      {subject.id ? ` (${subject.id})` : ''}
    </Text>
  );
};

/**
 * One issue: code-keyed i18n text (falling back to the raw message), the
 * subject reference, and repair buttons. Buttons render even when `onRepair`
 * is omitted — disabled rather than hidden, since visibility (not
 * action-wiring) is what "no dead-end" requires (ADR-0003).
 */
const IssueItem = ({
  issue,
  severity,
  onRepair,
}: {
  issue: GeoVisIssue;
  severity: IssueSeverity;
  onRepair?: (repair: RepairOption) => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const catalogMessage = getWarningMessage(issue.code);
  const text = catalogMessage
    ? formatMessage(catalogMessage)
    : formatMessage(warningMessages.fallback, { message: issue.message });

  const repairButtons = buildRepairButtonSpecs(issue.repair);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1',
        paddingLeft: '3',
        borderLeft: '3px solid',
        borderColor:
          severity === 'error'
            ? 'feedback.border.negative.default'
            : 'feedback.border.caution.default',
      }}
    >
      <Text
        sx={{
          fontSize: 'sm',
          color:
            severity === 'error'
              ? 'feedback.text.negative.default'
              : 'feedback.text.caution.default',
        }}
      >
        {text}
      </Text>

      <IssueSubject subject={issue.subject} />

      {repairButtons.length > 0 && (
        <Flex sx={{ gap: '2', flexWrap: 'wrap', marginTop: '1' }}>
          {repairButtons.map((button) => {
            return (
              <Button
                key={button.key}
                type="button"
                disabled={!onRepair}
                onClick={() => {
                  onRepair?.(button.apply);
                }}
                sx={{ fontSize: 'xs', paddingX: '2', paddingY: '1' }}
              >
                {button.label}
              </Button>
            );
          })}
        </Flex>
      )}
    </Box>
  );
};

export interface IssueListProps {
  /** Issues to render, in order. */
  issues: GeoVisIssue[];
  /** Applied to every issue in the list — a result is never a mix of severities. */
  severity: IssueSeverity;
  /** Called with the chosen `RepairOption` when a repair button is pressed. */
  onRepair?: (repair: RepairOption) => void;
}

/**
 * Renders one `IssueItem` per issue. Shared by the `warnings` slot's default
 * panel and the `map` slot's cold-start empty state, so both surfaces render
 * issues identically (ADR-0003).
 */
export const IssueList = ({ issues, severity, onRepair }: IssueListProps) => {
  if (issues.length === 0) return null;

  return (
    <Flex sx={{ flexDirection: 'column', gap: '3' }}>
      {issues.map((issue, index) => {
        return (
          <IssueItem
            key={`${issue.code}-${issue.subject.path}-${index}`}
            issue={issue}
            severity={severity}
            onRepair={onRepair}
          />
        );
      })}
    </Flex>
  );
};
