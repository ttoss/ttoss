import { Drawer, Search } from '@ttoss/components';
import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Box, Button, Flex, Input, Label, Text, useTheme } from '@ttoss/ui';
import * as React from 'react';

import {
  DashboardCard,
  type DashboardCard as DashboardCardProps,
} from './DashboardCard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import { useDashboard } from './DashboardProvider';
import { DashboardSectionDivider } from './DashboardSectionDivider';

export type CardCatalogGroup =
  'sectionDivider' | 'meta' | 'oneclickads' | 'api' | 'oneclickads';

const getCatalogGroup = (item: CardCatalogItem): CardCatalogGroup => {
  if (item.card.type === 'sectionDivider') return 'sectionDivider';
  const defaultCard = item.card as Partial<{
    sourceType: Array<{ source: string }>;
  }>;
  const sources =
    defaultCard?.sourceType?.map((s) => {
      return s.source;
    }) ?? [];
  if (sources.includes('meta')) return 'meta';
  if (sources.includes('api')) return 'api';
  if (sources.includes('oneclickads')) return 'oneclickads';
  return 'api';
};

const GROUP_ORDER: CardCatalogGroup[] = [
  'sectionDivider',
  'meta',
  'oneclickads',
  'api',
];
const GROUP_LABELS: Record<CardCatalogGroup, string> = {
  sectionDivider: 'Divisor de seção',
  meta: 'Meta',
  api: 'API',
  oneclickads: 'OneClickAds',
};

const messages = defineMessages({
  edit: {
    defaultMessage: 'Editar',
    description: 'Dashboard toolbar: enters edit mode.',
  },
  addMetrics: {
    defaultMessage: 'Adicionar Métricas',
    description: 'Dashboard toolbar: opens the drawer for adding cards.',
  },
  save: {
    defaultMessage: 'Salvar',
    description: 'Dashboard toolbar: saves the current template.',
  },
  saveAsNewTemplate: {
    defaultMessage: 'Salvar Novo Template',
    description: 'Dashboard toolbar: saves the layout as a new template.',
  },
  cancelEdit: {
    defaultMessage: 'Cancelar Edição',
    description: 'Dashboard toolbar: leaves edit mode discarding changes.',
  },
  addMetricsTitle: {
    defaultMessage: 'Adicionar métricas',
    description: 'Add-card drawer: heading.',
  },
  addMetricsDescription: {
    defaultMessage: 'Escolha a métrica para adicionar ao dashboard.',
    description: 'Add-card drawer: explanation under the heading.',
  },
  templateTitleLabel: {
    defaultMessage: 'Título do template',
    description: 'Save-as-new drawer: label for the template name field.',
  },
  cancel: {
    defaultMessage: 'Cancelar',
    description: 'Save-as-new drawer: dismisses without saving.',
  },
});

