import {
  Container,
  Heading,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Text,
} from '@ttoss/fsl-ui';
import { ENTITIES } from '@ttoss/fsl-ui/semantics';

import { CATALOG, ENTITY_SUMMARY } from '../catalog/catalog';

/**
 * The component catalog — deliberately a curated index, not a state-matrix
 * workbench: every declared semantic identity in @ttoss/fsl-ui, grouped by
 * Entity, derived from the package's own `*Meta` exports (nothing here is
 * hand-maintained). Canonical usage lives in the shipped ground truth
 * (JSDoc, llms.txt, CONTRACT.md) — linked below, not restated.
 */
export const ComponentsPage = () => {
  return (
    <Container size="surface" gutter="page">
      <Stack gap="xl">
        <Stack gap="sm">
          <Heading level={2} size="headline-sm">
            Components
          </Heading>
          <Text tone="muted">
            Every semantic identity @ttoss/fsl-ui declares, grouped by Entity
            and read live from the package&apos;s own meta exports. For
            canonical usage, consume the shipped ground truth:{' '}
            <Link href="https://github.com/ttoss/ttoss/blob/main/packages/fsl-ui/llms.txt">
              llms.txt
            </Link>{' '}
            and{' '}
            <Link href="https://github.com/ttoss/ttoss/blob/main/packages/fsl-ui/src/tokens/CONTRACT.md">
              CONTRACT.md
            </Link>
            .
          </Text>
        </Stack>
        {ENTITIES.map((entity) => {
          return (
            <Stack key={entity} gap="md">
              <Stack gap="xs">
                <Heading level={3} size="title-md">
                  {entity}
                </Heading>
                <Text variant="body-sm" tone="muted">
                  {ENTITY_SUMMARY[entity]}
                </Text>
              </Stack>
              <Table aria-label={`${entity} components`}>
                <TableHeader>
                  <TableColumn id="name" isRowHeader>
                    Component
                  </TableColumn>
                  <TableColumn id="structure">Structural role</TableColumn>
                  <TableColumn id="composition">Composition</TableColumn>
                </TableHeader>
                <TableBody>
                  {CATALOG[entity].map((entry) => {
                    return (
                      <TableRow key={entry.name} id={entry.name}>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>{entry.structure}</TableCell>
                        <TableCell>{entry.composition ?? '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Stack>
          );
        })}
      </Stack>
    </Container>
  );
};
