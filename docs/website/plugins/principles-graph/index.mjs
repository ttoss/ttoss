import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extracts an anchor ID from a heading text
 */
const generateAnchor = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Extracts the short name from a principle/corollary heading
 */
const extractShortName = (heading) => {
  const principleMatch = heading.match(/The Principle of (.+)/);
  if (principleMatch) {
    return principleMatch[1];
  }

  const corollaryMatch = heading.match(/The Corollary of (.+)/);
  if (corollaryMatch) {
    return corollaryMatch[1];
  }

  return heading;
};

const PRINCIPLE_PREFIX = '### The Principle of ';

const COROLLARY_PREFIX = '#### The Corollary of ';

/**
 * Returns the node type and heading text of a principle/corollary heading
 * line, or `null` for any other line
 */
const parseNodeHeading = (line) => {
  if (line.startsWith(PRINCIPLE_PREFIX)) {
    return { type: 'principle', heading: line.replace('### ', '').trim() };
  }

  if (line.startsWith(COROLLARY_PREFIX)) {
    return { type: 'corollary', heading: line.replace('#### ', '').trim() };
  }

  return null;
};

/**
 * First pass: extracts all principles and corollaries, plus the parent link
 * between each corollary and the principle above it
 */
const extractNodes = (lines) => {
  const nodes = [];
  const links = [];

  let currentGroup = '';
  let currentPrinciple = null;

  for (const line of lines) {
    // Detect group headings (## The ... of ...)
    if (line.startsWith('## The ')) {
      currentGroup = line.replace('## ', '').trim();
      continue;
    }

    const nodeHeading = parseNodeHeading(line);

    if (!nodeHeading) {
      continue;
    }

    const { type, heading } = nodeHeading;

    const node = {
      id: generateAnchor(heading),
      label: extractShortName(heading),
      type,
      group: currentGroup,
      fullText: heading,
    };

    nodes.push(node);

    if (type === 'principle') {
      currentPrinciple = node;
    } else if (currentPrinciple) {
      // Create parent link between corollary and its principle
      links.push({
        source: currentPrinciple.id,
        target: node.id,
        type: 'parent',
      });
    }
  }

  return { nodes, links };
};

/**
 * For each line, the ID of the closest principle/corollary heading at or above
 * it (`null` before the first one)
 */
const getContextNodeIds = (lines) => {
  let contextNodeId = null;

  return lines.map((line) => {
    const nodeHeading = parseNodeHeading(line);

    if (nodeHeading) {
      contextNodeId = generateAnchor(nodeHeading.heading);
    }

    return contextNodeId;
  });
};

/**
 * Adds a reference link unless it is a self-reference, points to an unknown
 * node, or duplicates an existing parent/reference link
 */
const addReferenceLink = ({ nodes, links, source, target }) => {
  const hasNode = (id) => {
    return nodes.some((n) => {
      return n.id === id;
    });
  };

  if (source === target || !hasNode(source) || !hasNode(target)) {
    return;
  }

  const isLinked = links.some((l) => {
    return (
      l.source === source &&
      l.target === target &&
      (l.type === 'parent' || l.type === 'reference')
    );
  });

  if (!isLinked) {
    links.push({ source, target, type: 'reference' });
  }
};

/**
 * Parses the markdown content and extracts principles and corollaries
 */
const parsePrinciples = (markdownContent) => {
  const lines = markdownContent.split('\n');

  const { nodes, links } = extractNodes(lines);

  // Second pass: extract references between principles/corollaries
  const refRegex = /\[([^\]]+)\]\((?:[^)#]+)?#([^)]+)\)/g;

  const contextNodeIds = getContextNodeIds(lines);

  for (const [i, line] of lines.entries()) {
    const contextNodeId = contextNodeIds[i];

    if (!contextNodeId) {
      continue;
    }

    // Find all references in this line
    for (const match of line.matchAll(refRegex)) {
      addReferenceLink({
        nodes,
        links,
        source: contextNodeId,
        target: match[2],
      });
    }
  }

  return { nodes, links };
};

/**
 * Docusaurus plugin for generating principles graph data
 */
export default function principlesGraphPlugin(context, _options) {
  return {
    name: 'principles-graph-plugin',

    contentLoaded: async ({ actions }) => {
      const { setGlobalData } = actions;

      // Read the principle chapter files.
      const principlesDir = path.join(
        context.siteDir,
        'docs/ai/agentic-development-principles'
      );

      const markdownContent = fs
        .readdirSync(principlesDir)
        .filter((fileName) => {
          return fileName.endsWith('.md') && fileName !== 'index.md';
        })
        .sort()
        .map((fileName) => {
          const markdownPath = path.join(principlesDir, fileName);

          return fs.readFileSync(markdownPath, 'utf-8');
        })
        .join('\n\n');

      // Parse the principles
      const graphData = parsePrinciples(markdownContent);

      // Make the data available globally
      setGlobalData(graphData);
    },
  };
}
