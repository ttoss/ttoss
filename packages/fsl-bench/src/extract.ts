/**
 * Extracts the TSX source from a model completion.
 *
 * Preference order: last fenced code block (models often restate the final
 * file after self-correcting), else the whole text when it already looks
 * like raw code. Returns null when no code can be found — counted as a
 * failed sample, never silently skipped.
 */
const FENCE = /```(?:tsx|jsx|typescript|ts|javascript|js)?\s*\n([\s\S]*?)```/g;

export const extractCode = (completion: string): string | null => {
  const blocks = [...completion.matchAll(FENCE)].map((m) => {
    return m[1].trim();
  });

  if (blocks.length > 0) {
    // Last block wins, but ignore trailing non-code blocks (e.g. usage notes).
    const code = [...blocks].reverse().find((b) => {
      return /\bexport default\b/.test(b);
    });
    return code ?? blocks[blocks.length - 1];
  }

  const trimmed = completion.trim();

  if (/^(import|\/\*|\/\/|'use client'|"use client")/.test(trimmed)) {
    return trimmed;
  }

  return null;
};
