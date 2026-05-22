import { Drawer } from '@ttoss/components/Drawer';
import { Search } from '@ttoss/components/Search';
import { Box, Button, Flex, Input, Label, Text } from '@ttoss/ui';
import * as React from 'react';

import { BigNumber } from './Cards/BigNumber';
import type { DashboardCard } from './DashboardCard';
import type { CardCatalogItem } from './dashboardCardCatalog';
import { DashboardSectionDivider } from './DashboardSectionDivider';

// Local copies of grouping helpers (kept local to avoid circular imports)
export type CardCatalogGroup =
  | 'sectionDivider'
  | 'meta'
  | 'oneclickads'
  | 'api';

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

export const CardCatalogItemRow = ({
  item,
  addCard,
}: {
  item: CardCatalogItem;
  addCard: (item: CardCatalogItem) => void;
}) => {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => {
        return addCard(item);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          addCard(item);
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
      {item.card.type === 'bigNumber' ? (
        <BigNumber {...(item.card as DashboardCard)} />
      ) : item.card.type === 'sectionDivider' ? (
        <DashboardSectionDivider {...(item.card as DashboardCard)} />
      ) : (
        <Text>{item.card.title}</Text>
      )}
    </Box>
  );
};

export const AddCardDrawer = ({
  open,
  onClose,
  size,
  cardCatalog,
  addCard,
}: {
  open: boolean;
  onClose: () => void;
  size: string;
  cardCatalog?: CardCatalogItem[];
  addCard: (item: CardCatalogItem) => void;
}) => {
  const [search, setSearch] = React.useState('');
  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose();
        setSearch('');
      }}
      direction="right"
      size={size}
      sx={{
        position: 'fixed',
        pointerEvents: open ? 'auto' : 'none',
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
        <Flex sx={{ flexDirection: 'column', gap: '2', flexShrink: 0 }}>
          <Text sx={{ fontWeight: 'bold', fontSize: 'lg' }}>
            Adicionar métricas
          </Text>
          <Text sx={{ color: 'text.muted', fontSize: 'sm' }}>
            Escolha a métrica para adicionar ao dashboard.
          </Text>
          <Search
            key={open ? 'open' : 'closed'}
            placeholder="Buscar..."
            defaultValue=""
            onChange={(val) => {
              return setSearch(String(val ?? ''));
            }}
            sx={{ width: '100%', marginTop: '2' }}
          />
        </Flex>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: '8' }}>
          <Flex sx={{ flexDirection: 'column', gap: '8', paddingRight: '4' }}>
            {GROUP_ORDER.map((group) => {
              const searchLower = search.trim().toLowerCase();
              const itemsInGroup = (cardCatalog ?? []).filter((item) => {
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
                        <CardCatalogItemRow
                          key={`${group}-${item.card.type}-${item.card.title}`}
                          item={item}
                          addCard={addCard}
                        />
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
  );
};

export const SaveAsNewDrawer = ({
  open,
  onClose,
  size,
  selectedTemplate,
  confirmSaveAsNew,
}: {
  open: boolean;
  onClose: () => void;
  size: string;
  selectedTemplate?: { id?: string; name?: string } | null;
  confirmSaveAsNew: (title: string) => void;
}) => {
  const initialTitle = selectedTemplate
    ? `Clone de ${selectedTemplate.name}`
    : '';
  const [title, setTitle] = React.useState(initialTitle);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      direction="right"
      size={size}
      sx={{ position: 'fixed', pointerEvents: open ? 'auto' : 'none' }}
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
            value={title}
            onChange={(e) => {
              return setTitle(e.target.value);
            }}
          />
        </Box>
        <Flex sx={{ gap: '3', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="accent"
            disabled={!title?.trim()?.length}
            onClick={() => {
              return confirmSaveAsNew(title);
            }}
          >
            Salvar
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
};

export const EditModeControls = ({
  selectedTemplate,
  addCardDrawerOpen,
  setAddCardDrawerOpen,
  drawerSizeXs,
  drawerSizeSm,
  saveEdit,
  saveAsNew,
  cancelEdit,
  addCard,
  saveAsNewModalOpen,
  confirmSaveAsNew,
  cancelSaveAsNew,
  cardCatalog,
}: {
  selectedTemplate?: { id?: string; name?: string } | null;
  addCardDrawerOpen: boolean;
  setAddCardDrawerOpen: (v: boolean) => void;
  drawerSizeXs: string;
  drawerSizeSm: string;
  saveEdit: () => void;
  saveAsNew: () => void;
  cancelEdit: () => void;
  addCard: (item: CardCatalogItem) => void;
  saveAsNewModalOpen: boolean;
  confirmSaveAsNew: (title: string) => void;
  cancelSaveAsNew: () => void;
  cardCatalog?: CardCatalogItem[];
}) => {
  return (
    <>
      <Flex sx={{ gap: '3', flexWrap: 'wrap' }}>
        <Button
          variant="secondary"
          onClick={() => {
            return setAddCardDrawerOpen(true);
          }}
          rightIcon="lucide:plus"
        >
          Adicionar Métricas
        </Button>
        {selectedTemplate?.editable && (
          <Button
            variant="secondary"
            onClick={saveEdit}
            rightIcon="lucide:save"
          >
            Salvar
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={saveAsNew}
          rightIcon="lucide:copy-check"
        >
          Salvar Novo Template
        </Button>
        <Button variant="secondary" onClick={cancelEdit} rightIcon="lucide:x">
          Cancelar Edição
        </Button>
      </Flex>

      <AddCardDrawer
        open={addCardDrawerOpen}
        onClose={() => {
          return setAddCardDrawerOpen(false);
        }}
        size={drawerSizeXs}
        cardCatalog={cardCatalog}
        addCard={(item: CardCatalogItem) => {
          addCard(item);
          setAddCardDrawerOpen(false);
        }}
      />

      <SaveAsNewDrawer
        key={saveAsNewModalOpen ? (selectedTemplate?.id ?? 'open') : 'closed'}
        open={saveAsNewModalOpen}
        onClose={cancelSaveAsNew}
        size={drawerSizeSm}
        selectedTemplate={selectedTemplate}
        confirmSaveAsNew={confirmSaveAsNew}
      />
    </>
  );
};
