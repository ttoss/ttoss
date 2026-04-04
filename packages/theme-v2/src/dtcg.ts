// ---------------------------------------------------------------------------
// @ttoss/theme2/dtcg — W3C Design Tokens Community Group (DTCG) export
//
// Build-time / pipeline tool for exporting token definitions to Figma Tokens,
// Token Studio, or any W3C DTCG-compatible downstream system.
//
// Import this from scripts and build tools — not from app bundles.
//
// @example
// ```ts
// import { toDTCG } from '@ttoss/theme2/dtcg';
// import { createTheme } from '@ttoss/theme2';
//
// const dtcg = toDTCG(createTheme().base);
// await fs.writeFile('tokens.json', JSON.stringify(dtcg, null, 2));
// ```
// ---------------------------------------------------------------------------

export type { DTCGToken, DTCGTokenTree } from './roots/toDTCG';
export { toDTCG } from './roots/toDTCG';
