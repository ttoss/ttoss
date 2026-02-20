import { Drawer } from '@ttoss/components/Drawer';
import { Search } from '@ttoss/components/Search';
import { Box, Button, Flex, Input, Label, Text } from '@ttoss/ui';
import * as React from 'react';

import { BigNumber } from './Cards/BigNumber';
import type { DashboardCard } from './DashboardCard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import { useDashboard } from './DashboardProvider';
import { DashboardSectionDivider } from './DashboardSectionDivider';

export type CardCatalogGroup =
  | 'sectionDivider'
  | 'meta'
  | 'oneclickads'
  | 'api'
  | 'oneclickads';

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

export const DashboardEditToolbar = () => {
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

  React.useEffect(() => {
    if (saveAsNewModalOpen && selectedTemplate) {
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
          Editar
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <Flex sx={{ gap: '3', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="accent"
          onClick={() => {
            setAddCardDrawerOpen(true);
          }}
          rightIcon="lucide:plus"
          sx={{ marginRight: '10' }}
        >
          Adicionar item
        </Button>
        {selectedTemplate?.editable && (
          <Button variant="accent" onClick={saveEdit} rightIcon="lucide:save">
            Salvar
          </Button>
        )}
        <Button
          variant="primary"
          onClick={saveAsNew}
          rightIcon="lucide:copy-check"
        >
          Salvar como novo
        </Button>
        <Button variant="secondary" onClick={cancelEdit} rightIcon="lucide:x">
          Cancelar edição
        </Button>
      </Flex>

      <Drawer
        open={addCardDrawerOpen}
        onClose={() => {
          setAddCardDrawerOpen(false);
          setAddCardSearch('');
        }}
        direction="right"
        size="320px"
        sx={{
          width: addCardDrawerOpen ? '100%' : '0',
          display: addCardDrawerOpen ? 'block' : 'none',
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
              Adicionar item
            </Text>
            <Text sx={{ color: 'text.muted', fontSize: 'sm' }}>
              Escolha o tipo de card para adicionar ao dashboard.
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
                        letterSpacing: '0.05em',
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
                                outline: '2px solid',
                                outlineColor: 'display.border.accent.default',
                                outlineOffset: '2',
                              },
                            }}
                          >
                            {item.card.type === 'bigNumber' ? (
                              <BigNumber {...(item.card as DashboardCard)} />
                            ) : item.card.type === 'sectionDivider' ? (
                              <DashboardSectionDivider
                                {...(item.card as DashboardCard)}
                              />
                            ) : (
                              <Text>{item.card.title}</Text>
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
        size="360px"
        sx={{
          width: saveAsNewModalOpen ? '100%' : '0',
          display: saveAsNewModalOpen ? 'block' : 'none',
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
          <Label htmlFor="save-as-new-title">Título do template</Label>
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
              Cancelar
            </Button>
            <Button
              variant="accent"
              disabled={!saveAsNewTitle?.trim()?.length}
              onClick={() => {
                confirmSaveAsNew(saveAsNewTitle);
              }}
            >
              Salvar
            </Button>
          </Flex>
        </Flex>
      </Drawer>
    </>
  );
};
