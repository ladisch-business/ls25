import { db } from './database';
import { ChainCalculationResult, RevenueCalculationResult, CapacityAnalysisResult } from './types';

export function calculateChain(startGoodId: string, quantity: number): ChainCalculationResult[] {
  const results: ChainCalculationResult[] = [];
  const visitedProductions = new Set<string>();

  function processGood(goodId: string, availableQuantity: number, stage: number) {
    const good = db.getWareById(goodId);
    if (good) {
      results.push({
        good_id: goodId,
        good_name: good.name,
        quantity: availableQuantity,
        stage
      });
    }

    const produktionen = db.getAllProduktionen().filter(p => 
      p.inputs.some(input => input.good_id === goodId)
    );

    for (const produktion of produktionen) {
      if (visitedProductions.has(produktion.id)) {
        continue;
      }
      visitedProductions.add(produktion.id);

      const inputReq = produktion.inputs.find(input => input.good_id === goodId);
      if (inputReq && inputReq.quantity_per_cycle > 0) {
        const maxCycles = availableQuantity / inputReq.quantity_per_cycle;

        for (const output of produktion.outputs) {
          const outputQuantity = maxCycles * output.quantity_per_cycle;
          processGood(output.good_id, outputQuantity, stage + 1);
        }
      }
    }
  }

  processGood(startGoodId, quantity, 0);
  return results;
}

export function calculateRevenue(productionIds: string[], runtimeMonths: number = 1.0): RevenueCalculationResult {
  let grossRevenue = 0.0;
  let productionCosts = 0.0;
  const breakdown = {
    productions: [] as any[],
    total_fixed_costs: 0.0,
    total_variable_costs: 0.0,
    total_building_costs: 0.0
  };

  for (const productionId of productionIds) {
    const produktion = db.getProduktionById(productionId);
    if (!produktion) continue;

    const cyclesRun = produktion.cycles_per_month * runtimeMonths;
    const fixedCosts = produktion.fixed_costs_per_month * runtimeMonths;
    const variableCosts = produktion.variable_costs_per_cycle * cyclesRun;

    let buildingCosts = 0.0;
    const gebaeude = db.getAllGebaeude().filter(g => 
      g.productions.some(p => p.id === productionId)
    );
    
    for (const building of gebaeude) {
      buildingCosts += building.building_costs_per_month * runtimeMonths;
    }

    productionCosts += fixedCosts + variableCosts + buildingCosts;

    let revenue = 0.0;
    for (const output of produktion.outputs) {
      const outputQuantity = cyclesRun * output.quantity_per_cycle;
      const pricePerUnit = (output.good?.price_per_1000l || 0) / 1000.0;
      revenue += outputQuantity * pricePerUnit;
    }
    grossRevenue += revenue;

    breakdown.productions.push({
      id: productionId,
      name: produktion.name,
      cycles_run: cyclesRun,
      fixed_costs: fixedCosts,
      variable_costs: variableCosts,
      building_costs: buildingCosts,
      revenue
    });

    breakdown.total_fixed_costs += fixedCosts;
    breakdown.total_variable_costs += variableCosts;
    breakdown.total_building_costs += buildingCosts;
  }

  const netRevenue = grossRevenue - productionCosts;

  return {
    gross_revenue: grossRevenue,
    production_costs: productionCosts,
    net_revenue: netRevenue,
    breakdown
  };
}

export function calculateCapacityAnalysis(productionId: string): CapacityAnalysisResult {
  const produktion = db.getProduktionById(productionId);
  if (!produktion) {
    throw new Error('Production not found');
  }

  const inputsPerMonth: Array<{
    good_id: string;
    good_name: string;
    quantity: number;
    unit: string;
  }> = [];
  const inputsPerYear: Array<{
    good_id: string;
    good_name: string;
    quantity: number;
    unit: string;
  }> = [];

  for (const inputItem of produktion.inputs) {
    const monthlyRequirement = inputItem.quantity_per_cycle * produktion.cycles_per_month;
    const yearlyRequirement = monthlyRequirement * 12;

    inputsPerMonth.push({
      good_id: inputItem.good_id,
      good_name: inputItem.good?.name || 'Unknown',
      quantity: monthlyRequirement,
      unit: inputItem.good?.unit || 'Unknown'
    });

    inputsPerYear.push({
      good_id: inputItem.good_id,
      good_name: inputItem.good?.name || 'Unknown',
      quantity: yearlyRequirement,
      unit: inputItem.good?.unit || 'Unknown'
    });
  }

  return {
    production_id: productionId,
    production_name: produktion.name,
    inputs_per_month: inputsPerMonth,
    inputs_per_year: inputsPerYear
  };
}

export function calculateProcessingTime(cyclesPerMonth: number): any {
  if (cyclesPerMonth <= 0) {
    return { seconds_per_cycle: 0, minutes_per_cycle: 0, hours_per_cycle: 0 };
  }

  const secondsPerMonth = 30 * 24 * 3600;
  const secondsPerCycle = secondsPerMonth / cyclesPerMonth;

  return {
    seconds_per_cycle: secondsPerCycle,
    minutes_per_cycle: secondsPerCycle / 60,
    hours_per_cycle: secondsPerCycle / 3600
  };
}
