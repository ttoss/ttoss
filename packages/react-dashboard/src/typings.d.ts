/**
 * Ambient CSS module declaration so TypeScript does not error on side-effect
 * CSS imports (e.g. `import 'react-grid-layout/css/styles.css'`).
 * Required since TypeScript 6 enforces TS2882 for untyped extension imports.
 */
declare module '*.css';
