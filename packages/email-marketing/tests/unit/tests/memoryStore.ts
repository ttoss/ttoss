import type { Suppression, SuppressionStore } from '../../../src';

/** A SuppressionStore over an array, for tests. */
export const memoryStore = () => {
  const rows: Suppression[] = [];
  const store: SuppressionStore = {
    find: async ({ email, scopes }) => {
      return rows.filter((row) => {
        return row.email === email && scopes.includes(row.scope);
      });
    },
    save: async (suppression) => {
      const index = rows.findIndex((row) => {
        return (
          row.email === suppression.email && row.scope === suppression.scope
        );
      });
      if (index >= 0) {
        rows[index] = suppression;
      } else {
        rows.push(suppression);
      }
    },
    removeManual: async ({ email, scope }) => {
      const index = rows.findIndex((row) => {
        return (
          row.email === email && row.scope === scope && row.reason === 'manual'
        );
      });
      if (index >= 0) {
        rows.splice(index, 1);
      }
    },
  };
  return { rows, store };
};
