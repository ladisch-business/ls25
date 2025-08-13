export interface Ware {
  id: string;
  name: string;
  unit: string;
  density?: number;
  price_per_1000l: number;
}

export interface ProductionInput {
  id: string;
  production_id: string;
  good_id: string;
  quantity_per_cycle: number;
  good?: Ware;
}

export interface ProductionOutput {
  id: string;
  production_id: string;
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

export interface ChainCalculationRequest {
  start_good_id: string;
  quantity: number;
}

export interface ChainCalculationResult {
  good_id: string;
  good_name: string;
  quantity: number;
  stage: number;
}

export interface RevenueCalculationRequest {
  production_chain: string[];
  runtime_months: number;
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

export interface ExportData {
  waren: Ware[];
  produktionen: Produktion[];
  gebaeude: Gebaeude[];
}

export interface ImportData {
  waren: Partial<Ware>[];
  produktionen: any[];
  gebaeude: any[];
  merge: boolean;
}
