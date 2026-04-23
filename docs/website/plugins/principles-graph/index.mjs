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

/**
 * Parses the markdown content and extracts principles and corollaries
 */
const parsePrinciples = (markdownContent) => {
  const nodes = [];
  const links = [];

  const lines = markdownContent.split('\n');
  let currentGroup = '';
  let currentPrinciple = null;

  // First pass: extract all principles and corollaries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect group headings (## The ... of ...)
    if (line.startsWith('## The ')) {
      currentGroup = line.replace('## ', '').trim();
      continue;
    }

    // Detect principle headings (### The Principle of ...)
    if (line.startsWith('### The Principle of ')) {
      const heading = line.replace('### ', '').trim();
      const id = generateAnchor(heading);
      const label = extractShortName(heading);

      currentPrinciple = {
        id,
        label,
        type: 'principle',
        group: currentGroup,
        fullText: heading,
      };

      nodes.push(currentPrinciple);
      continue;
    }

    // Detect corollary headings (#### The Corollary of ...)
    if (line.startsWith('#### The Corollary of ')) {
      const heading = line.replace('#### ', '').trim();
      const id = generateAnchor(heading);
      const label = extractShortName(heading);

      const corollary = {
        id,
        label,
        type: 'corollary',
        group: currentGroup,
        fullText: heading,
      };

      nodes.push(corollary);

      // Create parent link between corollary and its principle
      if (currentPrinciple) {
        links.push({
          source: currentPrinciple.id,
          target: id,
          type: 'parent',
        });
      }
    }
  }

  // Second pass: extract references between principles/corollaries
  const refRegex = /\[([^\]]+)\]\(#([^)]+)\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Determine the current node context
    let contextNodeId = null;

    for (let j = i; j >= 0; j--) {
      const prevLine = lines[j];
      if (prevLine.startsWith('### The Principle of ')) {
        contextNodeId = generateAnchor(prevLine.replace('### ', '').trim());
        break;
      } else if (prevLine.startsWith('#### The Corollary of ')) {
        contextNodeId = generateAnchor(prevLine.replace('#### ', '').trim());
        break;
      }
    }

    if (!contextNodeId) continue;

    // Find all references in this line
    let match;
    while ((match = refRegex.exec(line)) !== null) {
      const targetId = match[2];

      const sourceNode = nodes.find((n) => {
        return n.id === contextNodeId;
      });
      const targetNode = nodes.find((n) => {
        return n.id === targetId;
      });

      if (sourceNode && targetNode && contextNodeId !== targetId) {
        const isParentLink = links.some((l) => {
          return (
            l.source === contextNodeId &&
            l.target === targetId &&
            l.type === 'parent'
          );
        });
        const isDuplicateRef = links.some((l) => {
          return (
            l.source === contextNodeId &&
            l.target === targetId &&
            l.type === 'reference'
          );
        });

        if (!isParentLink && !isDuplicateRef) {
          links.push({
            source: contextNodeId,
            target: targetId,
            type: 'reference',
          });
        }
      }
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

      // Read the markdown file
      const markdownPath = path.join(
        context.siteDir,
        'docs/ai/02-agentic-development-principles.md'
      );

      const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

      // Parse the principles
      const graphData = parsePrinciples(markdownContent);

      // Make the data available globally
      setGlobalData(graphData);
    },
  };
}