// eslint-disable-next-line max-lines-per-function, complexity
export const DashboardEditToolbar = () => {
  const { intl } = useI18n();
  const { theme } = useTheme();
  const {
    editable,
    isEditMode,
    selectedTemplate,
    cardCatalog,
    startEdit,
    cancelEdit,
    saveEdit,
    saveAsNew,
    saveAsNewModalOpen,
    confirmSaveAsNew,
    cancelSaveAsNew,
    addCard,
  } = useDashboard();

  const [addCardDrawerOpen, setAddCardDrawerOpen] = React.useState(false);
  const [addCardSearch, setAddCardSearch] = React.useState('');
  const [saveAsNewTitle, setSaveAsNewTitle] = React.useState('');

  const drawerSizeXs =
    (theme?.sizes as Partial<Record<'xs', string>> | undefined)?.xs ?? '20rem';
  const drawerSizeSm =
    (theme?.sizes as Partial<Record<'sm', string>> | undefined)?.sm ?? '24rem';

  React.useEffect(() => {
    if (saveAsNewModalOpen && selectedTemplate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveAsNewTitle(`Clone de ${selectedTemplate.name}`);
    }
  }, [saveAsNewModalOpen, selectedTemplate]);

  const canEdit = editable && selectedTemplate != null;

  const handleAddCard = React.useCallback(
    (item: CardCatalogItem) => {
      addCard(item);
      setAddCardDrawerOpen(false);
    },
    [addCard]
  );

  if (!canEdit) return null;

  if (!isEditMode) {
    return (
      <Flex sx={{ gap: '3', alignItems: 'center' }}>
        <Button variant="primary" onClick={startEdit} rightIcon="lucide:pencil">
          {intl.formatMessage(messages.edit)}
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <Flex
        sx={{
          gap: '3',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="secondary"
          onClick={() => {
            setAddCardDrawerOpen(true);
          }}
          rightIcon="lucide:plus"
        >
          {intl.formatMessage(messages.addMetrics)}
        </Button>
        {selectedTemplate?.editable && (
          <Button
            variant="secondary"
            onClick={saveEdit}
            rightIcon="lucide:save"
          >
            {intl.formatMessage(messages.save)}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={saveAsNew}
          rightIcon="lucide:copy-check"
        >
          {intl.formatMessage(messages.saveAsNewTemplate)}
        </Button>
        <Button variant="secondary" onClick={cancelEdit} rightIcon="lucide:x">
          {intl.formatMessage(messages.cancelEdit)}
        </Button>
      </Flex>

      <Drawer
        open={addCardDrawerOpen}
        onClose={() => {
          setAddCardDrawerOpen(false);
          setAddCardSearch('');
        }}
        direction="right"
        size={drawerSizeXs}
        sx={{
          position: 'fixed',
          pointerEvents: addCardDrawerOpen ? 'auto' : 'none',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            height: '100%',
            padding: '4',
            overflow: 'hidden',
          }}
        >
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '2',
              flexShrink: 0,
            }}
          >
            <Text sx={{ fontWeight: 'bold', fontSize: 'lg' }}>
              {intl.formatMessage(messages.addMetricsTitle)}
            </Text>
            <Text sx={{ color: 'text.muted', fontSize: 'sm' }}>
              {intl.formatMessage(messages.addMetricsDescription)}
            </Text>
            <Search
              key={addCardDrawerOpen ? 'open' : 'closed'}
              placeholder="Buscar..."
              defaultValue=""
              onChange={(val) => {
                setAddCardSearch(String(val ?? ''));
              }}
              sx={{ width: '100%', marginTop: '2' }}
            />
          </Flex>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              marginTop: '8',
            }}
          >
            <Flex sx={{ flexDirection: 'column', gap: '8', paddingRight: '4' }}>
              {GROUP_ORDER.map((group) => {
                const searchLower = addCardSearch.trim().toLowerCase();
                const itemsInGroup = cardCatalog.filter((item) => {
                  if (getCatalogGroup(item) !== group) return false;
                  if (!searchLower) return true;
                  return item.card.title.toLowerCase().includes(searchLower);
                });
                if (itemsInGroup.length === 0) return null;
                return (
                  <Flex key={group} sx={{ flexDirection: 'column', gap: '2' }}>
                    <Text
                      sx={{
                        fontSize: 'xs',
                        fontWeight: 'bold',
                        color: 'input.text.muted.default',
                        textTransform: 'uppercase',
                        letterSpacing: 'wider',
                      }}
                    >
                      {GROUP_LABELS[group]}
                    </Text>
                    <Flex sx={{ flexDirection: 'column', gap: '2' }}>
                      {itemsInGroup.map((item) => {
                        return (
                          <Box
                            key={`${group}-${item.card.type}-${item.card.title}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              handleAddCard(item);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleAddCard(item);
                              }
                            }}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.9 },
                              '&:focus-visible': {
                                outline: 'md',
                                outlineColor: 'display.border.accent.default',
                                outlineOffset: '2',
                              },
                            }}
                          >
                            {item.card.type === 'sectionDivider' ? (
                              <DashboardSectionDivider
                                {...(item.card as Parameters<
                                  typeof DashboardSectionDivider
                                >[0])}
                              />
                            ) : (
                              <DashboardCard
                                {...(item.card as DashboardCardProps)}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Flex>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </Drawer>

      <Drawer
        open={saveAsNewModalOpen}
        onClose={cancelSaveAsNew}
        direction="right"
        size={drawerSizeSm}
        sx={{
          position: 'fixed',
          pointerEvents: saveAsNewModalOpen ? 'auto' : 'none',
        }}
      >
        <Flex
          sx={{
            flexDirection: 'column',
            gap: '6',
            paddingX: '4',
            paddingY: '10',
            height: '100%',
          }}
        >
          <Label htmlFor="save-as-new-title">
            {intl.formatMessage(messages.templateTitleLabel)}
          </Label>
          <Box sx={{ flex: 1 }}>
            <Input
              id="save-as-new-title"
              value={saveAsNewTitle}
              onChange={(e) => {
                setSaveAsNewTitle(e.target.value);
              }}
            />
          </Box>
          <Flex sx={{ gap: '3', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={cancelSaveAsNew}>
              {intl.formatMessage(messages.cancel)}
            </Button>
            <Button
              variant="accent"
              disabled={!saveAsNewTitle?.trim()?.length}
              onClick={() => {
                confirmSaveAsNew(saveAsNewTitle);
              }}
            >
              {intl.formatMessage(messages.save)}
            </Button>
          </Flex>
        </Flex>
      </Drawer>
    </>
  );
};
