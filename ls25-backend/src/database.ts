import { v4 as uuidv4 } from 'uuid';
import { Ware, Produktion, Gebaeude, ProductionInput, ProductionOutput } from './types';

class InMemoryDatabase {
  private waren: Map<string, Ware> = new Map();
  private produktionen: Map<string, Produktion> = new Map();
  private gebaeude: Map<string, Gebaeude> = new Map();
  private productionInputs: Map<string, ProductionInput> = new Map();
  private productionOutputs: Map<string, ProductionOutput> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const weizenId = uuidv4();
    const mehlId = uuidv4();
    const brotId = uuidv4();

    const weizen: Ware = {
      id: weizenId,
      name: 'Weizen',
      unit: 'Liter',
      density: 0.8,
      price_per_1000l: 500
    };

    const mehl: Ware = {
      id: mehlId,
      name: 'Mehl',
      unit: 'Liter',
      density: 0.6,
      price_per_1000l: 800
    };

    const brot: Ware = {
      id: brotId,
      name: 'Brot',
      unit: 'Stück',
      price_per_1000l: 2000
    };

    this.waren.set(weizenId, weizen);
    this.waren.set(mehlId, mehl);
    this.waren.set(brotId, brot);

    const mehlProduktionId = uuidv4();
    const brotProduktionId = uuidv4();

    const mehlProduktion: Produktion = {
      id: mehlProduktionId,
      name: 'Mehl Produktion',
      description: 'Weizen zu Mehl verarbeiten',
      cycles_per_month: 100,
      fixed_costs_per_month: 1000,
      variable_costs_per_cycle: 10,
      inputs: [],
      outputs: []
    };

    const brotProduktion: Produktion = {
      id: brotProduktionId,
      name: 'Brot Produktion',
      description: 'Mehl zu Brot verarbeiten',
      cycles_per_month: 80,
      fixed_costs_per_month: 1500,
      variable_costs_per_cycle: 15,
      inputs: [],
      outputs: []
    };

    const mehlInput: ProductionInput = {
      id: uuidv4(),
      production_id: mehlProduktionId,
      good_id: weizenId,
      quantity_per_cycle: 100,
      good: weizen
    };

    const mehlOutput: ProductionOutput = {
      id: uuidv4(),
      production_id: mehlProduktionId,
      good_id: mehlId,
      quantity_per_cycle: 80,
      good: mehl
    };

    const brotInput: ProductionInput = {
      id: uuidv4(),
      production_id: brotProduktionId,
      good_id: mehlId,
      quantity_per_cycle: 50,
      good: mehl
    };

    const brotOutput: ProductionOutput = {
      id: uuidv4(),
      production_id: brotProduktionId,
      good_id: brotId,
      quantity_per_cycle: 40,
      good: brot
    };

    this.productionInputs.set(mehlInput.id, mehlInput);
    this.productionOutputs.set(mehlOutput.id, mehlOutput);
    this.productionInputs.set(brotInput.id, brotInput);
    this.productionOutputs.set(brotOutput.id, brotOutput);

    mehlProduktion.inputs = [mehlInput];
    mehlProduktion.outputs = [mehlOutput];
    brotProduktion.inputs = [brotInput];
    brotProduktion.outputs = [brotOutput];

    this.produktionen.set(mehlProduktionId, mehlProduktion);
    this.produktionen.set(brotProduktionId, brotProduktion);

    const muehleId = uuidv4();
    const baeckereiId = uuidv4();

    const muehle: Gebaeude = {
      id: muehleId,
      name: 'Mühle',
      building_costs_per_month: 500,
      productions: [mehlProduktion]
    };

    const baeckerei: Gebaeude = {
      id: baeckereiId,
      name: 'Bäckerei',
      building_costs_per_month: 800,
      productions: [brotProduktion]
    };

