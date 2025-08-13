import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { produktionenApi, warenApi, Produktion, Ware } from '@/lib/api';

export function ProduktionenManager() {
  const [produktionen, setProduktionen] = useState<Produktion[]>([]);
  const [waren, setWaren] = useState<Ware[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduktion, setEditingProduktion] = useState<Produktion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cycles_per_month: '',
    fixed_costs_per_month: '',
    variable_costs_per_cycle: '',
    inputs: [{ good_id: '', quantity_per_cycle: '' }],
    outputs: [{ good_id: '', quantity_per_cycle: '' }]
  });

  useEffect(() => {
    loadProduktionen();
    loadWaren();
  }, []);

  const loadProduktionen = async () => {
    try {
      const data = await produktionenApi.getAll();
      setProduktionen(data);
    } catch (error) {
      console.error('Error loading produktionen:', error);
    }
  };

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
      const produktionData = {
        name: formData.name,
        description: formData.description,
        cycles_per_month: parseFloat(formData.cycles_per_month),
        fixed_costs_per_month: parseFloat(formData.fixed_costs_per_month) || 0,
        variable_costs_per_cycle: parseFloat(formData.variable_costs_per_cycle) || 0,
        inputs: formData.inputs
          .filter(input => input.good_id && input.quantity_per_cycle)
          .map(input => ({
            good_id: input.good_id,
            quantity_per_cycle: parseFloat(input.quantity_per_cycle)
          })),
        outputs: formData.outputs
          .filter(output => output.good_id && output.quantity_per_cycle)
          .map(output => ({
            good_id: output.good_id,
            quantity_per_cycle: parseFloat(output.quantity_per_cycle)
          }))
      };

      if (editingProduktion) {
        await produktionenApi.update(editingProduktion.id, produktionData);
      } else {
        await produktionenApi.create(produktionData);
      }

      await loadProduktionen();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving produktion:', error);
    }
  };

  const handleEdit = (produktion: Produktion) => {
    setEditingProduktion(produktion);
    setFormData({
      name: produktion.name,
      description: produktion.description,
      cycles_per_month: produktion.cycles_per_month.toString(),
      fixed_costs_per_month: produktion.fixed_costs_per_month.toString(),
      variable_costs_per_cycle: produktion.variable_costs_per_cycle.toString(),
      inputs: produktion.inputs.length > 0 
        ? produktion.inputs.map(input => ({
            good_id: input.good_id,
            quantity_per_cycle: input.quantity_per_cycle.toString()
          }))
        : [{ good_id: '', quantity_per_cycle: '' }],
      outputs: produktion.outputs.length > 0
        ? produktion.outputs.map(output => ({
            good_id: output.good_id,
            quantity_per_cycle: output.quantity_per_cycle.toString()
          }))
        : [{ good_id: '', quantity_per_cycle: '' }]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diese Produktion löschen möchten?')) {
      try {
        await produktionenApi.delete(id);
        await loadProduktionen();
      } catch (error) {
        console.error('Error deleting produktion:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cycles_per_month: '',
      fixed_costs_per_month: '',
      variable_costs_per_cycle: '',
      inputs: [{ good_id: '', quantity_per_cycle: '' }],
      outputs: [{ good_id: '', quantity_per_cycle: '' }]
    });
    setEditingProduktion(null);
  };

  const addInput = () => {
    setFormData({
      ...formData,
      inputs: [...formData.inputs, { good_id: '', quantity_per_cycle: '' }]
    });
  };

  const removeInput = (index: number) => {
    setFormData({
      ...formData,
      inputs: formData.inputs.filter((_, i) => i !== index)
    });
  };

  const addOutput = () => {
    setFormData({
      ...formData,
      outputs: [...formData.outputs, { good_id: '', quantity_per_cycle: '' }]
    });
  };

  const removeOutput = (index: number) => {
    setFormData({
      ...formData,
      outputs: formData.outputs.filter((_, i) => i !== index)
    });
  };

  const updateInput = (index: number, field: string, value: string) => {
    const newInputs = [...formData.inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setFormData({ ...formData, inputs: newInputs });
  };

  const updateOutput = (index: number, field: string, value: string) => {
    const newOutputs = [...formData.outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setFormData({ ...formData, outputs: newOutputs });
  };

  const getWareName = (id: string) => {
    const ware = waren.find(w => w.id === id);
    return ware ? ware.name : 'Unbekannt';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produktionen Verwaltung</CardTitle>
        <CardDescription>
          Verwalten Sie Ihre Produktionsrezepte mit Ein- und Ausgängen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Produktionen Liste</h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Produktion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduktion ? 'Produktion bearbeiten' : 'Neue Produktion erstellen'}
                </DialogTitle>
                <DialogDescription>
                  Definieren Sie die Produktionsparameter und Ein-/Ausgänge
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
                      <Label htmlFor="cycles">Zyklen/Monat</Label>
                      <Input
                        id="cycles"
                        type="number"
                        step="0.01"
                        value={formData.cycles_per_month}
                        onChange={(e) => setFormData({ ...formData, cycles_per_month: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fixed-costs">Fixkosten/Monat (€)</Label>
                      <Input
                        id="fixed-costs"
                        type="number"
                        step="0.01"
                        value={formData.fixed_costs_per_month}
                        onChange={(e) => setFormData({ ...formData, fixed_costs_per_month: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="variable-costs">Variable Kosten/Zyklus (€)</Label>
                      <Input
                        id="variable-costs"
                        type="number"
                        step="0.01"
                        value={formData.variable_costs_per_cycle}
                        onChange={(e) => setFormData({ ...formData, variable_costs_per_cycle: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Eingänge</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addInput}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.inputs.map((input, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Select
                          value={input.good_id}
                          onValueChange={(value) => updateInput(index, 'good_id', value)}
                        >
                          <SelectTrigger className="flex-1">
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Menge/Zyklus"
                          value={input.quantity_per_cycle}
                          onChange={(e) => updateInput(index, 'quantity_per_cycle', e.target.value)}
                          className="w-32"
                        />
                        {formData.inputs.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeInput(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Ausgänge</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOutput}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.outputs.map((output, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Select
                          value={output.good_id}
                          onValueChange={(value) => updateOutput(index, 'good_id', value)}
                        >
                          <SelectTrigger className="flex-1">
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
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Menge/Zyklus"
                          value={output.quantity_per_cycle}
                          onChange={(e) => updateOutput(index, 'quantity_per_cycle', e.target.value)}
                          className="w-32"
                        />
                        {formData.outputs.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOutput(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editingProduktion ? 'Aktualisieren' : 'Erstellen'}
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
              <TableHead>Zyklen/Monat</TableHead>
              <TableHead>Fixkosten/Monat</TableHead>
              <TableHead>Eingänge</TableHead>
              <TableHead>Ausgänge</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produktionen.map((produktion) => (
              <TableRow key={produktion.id}>
                <TableCell className="font-medium">{produktion.name}</TableCell>
                <TableCell>{produktion.cycles_per_month}</TableCell>
                <TableCell>€{produktion.fixed_costs_per_month.toFixed(2)}</TableCell>
                <TableCell>
                  {produktion.inputs.map((input, index) => (
                    <div key={index} className="text-sm">
                      {getWareName(input.good_id)}: {input.quantity_per_cycle}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  {produktion.outputs.map((output, index) => (
                    <div key={index} className="text-sm">
                      {getWareName(output.good_id)}: {output.quantity_per_cycle}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(produktion)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(produktion.id)}
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
