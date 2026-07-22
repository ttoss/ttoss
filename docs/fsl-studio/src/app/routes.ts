/**
 * The Studio's sections. Navigation is a vertical `Tabs` (Navigation entity):
 * each route id is both the Tab/TabPanel id and the URL hash (`#/blocks`),
 * so sections deep-link and survive reloads.
 */
export const ROUTES = [
  { id: 'overview', label: 'Overview' },
  { id: 'blocks', label: 'Blocks' },
  { id: 'components', label: 'Components' },
  { id: 'theme', label: 'Theme' },
] as const;

export type RouteId = (typeof ROUTES)[number]['id'];

export const DEFAULT_ROUTE: RouteId = 'overview';

export const isRouteId = (value: string): value is RouteId => {
  return ROUTES.some((route) => {
    return route.id === value;
  });
};
