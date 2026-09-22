/**
 * The ramps the settings story offers, and the base colors its editor opens on.
 *
 * Kept beside the story rather than inside it: they are data the story reads,
 * the same split `GeovisWorkspace.municipios.ts` makes for the locator.
 */

/**
 * The selectable ramps. Every one is sequential and four classes wide: light
 * reads as few and dark as many, with no hue change along the way — a diverging
 * ramp would claim a meaningful midpoint, and counts have none.
 */
export type Ramp = {
  id: string;
  label: string;
  colors: string[];
  removable?: boolean;
};

export const RAMPS: Ramp[] = [
  {
    id: 'azuis',
    label: 'Azuis',
    colors: ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'],
  },
  {
    id: 'verdes',
    label: 'Verdes',
    colors: ['#C7E9C0', '#74C476', '#238B45', '#00441B'],
  },
  {
    id: 'laranjas',
    label: 'Laranjas',
    colors: ['#FDD0A2', '#FD8D3C', '#D94801', '#7F2704'],
  },
  {
    id: 'roxos',
    label: 'Roxos',
    colors: ['#DADAEB', '#9E9AC8', '#6A51A3', '#3F007D'],
  },
];

export const DEFAULT_RAMP = 'azuis';

export const rampFor = ({ id, ramps }: { id: string; ramps: Ramp[] }) => {
  return (
    ramps.find((ramp) => {
      return ramp.id === id;
    }) ?? ramps[0]
  );
};

/** The base colors the ramp editor opens on. */
export const BASE_COLORS = [
  { id: 'azul', name: 'Azul', color: '#2171B5' },
  { id: 'verde', name: 'Verde', color: '#238B45' },
  { id: 'laranja', name: 'Laranja', color: '#D94801' },
  { id: 'roxo', name: 'Roxo', color: '#6A51A3' },
  { id: 'vermelho', name: 'Vermelho', color: '#CB181D' },
  { id: 'cinza', name: 'Cinza', color: '#636363' },
];
