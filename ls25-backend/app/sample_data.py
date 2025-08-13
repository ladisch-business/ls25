from sqlalchemy.orm import Session
from app.database import Ware, Produktion, ProductionInput, ProductionOutput, Gebaeude

def create_sample_data(db: Session):
    if db.query(Ware).count() > 0:
        return
    
    weizen = Ware(
        name="Weizen",
        unit="Liter",
        price_per_1000l=500.0
    )
    mehl = Ware(
        name="Mehl",
        unit="Liter", 
        price_per_1000l=800.0
    )
    brot = Ware(
        name="Brot",
        unit="Liter",
        price_per_1000l=1500.0
    )
    
    db.add_all([weizen, mehl, brot])
    db.commit()
    db.refresh(weizen)
    db.refresh(mehl)
    db.refresh(brot)
    
    mehl_produktion = Produktion(
        name="Mehl Produktion",
        description="Weizen zu Mehl verarbeiten",
        cycles_per_month=100.0,
        fixed_costs_per_month=1000.0,
        variable_costs_per_cycle=5.0
    )
    db.add(mehl_produktion)
    db.commit()
    db.refresh(mehl_produktion)
    
    mehl_input = ProductionInput(
        production_id=mehl_produktion.id,
        good_id=weizen.id,
        quantity_per_cycle=1000.0
    )
    mehl_output = ProductionOutput(
        production_id=mehl_produktion.id,
        good_id=mehl.id,
        quantity_per_cycle=800.0
    )
    
    db.add_all([mehl_input, mehl_output])
    
    brot_produktion = Produktion(
        name="Brot Produktion",
        description="Mehl zu Brot verarbeiten",
        cycles_per_month=80.0,
        fixed_costs_per_month=1500.0,
        variable_costs_per_cycle=8.0
    )
    db.add(brot_produktion)
    db.commit()
    db.refresh(brot_produktion)
    
    brot_input = ProductionInput(
        production_id=brot_produktion.id,
        good_id=mehl.id,
        quantity_per_cycle=800.0
    )
    brot_output = ProductionOutput(
        production_id=brot_produktion.id,
        good_id=brot.id,
        quantity_per_cycle=600.0
    )
    
    db.add_all([brot_input, brot_output])
    
    baeckerei = Gebaeude(
        name="Bäckerei",
        building_costs_per_month=500.0
    )
    baeckerei.productions.extend([mehl_produktion, brot_produktion])
    db.add(baeckerei)
    
    db.commit()