    this.gebaeude.set(muehleId, muehle);
    this.gebaeude.set(baeckereiId, baeckerei);
  }

  getAllWaren(): Ware[] {
    return Array.from(this.waren.values());
  }

  getWareById(id: string): Ware | undefined {
    return this.waren.get(id);
  }

  createWare(ware: Omit<Ware, 'id'>): Ware {
    const id = uuidv4();
    const newWare: Ware = { ...ware, id };
    this.waren.set(id, newWare);
    return newWare;
  }

  updateWare(id: string, ware: Partial<Ware>): Ware | undefined {
    const existing = this.waren.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...ware, id };
    this.waren.set(id, updated);
    return updated;
  }

  deleteWare(id: string): boolean {
    return this.waren.delete(id);
  }

  getAllProduktionen(): Produktion[] {
    return Array.from(this.produktionen.values()).map(p => ({
      ...p,
      inputs: this.getProductionInputs(p.id),
      outputs: this.getProductionOutputs(p.id)
    }));
  }

  getProduktionById(id: string): Produktion | undefined {
    const produktion = this.produktionen.get(id);
    if (!produktion) return undefined;
    
    return {
      ...produktion,
      inputs: this.getProductionInputs(id),
      outputs: this.getProductionOutputs(id)
    };
  }

  createProduktion(data: any): Produktion {
    const id = uuidv4();
    const produktion: Produktion = {
      id,
      name: data.name,
      description: data.description || '',
      cycles_per_month: data.cycles_per_month,
      fixed_costs_per_month: data.fixed_costs_per_month || 0,
      variable_costs_per_cycle: data.variable_costs_per_cycle || 0,
      inputs: [],
      outputs: []
    };

    this.produktionen.set(id, produktion);

    for (const inputData of data.inputs || []) {
      const input: ProductionInput = {
        id: uuidv4(),
        production_id: id,
        good_id: inputData.good_id,
        quantity_per_cycle: inputData.quantity_per_cycle,
        good: this.getWareById(inputData.good_id)
      };
      this.productionInputs.set(input.id, input);
    }

    for (const outputData of data.outputs || []) {
      const output: ProductionOutput = {
        id: uuidv4(),
        production_id: id,
        good_id: outputData.good_id,
        quantity_per_cycle: outputData.quantity_per_cycle,
        good: this.getWareById(outputData.good_id)
      };
      this.productionOutputs.set(output.id, output);
    }

    return this.getProduktionById(id)!;
  }

  updateProduktion(id: string, data: any): Produktion | undefined {
    const existing = this.produktionen.get(id);
    if (!existing) return undefined;

    const updated: Produktion = {
      ...existing,
      name: data.name,
      description: data.description || '',
      cycles_per_month: data.cycles_per_month,
      fixed_costs_per_month: data.fixed_costs_per_month || 0,
      variable_costs_per_cycle: data.variable_costs_per_cycle || 0,
      inputs: [],
      outputs: []
    };

    this.produktionen.set(id, updated);

    Array.from(this.productionInputs.values())
      .filter(input => input.production_id === id)
      .forEach(input => this.productionInputs.delete(input.id));

    Array.from(this.productionOutputs.values())
      .filter(output => output.production_id === id)
      .forEach(output => this.productionOutputs.delete(output.id));

    for (const inputData of data.inputs || []) {
      const input: ProductionInput = {
        id: uuidv4(),
        production_id: id,
        good_id: inputData.good_id,
        quantity_per_cycle: inputData.quantity_per_cycle,
        good: this.getWareById(inputData.good_id)
      };
      this.productionInputs.set(input.id, input);
    }

    for (const outputData of data.outputs || []) {
      const output: ProductionOutput = {
        id: uuidv4(),
        production_id: id,
        good_id: outputData.good_id,
        quantity_per_cycle: outputData.quantity_per_cycle,
        good: this.getWareById(outputData.good_id)
      };
      this.productionOutputs.set(output.id, output);
    }

    return this.getProduktionById(id)!;
  }

  deleteProduktion(id: string): boolean {
    Array.from(this.productionInputs.values())
      .filter(input => input.production_id === id)
      .forEach(input => this.productionInputs.delete(input.id));

    Array.from(this.productionOutputs.values())
      .filter(output => output.production_id === id)
      .forEach(output => this.productionOutputs.delete(output.id));

    return this.produktionen.delete(id);
  }

  getAllGebaeude(): Gebaeude[] {
    return Array.from(this.gebaeude.values()).map(g => ({
      ...g,
      productions: g.productions.map(p => this.getProduktionById(p.id)!).filter(Boolean)
    }));
  }

  getGebaeudeById(id: string): Gebaeude | undefined {
    const gebaeude = this.gebaeude.get(id);
    if (!gebaeude) return undefined;
    
    return {
      ...gebaeude,
      productions: gebaeude.productions.map(p => this.getProduktionById(p.id)!).filter(Boolean)
    };
  }

  createGebaeude(data: any): Gebaeude {
    const id = uuidv4();
    const productions = (data.production_ids || [])
      .map((pid: string) => this.getProduktionById(pid))
      .filter(Boolean);

    const gebaeude: Gebaeude = {
      id,
      name: data.name,
      building_costs_per_month: data.building_costs_per_month || 0,
      productions
    };

    this.gebaeude.set(id, gebaeude);
    return gebaeude;
  }

  updateGebaeude(id: string, data: any): Gebaeude | undefined {
    const existing = this.gebaeude.get(id);
    if (!existing) return undefined;

    const productions = (data.production_ids || [])
      .map((pid: string) => this.getProduktionById(pid))
      .filter(Boolean);

    const updated: Gebaeude = {
      ...existing,
      name: data.name,
      building_costs_per_month: data.building_costs_per_month || 0,
      productions
    };

    this.gebaeude.set(id, updated);
    return updated;
  }

  deleteGebaeude(id: string): boolean {
    return this.gebaeude.delete(id);
  }

  private getProductionInputs(productionId: string): ProductionInput[] {
    return Array.from(this.productionInputs.values())
      .filter(input => input.production_id === productionId)
      .map(input => ({
        ...input,
        good: this.getWareById(input.good_id)
      }));
  }

  private getProductionOutputs(productionId: string): ProductionOutput[] {
    return Array.from(this.productionOutputs.values())
      .filter(output => output.production_id === productionId)
      .map(output => ({
        ...output,
        good: this.getWareById(output.good_id)
      }));
  }

  getProductionInputsByGoodId(goodId: string): ProductionInput[] {
    return Array.from(this.productionInputs.values())
      .filter(input => input.good_id === goodId)
      .map(input => ({
        ...input,
        good: this.getWareById(input.good_id)
      }));
  }

  getProductionOutputsByProductionId(productionId: string): ProductionOutput[] {
    return this.getProductionOutputs(productionId);
  }

  clearAllData(): void {
    this.waren.clear();
    this.produktionen.clear();
    this.gebaeude.clear();
    this.productionInputs.clear();
    this.productionOutputs.clear();
  }
}

export const db = new InMemoryDatabase();
