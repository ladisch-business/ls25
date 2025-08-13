from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

class WareBase(BaseModel):
    name: str
    unit: str = "Liter"
    density: Optional[float] = None
    price_per_1000l: float = 0.0

class WareCreate(WareBase):
    pass

class WareUpdate(WareBase):
    pass

class Ware(WareBase):
    id: str
    
    class Config:
        from_attributes = True

class ProductionInputBase(BaseModel):
    good_id: str
    quantity_per_cycle: float

class ProductionInputCreate(ProductionInputBase):
    pass

class ProductionInput(ProductionInputBase):
    id: str
    good: Optional[Ware] = None
    
    class Config:
        from_attributes = True

class ProductionOutputBase(BaseModel):
    good_id: str
    quantity_per_cycle: float

class ProductionOutputCreate(ProductionOutputBase):
    pass

class ProductionOutput(ProductionOutputBase):
    id: str
    good: Optional[Ware] = None
    
    class Config:
        from_attributes = True

class ProduktionBase(BaseModel):
    name: str
    description: str = ""
    cycles_per_month: float
    fixed_costs_per_month: float = 0.0
    variable_costs_per_cycle: float = 0.0

class ProduktionCreate(ProduktionBase):
    inputs: List[ProductionInputCreate] = []
    outputs: List[ProductionOutputCreate] = []

class ProduktionUpdate(ProduktionBase):
    inputs: List[ProductionInputCreate] = []
    outputs: List[ProductionOutputCreate] = []

class Produktion(ProduktionBase):
    id: str
    inputs: List[ProductionInput] = []
    outputs: List[ProductionOutput] = []
    
    class Config:
        from_attributes = True

class GebaeudeBase(BaseModel):
    name: str
    building_costs_per_month: float = 0.0

class GebaeudeCreate(GebaeudeBase):
    production_ids: List[str] = []

class GebaeudeUpdate(GebaeudeBase):
    production_ids: List[str] = []

class Gebaeude(GebaeudeBase):
    id: str
    productions: List[Produktion] = []
    
    class Config:
        from_attributes = True

class ChainCalculationRequest(BaseModel):
    start_good_id: str
    quantity: float

class ChainCalculationResult(BaseModel):
    good_id: str
    good_name: str
    quantity: float
    stage: int

class RevenueCalculationRequest(BaseModel):
    production_chain: List[str]
    runtime_months: float = 1.0

class RevenueCalculationResult(BaseModel):
    gross_revenue: float
    production_costs: float
    net_revenue: float
    breakdown: dict

class CapacityAnalysisResult(BaseModel):
    production_id: str
    production_name: str
    inputs_per_month: List[dict]
    inputs_per_year: List[dict]

class ExportData(BaseModel):
    waren: List[Ware]
    produktionen: List[Produktion]
    gebaeude: List[Gebaeude]

class ImportData(BaseModel):
    waren: List[WareCreate] = []
    produktionen: List[ProduktionCreate] = []
    gebaeude: List[GebaeudeCreate] = []
    merge: bool = True
