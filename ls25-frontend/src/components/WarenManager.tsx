import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { warenApi, Ware } from '@/lib/api';

export function WarenManager() {
  const [waren, setWaren] = useState<Ware[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWare, setEditingWare] = useState<Ware | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'Liter',
    density: '',
    price_per_1000l: ''
  });

  useEffect(() => {
    loadWaren();
  }, []);

  const loadWaren = async () => {
    try {
      const data = await warenApi.getAll();
      setWaren(data);
    } catch (error) {
      console.error('Error loading waren:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const wareData = {
        name: formData.name,
        unit: formData.unit,
        density: formData.density ? parseFloat(formData.density) : undefined,
        price_per_1000l: parseFloat(formData.price_per_1000l) || 0
      };

      if (editingWare) {
        await warenApi.update(editingWare.id, wareData);
      } else {
        await warenApi.create(wareData);
      }

      await loadWaren();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving ware:', error);
    }
  };

  const handleEdit = (ware: Ware) => {
    setEditingWare(ware);
    setFormData({
      name: ware.name,
      unit: ware.unit,
      density: ware.density?.toString() || '',
      price_per_1000l: ware.price_per_1000l.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Ware löschen möchten?')) {
      try {
        await warenApi.delete(id);
        await loadWaren();
      } catch (error) {
        console.error('Error deleting ware:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'Liter',
      density: '',
      price_per_1000l: ''
    });
    setEditingWare(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waren Verwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Waren mit Preisen und Eigenschaften
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Waren Liste</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Ware
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWare ? 'Ware bearbeiten' : 'Neue Ware erstellen'}
                </DialogTitle>
                <DialogDescription>
                  Geben Sie die Details für die Ware ein
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">
                      Einheit
                    </Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="density" className="text-right">
                      Dichte
                    </Label>
                    <Input
                      id="density"
                      type="number"
                      step="0.01"
                      value={formData.density}
                      onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                      className="col-span-3"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Preis (€/1000L)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price_per_1000l}
                      onChange={(e) => setFormData({ ...formData, price_per_1000l: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editingWare ? 'Aktualisieren' : 'Erstellen'}
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
              <TableHead>Einheit</TableHead>
              <TableHead>Dichte</TableHead>
              <TableHead>Preis (€/1000L)</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {waren.map((ware) => (
              <TableRow key={ware.id}>
                <TableCell className="font-medium">{ware.name}</TableCell>
                <TableCell>{ware.unit}</TableCell>
                <TableCell>{ware.density || '-'}</TableCell>
                <TableCell>€{ware.price_per_1000l.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ware)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ware.id)}
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
