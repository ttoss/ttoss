import ts from 'typescript';

import type { LintFinding, LintProfile } from '../types.ts';

/**
 * Gauntlet L4 — semantic lint.
 *
 * Mechanically decidable violations of each library's usage contract,
 * counted as the "semantic error rate" metric. Rules run on the AST of the
 * ORIGINAL sample (pre-repair), because the metric measures what the model
 * believed was correct, not what the repair loop fixed.
 *
 * fsl profile (from CONTRACT.md / llms.txt rules):
 * - fsl/no-style-classname: composites accept no `style`/`className`.
 * - fsl/no-size-prop: there is no `size` prop anywhere in fsl-ui.
 * - fsl/no-negative-validation: validation is the `invalid` State
 *   (`isInvalid`), never `evaluation="negative"` — the canonical confusion.
 * - no-raw-colors (shared): colors come from tokens, never literals.
 *
 * generic profile: no-raw-colors only — the fair equivalent of "theme
 * bypass" for the baselines (their theming rule is stated in the prompt).
 * Headless libraries must DEFINE tokens somewhere, so the generic profile
 * allows color literals inside a constant whose name contains theme/token
 * (or inside a `createTheme(...)` call) — hardcoding at the point of USE is
 * what counts as bypass.
 */
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\(/;

const INPUT_SELECTION_COMPONENTS = new Set([
  'TextField',
  'TextArea',
  'SearchField',
  'NumberField',
  'Slider',
  'Checkbox',
  'CheckboxGroup',
  'RadioGroup',
  'Radio',
  'Switch',
  'Select',
  'TagGroup',
  'Tag',
  'ToggleButtonGroup',
]);

const getJsxTagName = (
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): string => {
  return node.tagName.getText();
};

const TOKEN_DEFINITION_NAME = /theme|token/i;

const isInsideTokenDefinition = (
  node: ts.Node,
  profile: LintProfile
): boolean => {
  if (profile !== 'generic') {
    return false;
  }

  let current: ts.Node | undefined = node.parent;

  while (current) {
    if (
      ts.isVariableDeclaration(current) &&
      ts.isIdentifier(current.name) &&
      TOKEN_DEFINITION_NAME.test(current.name.text)
    ) {
      return true;
    }

    if (
      ts.isCallExpression(current) &&
      /createTheme$/.test(current.expression.getText())
    ) {
      return true;
    }

    current = current.parent;
  }

  return false;
};

/** Local names imported from @ttoss/fsl-ui (for the fsl-only prop rules). */
const collectFslImports = (sourceFile: ts.SourceFile): Set<string> => {
  const fslImports = new Set<string>();

  const collect = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === '@ttoss/fsl-ui' &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      for (const element of node.importClause.namedBindings.elements) {
        fslImports.add(element.name.text);
      }
    }
    ts.forEachChild(node, collect);
  };
  collect(sourceFile);

  return fslImports;
};

interface LintContext {
  findings: LintFinding[];
  profile: LintProfile;
  fslImports: Set<string>;
  lineOf: (node: ts.Node) => number;
}

const checkFslAttribute = (
  context: LintContext,
  tagName: string,
  attribute: ts.JsxAttribute
): void => {
  const attributeName = attribute.name.getText();

  if (attributeName === 'style' || attributeName === 'className') {
    context.findings.push({
      rule: 'fsl/no-style-classname',
      message: `<${tagName}> accepts no \`${attributeName}\` — customize via --fsl-* CSS knobs on the composite scope`,
      line: context.lineOf(attribute),
    });
  }

  if (attributeName === 'size') {
    context.findings.push({
      rule: 'fsl/no-size-prop',
      message: `<${tagName}> has no \`size\` prop — a different density is a different semantic identity`,
      line: context.lineOf(attribute),
    });
  }

  if (
    attributeName === 'evaluation' &&
    INPUT_SELECTION_COMPONENTS.has(tagName)
  ) {
    const initializer = attribute.initializer;
    const value =
      initializer && ts.isStringLiteral(initializer)
        ? initializer.text
        : initializer?.getText();

    context.findings.push({
      rule: 'fsl/no-negative-validation',
      message: `<${tagName}> is a data-entry surface and carries no \`evaluation\`${
        value ? ` (got ${value})` : ''
      } — validation is the runtime \`isInvalid\` state`,
      line: context.lineOf(attribute),
    });
  }
};

const checkJsxElement = (
  context: LintContext,
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement
): void => {
  const tagName = getJsxTagName(node);

  if (context.profile !== 'fsl' || !context.fslImports.has(tagName)) {
    return;
  }

  for (const attribute of node.attributes.properties) {
    if (ts.isJsxAttribute(attribute)) {
      checkFslAttribute(context, tagName, attribute);
    }
  }
};

const isColorCarrier = (node: ts.Node): boolean => {
  return (
    (ts.isStringLiteral(node) &&
      !ts.isImportDeclaration(node.parent) &&
      !ts.isImportSpecifier(node.parent)) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateHead(node) ||
    ts.isTemplateMiddle(node) ||
    ts.isTemplateTail(node)
  );
};

const checkRawColor = (context: LintContext, node: ts.Node): void => {
  if (!isColorCarrier(node)) {
    return;
  }

  const text = (node as ts.LiteralLikeNode).text;

  if (RAW_COLOR.test(text) && !isInsideTokenDefinition(node, context.profile)) {
    context.findings.push({
      rule: 'no-raw-colors',
      message: `hardcoded color literal (${text.slice(
        0,
        40
      )}) — colors must come from the theming system / design tokens`,
      line: context.lineOf(node),
    });
  }
};

export const lintSample = ({
  code,
  profile,
}: {
  code: string;
  profile: LintProfile;
}): LintFinding[] => {
  const sourceFile = ts.createSourceFile(
    'sample.tsx',
    code,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX
  );

  const context: LintContext = {
    findings: [],
    profile,
    fslImports: collectFslImports(sourceFile),
    lineOf: (node) => {
      return (
        sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
          .line + 1
      );
    },
  };

  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      checkJsxElement(context, node);
    }

    checkRawColor(context, node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return context.findings;
};
