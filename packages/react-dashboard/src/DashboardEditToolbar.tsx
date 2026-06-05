import { Box, Button, useTheme } from '@ttoss/ui';
import * as React from 'react';

import { EditModeControls } from './DashboardEditParts';
import { useDashboard } from './DashboardProvider';

/* components moved to DashboardEditParts.tsx */

export const DashboardEditToolbar = () => {
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

  const drawerSizeXs =
    (theme?.sizes as Partial<Record<'xs', string>> | undefined)?.xs ?? '20rem';
  const drawerSizeSm =
    (theme?.sizes as Partial<Record<'sm', string>> | undefined)?.sm ?? '24rem';

  const canEdit = editable && selectedTemplate != null;

  if (!canEdit) return null;

  if (!isEditMode) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: '4',
          right: '4',
          zIndex: 1000,
        }}
      >
        <Button
          variant="primary"
          onClick={startEdit}
          rightIcon="lucide:pencil"
          sx={{
            borderRadius: 'full',
            paddingX: '4',
            paddingY: '3',
            boxShadow: 'lg',
          }}
        >
          Editar
        </Button>
      </Box>
    );
  }

  return (
    <EditModeControls
      selectedTemplate={selectedTemplate}
      addCardDrawerOpen={addCardDrawerOpen}
      setAddCardDrawerOpen={setAddCardDrawerOpen}
      drawerSizeXs={drawerSizeXs}
      drawerSizeSm={drawerSizeSm}
      saveEdit={saveEdit}
      saveAsNew={saveAsNew}
      cancelEdit={cancelEdit}
      addCard={addCard}
      saveAsNewModalOpen={saveAsNewModalOpen}
      confirmSaveAsNew={confirmSaveAsNew}
      cancelSaveAsNew={cancelSaveAsNew}
      cardCatalog={cardCatalog}
    />
  );
};
