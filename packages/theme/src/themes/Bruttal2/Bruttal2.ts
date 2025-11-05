/**
 * Bruttal2 Theme
 *
 * A modern brutalist theme built with the new design token architecture.
 * Features sharp edges, high contrast, and bold typography for maximum impact.
 *
 * Based on semantic design tokens following UX-context organization:
 * - action: Interactive elements that trigger user actions
 * - input: Form elements and data entry
 * - content: Static presentation and information display
 * - feedback: Alerts, status messages, and user feedback
 * - navigation: Wayfinding and site navigation
 * - discovery: Search, filter, and content discovery
 * - guidance: Proactive help and educational content
 */

export { Bruttal2Fonts } from './Bruttal2Fonts';
export { Bruttal2Icons } from './Bruttal2Icons';
export { Bruttal2Theme } from './Bruttal2Theme';

// Export only semantic tokens for application consumption
export { semanticColors } from './Bruttal2SemanticTokens';

// Core tokens are kept internal - applications should use semantic tokens only
