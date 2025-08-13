const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Ware {
  id: string;
  name: string;
  unit: string;
  density?: number;
  price_per_1000l: number;
}

export interface ProductionInput {
  id: string;
  good_id: string;
  quantity_per_cycle: number;
  good?: Ware;
}

export interface ProductionOutput {
  id: string;
  good_id: string;
  quantity_per_cycle: number;
  good?: Ware;
}

export interface Produktion {
  id: string;
  name: string;
  description: string;
  cycles_per_month: number;
  fixed_costs_per_month: number;
  variable_costs_per_cycle: number;
  inputs: ProductionInput[];
  outputs: ProductionOutput[];
}

export interface Gebaeude {
  id: string;
  name: string;
  building_costs_per_month: number;
  productions: Produktion[];
}

export interface ChainCalculationResult {
  good_id: string;
  good_name: string;
  quantity: number;
  stage: number;
}

export interface RevenueCalculationResult {
  gross_revenue: number;
  production_costs: number;
  net_revenue: number;
  breakdown: any;
}

export interface CapacityAnalysisResult {
  production_id: string;
  production_name: string;
  inputs_per_month: Array<{
    good_id: string;
    good_name: string;
    quantity: number;
    unit: string;
  }>;
  inputs_per_year: Array<{
    good_id: string;
    good_name: string;
    quantity: number;
    unit: string;
  }>;
}

export const warenApi = {
  getAll: async (): Promise<Ware[]> => {
    const response = await fetch(`${API_URL}/api/waren`);
    return response.json();
  },
  
  create: async (ware: Omit<Ware, 'id'>): Promise<Ware> => {
    const response = await fetch(`${API_URL}/api/waren`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ware),
    });
    return response.json();
  },
  
  update: async (id: string, ware: Omit<Ware, 'id'>): Promise<Ware> => {
    const response = await fetch(`${API_URL}/api/waren/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ware),
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/api/waren/${id}`, { method: 'DELETE' });
  },
};

export const produktionenApi = {
  getAll: async (): Promise<Produktion[]> => {
    const response = await fetch(`${API_URL}/api/produktionen`);
    return response.json();
  },
  
  create: async (produktion: any): Promise<Produktion> => {
    const response = await fetch(`${API_URL}/api/produktionen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produktion),
    });
    return response.json();
  },
  
  update: async (id: string, produktion: any): Promise<Produktion> => {
    const response = await fetch(`${API_URL}/api/produktionen/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produktion),
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/api/produktionen/${id}`, { method: 'DELETE' });
  },
};

export const gebaeudeApi = {
  getAll: async (): Promise<Gebaeude[]> => {
    const response = await fetch(`${API_URL}/api/gebaeude`);
    return response.json();
  },
  
  create: async (gebaeude: Omit<Gebaeude, 'id' | 'productions'> & { production_ids: string[] }): Promise<Gebaeude> => {
    const response = await fetch(`${API_URL}/api/gebaeude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gebaeude),
    });
    return response.json();
  },
  
  update: async (id: string, gebaeude: Omit<Gebaeude, 'id' | 'productions'> & { production_ids: string[] }): Promise<Gebaeude> => {
    const response = await fetch(`${API_URL}/api/gebaeude/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gebaeude),
    });
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/api/gebaeude/${id}`, { method: 'DELETE' });
  },
};

export const calculationApi = {
  calculateChain: async (startGoodId: string, quantity: number): Promise<ChainCalculationResult[]> => {
    const response = await fetch(`${API_URL}/api/calculate/chain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start_good_id: startGoodId, quantity }),
    });
    return response.json();
  },
  
  calculateRevenue: async (productionChain: string[], runtimeMonths: number = 1.0): Promise<RevenueCalculationResult> => {
    const response = await fetch(`${API_URL}/api/calculate/revenue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ production_chain: productionChain, runtime_months: runtimeMonths }),
    });
    return response.json();
  },
  
  getCapacityAnalysis: async (productionId: string): Promise<CapacityAnalysisResult> => {
    const response = await fetch(`${API_URL}/api/calculate/capacity/${productionId}`);
    return response.json();
  },
  
  getProcessingTime: async (cyclesPerMonth: number): Promise<any> => {
    const response = await fetch(`${API_URL}/api/calculate/processing-time/${cyclesPerMonth}`);
    return response.json();
  },
};

export const importExportApi = {
  exportData: async (): Promise<any> => {
    const response = await fetch(`${API_URL}/api/export`);
    return response.json();
  },
  
  importData: async (data: any, merge: boolean = true): Promise<void> => {
    await fetch(`${API_URL}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, merge }),
    });
  },
};
