import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { produktionenApi, warenApi, Produktion, Ware } from '@/lib/api';

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
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (produktionen.length > 0 && waren.length > 0) {
      generateGraph();
    }
  }, [produktionen, waren]);

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

  const generateGraph = () => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const nodePositions = new Map<string, { x: number; y: number }>();

    waren.forEach((ware, index) => {
      const x = 100 + (index % 5) * 200;
      const y = 100 + Math.floor(index / 5) * 150;
      nodePositions.set(`good-${ware.id}`, { x, y });
      newNodes.push({
        id: `good-${ware.id}`,
        type: 'good',
        name: ware.name,
        x,
        y,
        data: ware
      });
    });

    produktionen.forEach((produktion, index) => {
      const x = 150 + (index % 4) * 250;
      const y = 200 + Math.floor(index / 4) * 200;
      nodePositions.set(`production-${produktion.id}`, { x, y });
      newNodes.push({
        id: `production-${produktion.id}`,
        type: 'production',
        name: produktion.name,
        x,
        y,
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

  const getNodeColor = (node: Node) => {
    if (node.type === 'good') {
      return '#3b82f6'; // Blue for goods
    } else {
      return '#10b981'; // Green for productions
    }
  };

  const renderTooltip = (node: Node) => {
    if (node.type === 'good') {
      const ware = node.data as Ware;
      return (
        <div className="absolute bg-white border rounded shadow-lg p-2 text-sm z-10">
          <div className="font-semibold">{ware.name}</div>
          <div>Einheit: {ware.unit}</div>
          <div>Preis: €{ware.price_per_1000l}/1000L</div>
          {ware.density && <div>Dichte: {ware.density}</div>}
        </div>
      );
    } else {
      const produktion = node.data as Produktion;
      return (
        <div className="absolute bg-white border rounded shadow-lg p-2 text-sm z-10">
          <div className="font-semibold">{produktion.name}</div>
          <div>Zyklen/Monat: {produktion.cycles_per_month}</div>
          <div>Fixkosten: €{produktion.fixed_costs_per_month}/Monat</div>
          <div>Variable Kosten: €{produktion.variable_costs_per_cycle}/Zyklus</div>
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
          >
            {/* Render edges */}
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              return (
                <g key={index}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#6b7280"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Render nodes */}
            {nodes.map((node) => (
              <g key={node.id} onClick={() => handleNodeClick(node)} style={{ cursor: 'pointer' }}>
                {node.type === 'good' ? (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill={getNodeColor(node)}
                    stroke="#1f2937"
                    strokeWidth="2"
                  />
                ) : (
                  <rect
                    x={node.x - 25}
                    y={node.y - 15}
                    width="50"
                    height="30"
                    fill={getNodeColor(node)}
                    stroke="#1f2937"
                    strokeWidth="2"
                    rx="5"
                  />
                )}
                <text
                  x={node.x}
                  y={node.y + 35}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#1f2937"
                  className="font-medium"
                >
                  {node.name.length > 10 ? node.name.substring(0, 10) + '...' : node.name}
                </text>
              </g>
            ))}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
          </svg>

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
        </div>
      </CardContent>
    </Card>
  );
}
