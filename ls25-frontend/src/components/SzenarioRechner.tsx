import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { warenApi, produktionenApi, calculationApi, Ware, Produktion, ChainCalculationResult, RevenueCalculationResult } from '@/lib/api';

export function SzenarioRechner() {
  const [waren, setWaren] = useState<Ware[]>([]);
  const [produktionen, setProduktionen] = useState<Produktion[]>([]);
  const [selectedGood, setSelectedGood] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [runtimeMonths, setRuntimeMonths] = useState<string>('1');
  const [continueToEnd, setContinueToEnd] = useState(true);
  const [chainResults, setChainResults] = useState<ChainCalculationResult[]>([]);
  const [revenueResults, setRevenueResults] = useState<RevenueCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [warenData, produktionenData] = await Promise.all([
        warenApi.getAll(),
        produktionenApi.getAll()
      ]);
      setWaren(warenData);
      setProduktionen(produktionenData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCalculate = async () => {
    if (!selectedGood || !quantity) return;

    setIsCalculating(true);
    try {
      const chainData = await calculationApi.calculateChain(
        selectedGood,
        parseFloat(quantity)
      );
      setChainResults(chainData);

      const productionIds = getProductionIdsFromChain(chainData);
      if (productionIds.length > 0) {
        const revenueData = await calculationApi.calculateRevenue(
          productionIds,
          parseFloat(runtimeMonths)
        );
        setRevenueResults(revenueData);
      } else {
        setRevenueResults(null);
      }
    } catch (error) {
      console.error('Error calculating scenario:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getProductionIdsFromChain = (results: ChainCalculationResult[]): string[] => {
    return produktionen.map(p => p.id);
  };

  const getGoodName = (goodId: string): string => {
    const good = waren.find(w => w.id === goodId);
    return good ? good.name : 'Unbekannt';
  };

  const getGoodPrice = (goodId: string): number => {
    const good = waren.find(w => w.id === goodId);
    return good ? good.price_per_1000l : 0;
  };

  const calculateValue = (result: ChainCalculationResult): number => {
    const price = getGoodPrice(result.good_id);
    return (result.quantity * price) / 1000; // Convert from per 1000L to actual quantity
  };

  const groupResultsByStage = (results: ChainCalculationResult[]) => {
    const grouped = results.reduce((acc, result) => {
      if (!acc[result.stage]) {
        acc[result.stage] = [];
      }
      acc[result.stage].push(result);
      return acc;
    }, {} as Record<number, ChainCalculationResult[]>);

    return Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szenario-Rechner</CardTitle>
        <CardDescription>
          Berechnen Sie Produktionsketten und Erlöse basierend auf Lagerbeständen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eingabe Parameter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="good-select">Startware</Label>
                <Select value={selectedGood} onValueChange={setSelectedGood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ware auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {waren.map((ware) => (
                      <SelectItem key={ware.id} value={ware.id}>
                        {ware.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Menge</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Verfügbare Menge eingeben"
                />
              </div>

              <div>
                <Label htmlFor="runtime">Laufzeit (Monate)</Label>
                <Input
                  id="runtime"
                  type="number"
                  step="0.1"
                  value={runtimeMonths}
                  onChange={(e) => setRuntimeMonths(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="continue-end"
                  checked={continueToEnd}
                  onCheckedChange={setContinueToEnd}
                />
                <Label htmlFor="continue-end">Bis Endprodukt fortsetzen</Label>
              </div>

              <Button 
                onClick={handleCalculate} 
                disabled={!selectedGood || !quantity || isCalculating}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isCalculating ? 'Berechne...' : 'Berechnen'}
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          {revenueResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Erlös Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">Bruttoerlös</span>
                    <span className="text-green-600 font-bold">
                      <TrendingUp className="h-4 w-4 inline mr-1" />
                      €{revenueResults.gross_revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="font-medium">Produktionskosten</span>
                    <span className="text-red-600 font-bold">
                      <TrendingDown className="h-4 w-4 inline mr-1" />
                      €{revenueResults.production_costs.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border-2 border-blue-200">
                    <span className="font-bold">Nettoerlös</span>
                    <span className={`font-bold text-lg ${
                      revenueResults.net_revenue >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      €{revenueResults.net_revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        {chainResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Produktionskette Ergebnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {groupResultsByStage(chainResults).map(([stage, results]) => (
                  <div key={stage}>
                    <h4 className="font-semibold mb-2">Stufe {stage}</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ware</TableHead>
                          <TableHead>Menge</TableHead>
                          <TableHead>Preis (€/1000L)</TableHead>
                          <TableHead>Wert (€)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {result.good_name}
                            </TableCell>
                            <TableCell>
                              {result.quantity.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €{getGoodPrice(result.good_id).toFixed(2)}
                            </TableCell>
                            <TableCell className="font-medium">
                              €{calculateValue(result).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>

              {/* Total Value Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Gesamtwert aller Produkte:</span>
                  <span className="text-xl font-bold text-blue-600">
                    €{chainResults.reduce((sum, result) => sum + calculateValue(result), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
