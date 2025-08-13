from typing import List, Dict, Set
from sqlalchemy.orm import Session
from app.database import Ware, Produktion, ProductionInput, ProductionOutput
from app.schemas import ChainCalculationResult, RevenueCalculationResult, CapacityAnalysisResult

def calculate_chain(db: Session, start_good_id: str, quantity: float) -> List[ChainCalculationResult]:
    """
    Kettenrechner: Calculate what can be produced from a starting good and quantity
    """
    results = []
    visited_productions: Set[str] = set()
    
    def process_good(good_id: str, available_quantity: float, stage: int):
        good = db.query(Ware).filter(Ware.id == good_id).first()
        if good:
            results.append(ChainCalculationResult(
                good_id=good_id,
                good_name=good.name,
                quantity=available_quantity,
                stage=stage
            ))
        
        productions = db.query(Produktion).join(ProductionInput).filter(
            ProductionInput.good_id == good_id
        ).all()
        
        for production in productions:
            if production.id in visited_productions:
                continue
            visited_productions.add(production.id)
            
            input_req = db.query(ProductionInput).filter(
                ProductionInput.production_id == production.id,
                ProductionInput.good_id == good_id
            ).first()
            
            if input_req and input_req.quantity_per_cycle > 0:
                max_cycles = available_quantity / input_req.quantity_per_cycle
                
                outputs = db.query(ProductionOutput).filter(
                    ProductionOutput.production_id == production.id
                ).all()
                
                for output in outputs:
                    output_quantity = max_cycles * output.quantity_per_cycle
                    process_good(output.good_id, output_quantity, stage + 1)
    
    process_good(start_good_id, quantity, 0)
    return results

def calculate_revenue(db: Session, production_ids: List[str], runtime_months: float = 1.0) -> RevenueCalculationResult:
    """
    Erlösrechnung: Calculate gross and net revenue for production chain
    """
    gross_revenue = 0.0
    production_costs = 0.0
    breakdown = {
        "productions": [],
        "total_fixed_costs": 0.0,
        "total_variable_costs": 0.0,
        "total_building_costs": 0.0
    }
    
    for production_id in production_ids:
        production = db.query(Produktion).filter(Produktion.id == production_id).first()
        if not production:
            continue
        
        cycles_run = production.cycles_per_month * runtime_months
        
        fixed_costs = production.fixed_costs_per_month * runtime_months
        variable_costs = production.variable_costs_per_cycle * cycles_run
        
        building_costs = 0.0
        for building in production.buildings:
            building_costs += building.building_costs_per_month * runtime_months
        
        production_costs += fixed_costs + variable_costs + building_costs
        
        for output in production.outputs:
            output_quantity = cycles_run * output.quantity_per_cycle
            price_per_unit = output.good.price_per_1000l / 1000.0
            revenue = output_quantity * price_per_unit
            gross_revenue += revenue
        
        breakdown["productions"].append({
            "id": production_id,
            "name": production.name,
            "cycles_run": cycles_run,
            "fixed_costs": fixed_costs,
            "variable_costs": variable_costs,
            "building_costs": building_costs,
            "revenue": revenue
        })
        
        breakdown["total_fixed_costs"] += fixed_costs
        breakdown["total_variable_costs"] += variable_costs
        breakdown["total_building_costs"] += building_costs
    
    net_revenue = gross_revenue - production_costs
    
    return RevenueCalculationResult(
        gross_revenue=gross_revenue,
        production_costs=production_costs,
        net_revenue=net_revenue,
        breakdown=breakdown
    )

def calculate_capacity_analysis(db: Session, production_id: str) -> CapacityAnalysisResult:
    """
    Auslastungsanalyse: Calculate required inputs for 100% capacity utilization
    """
    production = db.query(Produktion).filter(Produktion.id == production_id).first()
    if not production:
        raise ValueError("Production not found")
    
    inputs_per_month = []
    inputs_per_year = []
    
    for input_item in production.inputs:
        monthly_requirement = input_item.quantity_per_cycle * production.cycles_per_month
        yearly_requirement = monthly_requirement * 12
        
        inputs_per_month.append({
            "good_id": input_item.good_id,
            "good_name": input_item.good.name,
            "quantity": monthly_requirement,
            "unit": input_item.good.unit
        })
        
        inputs_per_year.append({
            "good_id": input_item.good_id,
            "good_name": input_item.good.name,
            "quantity": yearly_requirement,
            "unit": input_item.good.unit
        })
    
    return CapacityAnalysisResult(
        production_id=production_id,
        production_name=production.name,
        inputs_per_month=inputs_per_month,
        inputs_per_year=inputs_per_year
    )

def calculate_processing_time(cycles_per_month: float) -> dict:
    """
    Calculate processing time based on cycles per month
    """
    if cycles_per_month <= 0:
        return {"seconds_per_cycle": 0, "minutes_per_cycle": 0, "hours_per_cycle": 0}
    
    seconds_per_month = 30 * 24 * 3600
    seconds_per_cycle = seconds_per_month / cycles_per_month
    
    return {
        "seconds_per_cycle": seconds_per_cycle,
        "minutes_per_cycle": seconds_per_cycle / 60,
        "hours_per_cycle": seconds_per_cycle / 3600
    }
