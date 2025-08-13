import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { gebaeudeApi, produktionenApi, Gebaeude, Produktion } from '@/lib/api';

export function GebaeudeManager() {
  const [gebaeude, setGebaeude] = useState<Gebaeude[]>([]);
  const [produktionen, setProduktionen] = useState<Produktion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGebaeude, setEditingGebaeude] = useState<Gebaeude | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    building_costs_per_month: '',
    production_ids: [] as string[]
  });

  useEffect(() => {
    loadGebaeude();
    loadProduktionen();
  }, []);

  const loadGebaeude = async () => {
    try {
      const data = await gebaeudeApi.getAll();
      setGebaeude(data);
    } catch (error) {
      console.error('Error loading gebaeude:', error);
    }
  };

  const loadProduktionen = async () => {
    try {
      const data = await produktionenApi.getAll();
      setProduktionen(data);
    } catch (error) {
      console.error('Error loading produktionen:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gebaeudeData = {
        name: formData.name,
        building_costs_per_month: parseFloat(formData.building_costs_per_month) || 0,
        production_ids: formData.production_ids
      };

      if (editingGebaeude) {
        await gebaeudeApi.update(editingGebaeude.id, gebaeudeData);
      } else {
        await gebaeudeApi.create(gebaeudeData);
      }

      await loadGebaeude();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving gebaeude:', error);
    }
  };

  const handleEdit = (gebaeude: Gebaeude) => {
    setEditingGebaeude(gebaeude);
    setFormData({
      name: gebaeude.name,
      building_costs_per_month: gebaeude.building_costs_per_month.toString(),
      production_ids: gebaeude.productions.map(p => p.id)
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie dieses Gebäude löschen möchten?')) {
      try {
        await gebaeudeApi.delete(id);
        await loadGebaeude();
      } catch (error) {
        console.error('Error deleting gebaeude:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      building_costs_per_month: '',
      production_ids: []
    });
    setEditingGebaeude(null);
  };

  const handleProductionToggle = (productionId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        production_ids: [...formData.production_ids, productionId]
      });
    } else {
      setFormData({
        ...formData,
        production_ids: formData.production_ids.filter(id => id !== productionId)
      });
    }
  };

  const calculateTotalCosts = (gebaeude: Gebaeude) => {
    const buildingCosts = gebaeude.building_costs_per_month;
    const productionCosts = gebaeude.productions.reduce(
      (sum, prod) => sum + prod.fixed_costs_per_month,
      0
    );
    return buildingCosts + productionCosts;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gebäude Verwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Gebäude und zugeordnete Produktionen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Gebäude Liste</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neues Gebäude
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGebaeude ? 'Gebäude bearbeiten' : 'Neues Gebäude erstellen'}
                </DialogTitle>
                <DialogDescription>
                  Definieren Sie das Gebäude und ordnen Sie Produktionen zu
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="costs">Gebäudekosten/Monat (€)</Label>
                      <Input
                        id="costs"
                        type="number"
                        step="0.01"
                        value={formData.building_costs_per_month}
                        onChange={(e) => setFormData({ ...formData, building_costs_per_month: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Zugeordnete Produktionen</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                      {produktionen.map((produktion) => (
                        <div key={produktion.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={produktion.id}
                            checked={formData.production_ids.includes(produktion.id)}
                            onCheckedChange={(checked) => 
                              handleProductionToggle(produktion.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={produktion.id} className="text-sm">
                            {produktion.name} (€{produktion.fixed_costs_per_month}/Monat)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editingGebaeude ? 'Aktualisieren' : 'Erstellen'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gebäudekosten/Monat</TableHead>
              <TableHead>Produktionen</TableHead>
              <TableHead>Gesamtkosten/Monat</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gebaeude.map((building) => (
              <TableRow key={building.id}>
                <TableCell className="font-medium">{building.name}</TableCell>
                <TableCell>€{building.building_costs_per_month.toFixed(2)}</TableCell>
                <TableCell>
                  {building.productions.map((prod, index) => (
                    <div key={index} className="text-sm">
                      {prod.name}
                    </div>
                  ))}
                </TableCell>
                <TableCell>€{calculateTotalCosts(building).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(building)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(building.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
