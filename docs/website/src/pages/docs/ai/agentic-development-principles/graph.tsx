/* eslint-disable @typescript-eslint/no-explicit-any */
import BrowserOnly from '@docusaurus/BrowserOnly';
import { usePluginData } from '@docusaurus/useGlobalData';
import Layout from '@theme/Layout';
import * as React from 'react';

interface PrincipleNode {
  id: string;
  label: string;
  type: 'principle' | 'corollary';
  group: string;
  fullText: string;
}

interface PrincipleLink {
  source: string;
  target: string;
  type: 'parent' | 'reference';
}

interface GraphData {
  nodes: PrincipleNode[];
  links: PrincipleLink[];
}

// Color schemes for different groups
const GROUP_COLORS: Record<string, string> = {
  'The Foundations of Hybrid Allocation': '#FF6B6B',
  'The Physics of AI Integration': '#4ECDC4',
  'The Economics of Interaction': '#45B7D1',
  'The Governance of Technical Debt': '#FFA07A',
  'The Architecture of Flow': '#98D8C8',
  'The Protocol of Communication': '#F7DC6F',
  'The Governance of Agency': '#BB8FCE',
  'The Symbiosis of Human-AI Agency': '#85C1E2',
};

const DEFAULT_COLOR = '#999';

const SELECTED_COLOR = '#FF0000';

const HOVERED_COLOR = '#FFA500';

const linkKey = (link: PrincipleLink) => {
  return `${link.source}->${link.target}`;
};

// Count incoming references for each node
const countReferences = (links: PrincipleLink[]) => {
  const referenceCount: Record<string, number> = {};
  for (const link of links) {
    if (link.type === 'reference') {
      referenceCount[link.target] = (referenceCount[link.target] || 0) + 1;
    }
  }
  return referenceCount;
};

// Build adjacency list
const buildLinkMap = (links: PrincipleLink[]) => {
  const linkMap = new Map<string, PrincipleLink[]>();
  for (const link of links) {
    if (!linkMap.has(link.source)) {
      linkMap.set(link.source, []);
    }
    linkMap.get(link.source)!.push(link);
  }
  return linkMap;
};

// Function to break cycles by keeping references to most-referenced nodes
const breakCycles = ({ nodes, links }: GraphData): PrincipleLink[] => {
  const referenceCount = countReferences(links);

  // Find the link to remove (the one pointing to the less-referenced node)
  const findWeakestLink = (cycle: string[]) => {
    let minRef = Infinity;
    let linkToRemove: PrincipleLink | null = null;

    for (let i = 0; i < cycle.length; i++) {
      const source = cycle[i];
      const target = cycle[(i + 1) % cycle.length];
      const link = links.find((l) => {
        return (
          l.source === source && l.target === target && l.type === 'reference'
        );
      });
      const targetRefCount = referenceCount[target] || 0;

      if (link && targetRefCount < minRef) {
        minRef = targetRefCount;
        linkToRemove = link;
      }
    }

    return linkToRemove;
  };

  // Detect and break cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const linkMap = buildLinkMap(links);

  const linksToRemove = new Set<string>();

  const hasCycle = (node: string, path: string[]): boolean => {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = linkMap.get(node) || [];
    for (const link of neighbors) {
      const neighbor = link.target;

      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor, [...path])) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - remove the weakest link
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);

        const linkToRemove = findWeakestLink(cycle);

        if (linkToRemove) {
          linksToRemove.add(linkKey(linkToRemove));
        }
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  };

  // Check all nodes for cycles
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      hasCycle(node.id, []);
    }
  }

  // Filter out problematic links
  return links.filter((link) => {
    return !linksToRemove.has(linkKey(link));
  });
};

type GraphFocus = { selectedNode: string | null; hoveredNode: string | null };

// Returns the canvas painter for a node (circle, focus border and label)
const createNodePainter = ({ selectedNode, hoveredNode }: GraphFocus) => {
  return (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const isPrinciple = node.type === 'principle';
    const fontSize = isPrinciple ? 14 : 10;
    const nodeRadius = isPrinciple ? 8 : 5;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw border for selected/hovered nodes
    if (selectedNode === node.id || hoveredNode === node.id) {
      ctx.strokeStyle =
        selectedNode === node.id ? SELECTED_COLOR : HOVERED_COLOR;
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label
    ctx.font = `${fontSize / globalScale}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    const maxWidth = 100 / globalScale;
    const words = label.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = (fontSize / globalScale) * 1.2;
    const startY = node.y + nodeRadius + 10 / globalScale;

    for (const [i, line] of lines.entries()) {
      ctx.fillText(line, node.x, startY + i * lineHeight);
    }
  };
};

const configureGraph = ({
  instance,
  graphData,
  dagMode,
  selectedNode,
  hoveredNode,
  setSelectedNode,
  setHoveredNode,
  graphRef,
}: {
  instance: any;
  graphData: GraphData;
  dagMode: string;
  selectedNode: string | null;
  hoveredNode: string | null;
  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  graphRef: React.RefObject<HTMLDivElement | null>;
}) => {
  // Filter and process links based on DAG mode
  const filteredData = {
    nodes: graphData.nodes,
    links: dagMode ? breakCycles(graphData) : graphData.links,
  };

  const graph = instance
    .graphData(filteredData)
    .dagMode(dagMode)
    .dagLevelDistance(150)
    .nodeId('id')
    .nodeLabel((node: any) => {
      return `
        <div style="padding: 8px; max-width: 300px;">
          <strong>${node.fullText}</strong><br/>
          <em>${node.group}</em>
        </div>
      `;
    })
    .nodeVal((node: any) => {
      return node.type === 'principle' ? 12 : 6;
    })
    .nodeColor((node: any) => {
      if (selectedNode === node.id) return SELECTED_COLOR;
      if (hoveredNode === node.id) return HOVERED_COLOR;
      return GROUP_COLORS[node.group] || DEFAULT_COLOR;
    })
    .nodeCanvasObject(createNodePainter({ selectedNode, hoveredNode }))
    .linkColor((link: any) => {
      if (link.type === 'parent') return '#333';
      return '#999';
    })
    .linkWidth((link: any) => {
      return link.type === 'parent' ? 2 : 1;
    })
    .linkDirectionalArrowLength((link: any) => {
      return link.type === 'reference' ? 5 : 0;
    })
    .linkDirectionalArrowRelPos(1)
    .linkLineDash((link: any) => {
      return link.type === 'reference' ? [5, 5] : null;
    })
    .onNodeClick((node: any) => {
      setSelectedNode(node.id === selectedNode ? null : node.id);
      // Navigate to the principle in the main document
      window.open(
        `/docs/ai/agentic-development-principles#${node.id}`,
        '_blank'
      );
    })
    .onNodeHover((node: any) => {
      setHoveredNode(node ? node.id : null);
      graphRef.current!.style.cursor = node ? 'pointer' : 'default';
    })
    .onDagError((_loopNodeIds: string[]) => {
      // Allow the graph to continue with best-effort hierarchy
      // DAG cycles are handled by the breakCycles function
    });

  // Configure d3 forces
  graph.d3Force('charge').strength(-300);
  graph.d3Force('link').distance((link: any) => {
    return link.type === 'parent' ? 50 : 100;
  });
  graph.d3VelocityDecay(0.3);

  return graph;
};

