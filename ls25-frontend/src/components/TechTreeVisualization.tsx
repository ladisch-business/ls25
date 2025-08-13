import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { produktionenApi, warenApi, calculationApi, Produktion, Ware } from '@/lib/api';

interface Node {
  id: string;
  type: 'good' | 'production';
  name: string;
  x: number;
  y: number;
  data?: any;
}

interface Edge {
  from: string;
  to: string;
  quantity: number;
  label: string;
}

export function TechTreeVisualization() {
  const [produktionen, setProduktionen] = useState<Produktion[]>([]);
  const [waren, setWaren] = useState<Ware[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showCapacity, setShowCapacity] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [capacityData, setCapacityData] = useState<Map<string, any>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (produktionen.length > 0 && waren.length > 0) {
      generateGraph();
    }
  }, [produktionen, waren]);

  useEffect(() => {
    if (showCapacity && produktionen.length > 0) {
      loadCapacityData();
    }
  }, [showCapacity, produktionen]);

  const loadData = async () => {
    try {
      const [produktionenData, warenData] = await Promise.all([
        produktionenApi.getAll(),
        warenApi.getAll()
      ]);
      setProduktionen(produktionenData);
      setWaren(warenData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCapacityData = async () => {
    try {
      const capacityMap = new Map();
      for (const produktion of produktionen) {
        const capacity = await calculationApi.getCapacityAnalysis(produktion.id);
        capacityMap.set(produktion.id, capacity);
      }
      setCapacityData(capacityMap);
    } catch (error) {
      console.error('Error loading capacity data:', error);
    }
  };

  const generateGraph = () => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    const dependencyMap = new Map<string, Set<string>>();
    const reverseDependencyMap = new Map<string, Set<string>>();
    
    waren.forEach(ware => {
      dependencyMap.set(ware.id, new Set());
      reverseDependencyMap.set(ware.id, new Set());
    });
    
    produktionen.forEach(produktion => {
      produktion.inputs.forEach(input => {
        produktion.outputs.forEach(output => {
          dependencyMap.get(output.good_id)?.add(input.good_id);
          reverseDependencyMap.get(input.good_id)?.add(output.good_id);
        });
      });
    });
    
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    const calculateLevel = (goodId: string): number => {
      if (visited.has(goodId)) return levels.get(goodId) || 0;
      visited.add(goodId);
      
      const dependencies = dependencyMap.get(goodId);
      if (!dependencies || dependencies.size === 0) {
        levels.set(goodId, 0);
        return 0;
      }
      
      let maxLevel = 0;
      dependencies.forEach(depId => {
        maxLevel = Math.max(maxLevel, calculateLevel(depId) + 1);
      });
      
      levels.set(goodId, maxLevel);
      return maxLevel;
    };
    
    waren.forEach(ware => calculateLevel(ware.id));
    
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, goodId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)?.push(goodId);
    });
    
    const levelHeight = 120;
    const nodeSpacing = 180;
    const startY = 80;
    
    levelGroups.forEach((goodIds, level) => {
      const y = startY + level * levelHeight;
      const totalWidth = (goodIds.length - 1) * nodeSpacing;
      const startX = (1200 - totalWidth) / 2;
      
      goodIds.forEach((goodId, index) => {
        const ware = waren.find(w => w.id === goodId);
        if (ware) {
          const x = startX + index * nodeSpacing;
          newNodes.push({
            id: `good-${ware.id}`,
            type: 'good',
            name: ware.name,
            x,
            y,
            data: ware
          });
        }
      });
    });
    
    produktionen.forEach(produktion => {
      const inputLevels = produktion.inputs.map(input => levels.get(input.good_id) || 0);
      const outputLevels = produktion.outputs.map(output => levels.get(output.good_id) || 0);
      
      const avgInputLevel = inputLevels.reduce((sum, level) => sum + level, 0) / inputLevels.length;
      const avgOutputLevel = outputLevels.reduce((sum, level) => sum + level, 0) / outputLevels.length;
      const productionLevel = (avgInputLevel + avgOutputLevel) / 2;
      
      const inputNodes = produktion.inputs.map(input => 
        newNodes.find(n => n.id === `good-${input.good_id}`)
      ).filter(Boolean);
      const outputNodes = produktion.outputs.map(output => 
        newNodes.find(n => n.id === `good-${output.good_id}`)
      ).filter(Boolean);
      
      const allRelatedNodes = [...inputNodes, ...outputNodes];
      const avgX = allRelatedNodes.reduce((sum, node) => sum + (node?.x || 0), 0) / allRelatedNodes.length;
      
      newNodes.push({
        id: `production-${produktion.id}`,
        type: 'production',
        name: produktion.name,
        x: avgX,
        y: startY + productionLevel * levelHeight,
        data: produktion
      });
      
      produktion.inputs.forEach(input => {
        newEdges.push({
          from: `good-${input.good_id}`,
          to: `production-${produktion.id}`,
          quantity: input.quantity_per_cycle,
          label: `${input.quantity_per_cycle}/Zyklus`
        });
      });

      produktion.outputs.forEach(output => {
        newEdges.push({
          from: `production-${produktion.id}`,
          to: `good-${output.good_id}`,
          quantity: output.quantity_per_cycle,
          label: `${output.quantity_per_cycle}/Zyklus`
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
  };

  const handleNodeMouseEnter = (node: Node, event: React.MouseEvent) => {
    setHoveredNode(node);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (hoveredNode) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const getNodeColor = (node: Node) => {
    if (node.type === 'good') {
      return '#3b82f6'; // Blue for goods
    } else {
      if (showCapacity && capacityData.has(node.data?.id)) {
        const capacity = capacityData.get(node.data.id);
        const utilizationPercent = Math.min(100, (capacity.inputs_per_month.length * 20)); // Simple utilization calculation
        if (utilizationPercent > 80) return '#ef4444'; // Red for high utilization
        if (utilizationPercent > 60) return '#f59e0b'; // Orange for medium utilization
        return '#10b981'; // Green for low utilization
      }
      return '#10b981'; // Green for productions
    }
  };

  const renderTooltip = (node: Node) => {
    if (!hoveredNode || hoveredNode.id !== node.id) return null;

    if (node.type === 'good') {
      const ware = node.data as Ware;
      return (
        <div 
          className="fixed bg-white border rounded shadow-lg p-3 text-sm z-50 pointer-events-none"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 10,
            maxWidth: '250px'
          }}
        >
          <div className="font-semibold text-blue-600">{ware.name}</div>
          <div className="mt-1 space-y-1">
            <div>Einheit: {ware.unit}</div>
            <div>Preis: €{ware.price_per_1000l.toFixed(2)}/1000L</div>
            {ware.density && <div>Dichte: {ware.density}</div>}
          </div>
        </div>
      );
    } else {
      const produktion = node.data as Produktion;
      const capacity = capacityData.get(produktion.id);
      return (
        <div 
          className="fixed bg-white border rounded shadow-lg p-3 text-sm z-50 pointer-events-none"
          style={{ 
            left: mousePosition.x + 10, 
            top: mousePosition.y - 10,
            maxWidth: '300px'
          }}
        >
          <div className="font-semibold text-green-600">{produktion.name}</div>
          <div className="mt-1 space-y-1">
            <div>Zyklen/Monat: {produktion.cycles_per_month}</div>
            <div>Fixkosten: €{produktion.fixed_costs_per_month}/Monat</div>
            <div>Variable Kosten: €{produktion.variable_costs_per_cycle}/Zyklus</div>
            {showCapacity && capacity && (
              <div className="mt-2 pt-2 border-t">
                <div className="font-medium">Kapazitätsanalyse:</div>
                {capacity.inputs_per_month.map((input: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    {input.good_name}: {input.quantity.toFixed(1)} {input.unit}/Monat
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>TechTree Visualisierung</CardTitle>
        <CardDescription>
          Interaktive Darstellung der Produktionsketten
        </CardDescription>
        <div className="flex items-center space-x-2">
          <Switch
            id="capacity-mode"
            checked={showCapacity}
            onCheckedChange={setShowCapacity}
          />
          <Label htmlFor="capacity-mode">Auslastungs-Overlay anzeigen</Label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg
            ref={svgRef}
            width="100%"
            height="600"
            viewBox="0 0 1200 600"
            className="border rounded"
            onMouseMove={handleMouseMove}
          >
            {/* Render edges */}
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const fromY = fromNode.type === 'good' ? fromNode.y + 20 : fromNode.y + 15;
              const toY = toNode.type === 'good' ? toNode.y - 20 : toNode.y - 15;
              
              const midY = (fromY + toY) / 2;
              const pathData = `M ${fromNode.x} ${fromY} Q ${fromNode.x} ${midY} ${(fromNode.x + toNode.x) / 2} ${midY} Q ${toNode.x} ${midY} ${toNode.x} ${toY}`;

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    stroke="#4b5563"
                    strokeWidth="3"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    opacity="0.8"
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={midY - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                    className="font-medium"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Render nodes */}
            {nodes.map((node) => (
              <g 
                key={node.id} 
                onClick={() => handleNodeClick(node)} 
                onMouseEnter={(e) => handleNodeMouseEnter(node, e as any)}
                onMouseLeave={handleNodeMouseLeave}
                style={{ cursor: 'pointer' }}
              >
                {node.type === 'good' ? (
                  <rect
                    x={node.x - 35}
                    y={node.y - 20}
                    width="70"
                    height="40"
                    fill={getNodeColor(node)}
                    stroke="#1f2937"
                    strokeWidth="2"
                    rx="8"
                    opacity={hoveredNode?.id === node.id ? 0.9 : 1}
                  />
                ) : (
                  <rect
                    x={node.x - 40}
                    y={node.y - 20}
                    width="80"
                    height="40"
                    fill={getNodeColor(node)}
                    stroke="#1f2937"
                    strokeWidth="2"
                    rx="8"
                    opacity={hoveredNode?.id === node.id ? 0.9 : 1}
                  />
                )}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill="white"
                  className="font-semibold"
                >
                  {node.name.length > 8 ? node.name.substring(0, 8) + '...' : node.name}
                </text>
                {showCapacity && node.type === 'production' && capacityData.has(node.data?.id) && (
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6b7280"
                    className="font-medium"
                  >
                    Auslastung
                  </text>
                )}
              </g>
            ))}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="12"
                markerHeight="8"
                refX="11"
                refY="4"
                orient="auto"
              >
                <polygon
                  points="0 0, 12 4, 0 8"
                  fill="#4b5563"
                />
              </marker>
            </defs>
          </svg>

          {/* Render tooltip */}
          {hoveredNode && renderTooltip(hoveredNode)}

          {/* Node details panel */}
          {selectedNode && (
            <div className="absolute top-4 right-4 bg-white border rounded shadow-lg p-4 w-64">
              <h4 className="font-semibold mb-2">{selectedNode.name}</h4>
              {selectedNode.type === 'good' ? (
                <div className="space-y-1 text-sm">
                  <div>Typ: Ware</div>
                  <div>Einheit: {(selectedNode.data as Ware).unit}</div>
                  <div>Preis: €{(selectedNode.data as Ware).price_per_1000l}/1000L</div>
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <div>Typ: Produktion</div>
                  <div>Zyklen/Monat: {(selectedNode.data as Produktion).cycles_per_month}</div>
                  <div>Fixkosten: €{(selectedNode.data as Produktion).fixed_costs_per_month}/Monat</div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setSelectedNode(null)}
              >
                Schließen
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Waren</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Produktionen</span>
          </div>
          {showCapacity && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Hohe Auslastung</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>Mittlere Auslastung</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
