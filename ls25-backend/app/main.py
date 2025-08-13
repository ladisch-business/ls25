from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db, create_tables, Ware, Produktion, Gebaeude, ProductionInput, ProductionOutput
from app.schemas import (
    WareCreate, WareUpdate, Ware as WareSchema,
    ProduktionCreate, ProduktionUpdate, Produktion as ProduktionSchema,
    GebaeudeCreate, GebaeudeUpdate, Gebaeude as GebaeudeSchema,
    ChainCalculationRequest, ChainCalculationResult,
    RevenueCalculationRequest, RevenueCalculationResult,
    CapacityAnalysisResult, ExportData, ImportData
)
from app.calculations import calculate_chain, calculate_revenue, calculate_capacity_analysis, calculate_processing_time

app = FastAPI(title="LS25 Produktions-Helper API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

create_tables()

@app.on_event("startup")
async def startup_event():
    from app.sample_data import create_sample_data
    db = next(get_db())
    create_sample_data(db)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/waren", response_model=List[WareSchema])
async def get_waren(db: Session = Depends(get_db)):
    return db.query(Ware).all()

@app.post("/api/waren", response_model=WareSchema)
async def create_ware(ware: WareCreate, db: Session = Depends(get_db)):
    db_ware = Ware(**ware.dict())
    db.add(db_ware)
    db.commit()
    db.refresh(db_ware)
    return db_ware

@app.put("/api/waren/{ware_id}", response_model=WareSchema)
async def update_ware(ware_id: str, ware: WareUpdate, db: Session = Depends(get_db)):
    db_ware = db.query(Ware).filter(Ware.id == ware_id).first()
    if not db_ware:
        raise HTTPException(status_code=404, detail="Ware not found")
    
    for key, value in ware.dict().items():
        setattr(db_ware, key, value)
    
    db.commit()
    db.refresh(db_ware)
    return db_ware

@app.delete("/api/waren/{ware_id}")
async def delete_ware(ware_id: str, db: Session = Depends(get_db)):
    db_ware = db.query(Ware).filter(Ware.id == ware_id).first()
    if not db_ware:
        raise HTTPException(status_code=404, detail="Ware not found")
    
    db.delete(db_ware)
    db.commit()
    return {"message": "Ware deleted"}

@app.get("/api/produktionen", response_model=List[ProduktionSchema])
async def get_produktionen(db: Session = Depends(get_db)):
    return db.query(Produktion).all()

@app.post("/api/produktionen", response_model=ProduktionSchema)
async def create_produktion(produktion: ProduktionCreate, db: Session = Depends(get_db)):
    db_produktion = Produktion(
        name=produktion.name,
        description=produktion.description,
        cycles_per_month=produktion.cycles_per_month,
        fixed_costs_per_month=produktion.fixed_costs_per_month,
        variable_costs_per_cycle=produktion.variable_costs_per_cycle
    )
    db.add(db_produktion)
    db.commit()
    db.refresh(db_produktion)
    
    for input_data in produktion.inputs:
        db_input = ProductionInput(
            production_id=db_produktion.id,
            good_id=input_data.good_id,
            quantity_per_cycle=input_data.quantity_per_cycle
        )
        db.add(db_input)
    
    for output_data in produktion.outputs:
        db_output = ProductionOutput(
            production_id=db_produktion.id,
            good_id=output_data.good_id,
            quantity_per_cycle=output_data.quantity_per_cycle
        )
        db.add(db_output)
    
    db.commit()
    db.refresh(db_produktion)
    return db_produktion

@app.put("/api/produktionen/{produktion_id}", response_model=ProduktionSchema)
async def update_produktion(produktion_id: str, produktion: ProduktionUpdate, db: Session = Depends(get_db)):
    db_produktion = db.query(Produktion).filter(Produktion.id == produktion_id).first()
    if not db_produktion:
        raise HTTPException(status_code=404, detail="Produktion not found")
    
    db_produktion.name = produktion.name
    db_produktion.description = produktion.description
    db_produktion.cycles_per_month = produktion.cycles_per_month
    db_produktion.fixed_costs_per_month = produktion.fixed_costs_per_month
    db_produktion.variable_costs_per_cycle = produktion.variable_costs_per_cycle
    
    db.query(ProductionInput).filter(ProductionInput.production_id == produktion_id).delete()
    db.query(ProductionOutput).filter(ProductionOutput.production_id == produktion_id).delete()
    
    for input_data in produktion.inputs:
        db_input = ProductionInput(
            production_id=produktion_id,
            good_id=input_data.good_id,
            quantity_per_cycle=input_data.quantity_per_cycle
        )
        db.add(db_input)
    
    for output_data in produktion.outputs:
        db_output = ProductionOutput(
            production_id=produktion_id,
            good_id=output_data.good_id,
            quantity_per_cycle=output_data.quantity_per_cycle
        )
        db.add(db_output)
    
    db.commit()
    db.refresh(db_produktion)
    return db_produktion

@app.delete("/api/produktionen/{produktion_id}")
async def delete_produktion(produktion_id: str, db: Session = Depends(get_db)):
    db_produktion = db.query(Produktion).filter(Produktion.id == produktion_id).first()
    if not db_produktion:
        raise HTTPException(status_code=404, detail="Produktion not found")
    
    db.delete(db_produktion)
    db.commit()
    return {"message": "Produktion deleted"}

@app.get("/api/gebaeude", response_model=List[GebaeudeSchema])
async def get_gebaeude(db: Session = Depends(get_db)):
    return db.query(Gebaeude).all()

@app.post("/api/gebaeude", response_model=GebaeudeSchema)
async def create_gebaeude(gebaeude: GebaeudeCreate, db: Session = Depends(get_db)):
    db_gebaeude = Gebaeude(
        name=gebaeude.name,
        building_costs_per_month=gebaeude.building_costs_per_month
    )
    
    for production_id in gebaeude.production_ids:
        production = db.query(Produktion).filter(Produktion.id == production_id).first()
        if production:
            db_gebaeude.productions.append(production)
    
    db.add(db_gebaeude)
    db.commit()
    db.refresh(db_gebaeude)
    return db_gebaeude

@app.put("/api/gebaeude/{gebaeude_id}", response_model=GebaeudeSchema)
async def update_gebaeude(gebaeude_id: str, gebaeude: GebaeudeUpdate, db: Session = Depends(get_db)):
    db_gebaeude = db.query(Gebaeude).filter(Gebaeude.id == gebaeude_id).first()
    if not db_gebaeude:
        raise HTTPException(status_code=404, detail="Gebäude not found")
    
    db_gebaeude.name = gebaeude.name
    db_gebaeude.building_costs_per_month = gebaeude.building_costs_per_month
    
    db_gebaeude.productions.clear()
    for production_id in gebaeude.production_ids:
        production = db.query(Produktion).filter(Produktion.id == production_id).first()
        if production:
            db_gebaeude.productions.append(production)
    
    db.commit()
    db.refresh(db_gebaeude)
    return db_gebaeude

@app.delete("/api/gebaeude/{gebaeude_id}")
async def delete_gebaeude(gebaeude_id: str, db: Session = Depends(get_db)):
    db_gebaeude = db.query(Gebaeude).filter(Gebaeude.id == gebaeude_id).first()
    if not db_gebaeude:
        raise HTTPException(status_code=404, detail="Gebäude not found")
    
    db.delete(db_gebaeude)
    db.commit()
    return {"message": "Gebäude deleted"}

@app.post("/api/calculate/chain", response_model=List[ChainCalculationResult])
async def calculate_production_chain(request: ChainCalculationRequest, db: Session = Depends(get_db)):
    return calculate_chain(db, request.start_good_id, request.quantity)

@app.post("/api/calculate/revenue", response_model=RevenueCalculationResult)
async def calculate_production_revenue(request: RevenueCalculationRequest, db: Session = Depends(get_db)):
    return calculate_revenue(db, request.production_chain, request.runtime_months)

@app.get("/api/calculate/capacity/{production_id}", response_model=CapacityAnalysisResult)
async def get_capacity_analysis(production_id: str, db: Session = Depends(get_db)):
    return calculate_capacity_analysis(db, production_id)

@app.get("/api/calculate/processing-time/{cycles_per_month}")
async def get_processing_time(cycles_per_month: float):
    return calculate_processing_time(cycles_per_month)

@app.get("/api/export", response_model=ExportData)
async def export_data(db: Session = Depends(get_db)):
    waren = db.query(Ware).all()
    produktionen = db.query(Produktion).all()
    gebaeude = db.query(Gebaeude).all()
    
    return ExportData(
        waren=waren,
        produktionen=produktionen,
        gebaeude=gebaeude
    )

@app.post("/api/import")
async def import_data(data: ImportData, db: Session = Depends(get_db)):
    if not data.merge:
        db.query(ProductionInput).delete()
        db.query(ProductionOutput).delete()
        db.query(Produktion).delete()
        db.query(Gebaeude).delete()
        db.query(Ware).delete()
        db.commit()
    
    for ware_data in data.waren:
        if data.merge:
            existing = db.query(Ware).filter(Ware.name == ware_data.name).first()
            if existing:
                continue
        
        db_ware = Ware(**ware_data.dict())
        db.add(db_ware)
    
    db.commit()
    
    for produktion_data in data.produktionen:
        if data.merge:
            existing = db.query(Produktion).filter(Produktion.name == produktion_data.name).first()
            if existing:
                continue
        
        db_produktion = Produktion(
            name=produktion_data.name,
            description=produktion_data.description,
            cycles_per_month=produktion_data.cycles_per_month,
            fixed_costs_per_month=produktion_data.fixed_costs_per_month,
            variable_costs_per_cycle=produktion_data.variable_costs_per_cycle
        )
        db.add(db_produktion)
        db.commit()
        db.refresh(db_produktion)
        
        for input_data in produktion_data.inputs:
            good = db.query(Ware).filter(Ware.id == input_data.good_id).first()
            if good:
                db_input = ProductionInput(
                    production_id=db_produktion.id,
                    good_id=input_data.good_id,
                    quantity_per_cycle=input_data.quantity_per_cycle
                )
                db.add(db_input)
        
        for output_data in produktion_data.outputs:
            good = db.query(Ware).filter(Ware.id == output_data.good_id).first()
            if good:
                db_output = ProductionOutput(
                    production_id=db_produktion.id,
                    good_id=output_data.good_id,
                    quantity_per_cycle=output_data.quantity_per_cycle
                )
                db.add(db_output)
    
    db.commit()
    
    for gebaeude_data in data.gebaeude:
        if data.merge:
            existing = db.query(Gebaeude).filter(Gebaeude.name == gebaeude_data.name).first()
            if existing:
                continue
        
        db_gebaeude = Gebaeude(
            name=gebaeude_data.name,
            building_costs_per_month=gebaeude_data.building_costs_per_month
        )
        
        for production_id in gebaeude_data.production_ids:
            production = db.query(Produktion).filter(Produktion.id == production_id).first()
            if production:
                db_gebaeude.productions.append(production)
        
        db.add(db_gebaeude)
    
    db.commit()
    return {"message": "Data imported successfully"}