// Client-side only graph component
const ForceGraphComponent = ({ graphData }: { graphData: GraphData }) => {
  const graphRef = React.useRef<HTMLDivElement>(null);
  const forceGraphRef = React.useRef<any>(null);
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null);
  const [dagMode, setDagMode] = React.useState<string>('td');

  // Initialize force-graph
  React.useEffect(() => {
    if (!graphData || !graphRef.current) return;

    // Dynamically import force-graph
    import('force-graph').then((ForceGraphModule) => {
      const ForceGraph = ForceGraphModule.default;

      // @ts-expect-error - force-graph has incorrect type definitions
      const instance = ForceGraph()(graphRef.current);

      const graph = configureGraph({
        instance,
        graphData,
        dagMode,
        selectedNode,
        hoveredNode,
        setSelectedNode,
        setHoveredNode,
        graphRef,
      });

      forceGraphRef.current = graph;

      // Handle resize
      const handleResize = () => {
        if (graphRef.current) {
          graph
            .width(graphRef.current.offsetWidth)
            .height(graphRef.current.offsetHeight);
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }); // End of dynamic import .then()
  }, [graphData, selectedNode, hoveredNode, dagMode]);

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="dag-mode"
          style={{ marginRight: '10px', fontWeight: 'bold' }}
        >
          Layout:
        </label>
        <select
          id="dag-mode"
          value={dagMode}
          onChange={(e) => {
            return setDagMode(e.target.value);
          }}
          style={{
            padding: '5px 10px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="td">Top-Down</option>
          <option value="bu">Bottom-Up</option>
          <option value="lr">Left-Right</option>
          <option value="rl">Right-Left</option>
          <option value="radialout">Radial Outward</option>
          <option value="radialin">Radial Inward</option>
          <option value="">Force-Directed (No DAG)</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Legend:</h3>
        <ul>
          <li>
            <strong>Large circles:</strong> Principles (higher force)
          </li>
          <li>
            <strong>Small circles:</strong> Corollaries
          </li>
          <li>
            <strong>Solid lines:</strong> Parent-child relationships (Principle
            → Corollary)
          </li>
          {!dagMode && (
            <li>
              <strong>Dashed arrows:</strong> References between
              principles/corollaries
            </li>
          )}
          <li>
            <strong>Layout modes:</strong> DAG modes (Top-Down, etc.) show only
            hierarchical relationships. Force-Directed mode shows all
            relationships including cross-references.
          </li>
        </ul>
      </div>

      <div
        ref={graphRef}
        style={{
          width: '100%',
          height: '800px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#fafafa',
        }}
      />

      {graphData && (
        <div style={{ marginTop: '20px' }}>
          <p>
            <strong>Stats:</strong>{' '}
            {
              graphData.nodes.filter((n) => {
                return n.type === 'principle';
              }).length
            }{' '}
            principles,{' '}
            {
              graphData.nodes.filter((n) => {
                return n.type === 'corollary';
              }).length
            }{' '}
            corollaries,{' '}
            {dagMode
              ? `${
                  graphData.links.filter((l) => {
                    return l.type === 'parent';
                  }).length
                } hierarchical connections (${graphData.links.length} total)`
              : `${graphData.links.length} connections`}
          </p>
        </div>
      )}
    </>
  );
};

export default function PrinciplesGraphPage() {
  // Get the graph data from the plugin
  const graphData = usePluginData('principles-graph-plugin') as GraphData;

  return (
    <Layout
      title="Principles Graph"
      description="Interactive graph visualization of Agentic Development Principles"
    >
      <div style={{ padding: '20px' }}>
        <h1>Agentic Development Principles - Graph View</h1>
        <p>
          This interactive graph visualizes the relationships between principles
          and their corollaries. Larger nodes represent principles, smaller
          nodes represent corollaries. Solid lines connect principles to their
          corollaries, dashed arrows show references between concepts. Click on
          any node to navigate to its definition in the main document.
        </p>

        <BrowserOnly fallback={<div>Loading graph...</div>}>
          {() => {
            return <ForceGraphComponent graphData={graphData} />;
          }}
        </BrowserOnly>
      </div>
    </Layout>
  );
}
