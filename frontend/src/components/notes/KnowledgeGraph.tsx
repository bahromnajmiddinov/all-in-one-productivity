import { useEffect, useRef, useState } from 'react';
import type { NoteGraphData, NoteGraphNode } from '../../types/notes';

interface Props {
  data: NoteGraphData;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

interface SimulationNode extends NoteGraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function KnowledgeGraph({ data, onNodeClick, selectedNodeId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<SimulationNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationRef = useRef<number>();

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    if (!data.nodes.length) return;

    // Initialize node positions
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const simulationNodes: SimulationNode[] = data.nodes.map((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: Math.max(6, Math.min(20, 8 + node.link_count * 2)),
      };
    });

    setNodes(simulationNodes);

    // Simple force simulation
    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = [...prevNodes];
        
        // Repulsion between nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            if (dist < 100) {
              const force = 50 / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              
              newNodes[i].vx -= fx;
              newNodes[i].vy -= fy;
              newNodes[j].vx += fx;
              newNodes[j].vy += fy;
            }
          }
        }
        
        // Attraction along edges
        data.edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          
          if (source && target) {
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const force = (dist - 100) * 0.01;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            source.vx += fx;
            source.vy += fy;
            target.vx -= fx;
            target.vy -= fy;
          }
        });
        
        // Center gravity
        newNodes.forEach(node => {
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;
          
          // Damping
          node.vx *= 0.9;
          node.vy *= 0.9;
          
          // Update position
          node.x += node.vx;
          node.y += node.vy;
          
          // Boundary constraints
          node.x = Math.max(node.radius, Math.min(dimensions.width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(dimensions.height - node.radius, node.y));
        });
        
        return newNodes;
      });
      
      animationRef.current = requestAnimationFrame(simulate);
    };
    
    animationRef.current = requestAnimationFrame(simulate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, dimensions.width, dimensions.height]);

  const getNoteTypeColor = (noteType: string) => {
    const colors: Record<string, string> = {
      text: '#3B82F6',
      markdown: '#8B5CF6',
      checklist: '#10B981',
      code: '#F59E0B',
      voice: '#EF4444',
      web_clip: '#06B6D4',
    };
    return colors[noteType] || '#6B7280';
  };

  return (
    <div className="w-full h-full bg-bg-subtle rounded-lg border border-border overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Edges */}
        {data.edges.map(edge => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (!source || !target) return null;
          
          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="#D1D5DB"
              strokeWidth={1}
              opacity={0.6}
            />
          );
        })}
        
        {/* Nodes */}
        {nodes.map(node => (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            className="cursor-pointer"
            onClick={() => onNodeClick?.(node.id)}
          >
            <circle
              r={node.radius}
              fill={getNoteTypeColor(node.note_type)}
              stroke={selectedNodeId === node.id ? '#1F2937' : 'white'}
              strokeWidth={selectedNodeId === node.id ? 3 : 2}
              className="transition-all hover:scale-110"
            />
            {node.is_favorite && (
              <text
                x={node.radius - 2}
                y={-node.radius + 8}
                fontSize={10}
              >
                ⭐
              </text>
            )}
            <text
              y={node.radius + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#374151"
              className="pointer-events-none"
              style={{ maxWidth: 80 }}
            >
              {node.title.length > 20 ? node.title.slice(0, 20) + '...' : node.title}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-sm border border-border">
        <h4 className="text-xs font-medium mb-2">Note Types</h4>
        <div className="space-y-1">
          {Object.entries({
            text: 'Text',
            markdown: 'Markdown',
            checklist: 'Checklist',
            code: 'Code',
            voice: 'Voice',
            web_clip: 'Web Clip',
          }).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getNoteTypeColor(type) }}
              />
              <span className="text-xs text-fg-subtle">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
