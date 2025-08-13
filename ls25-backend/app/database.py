from sqlalchemy import create_engine, Column, String, Float, Integer, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

SQLALCHEMY_DATABASE_URL = "sqlite:///./ls25.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

building_productions = Table(
    'building_productions',
    Base.metadata,
    Column('building_id', String, ForeignKey('gebaeude.id')),
    Column('production_id', String, ForeignKey('produktionen.id'))
)

class Ware(Base):
    __tablename__ = "waren"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    unit = Column(String, default="Liter")
    density = Column(Float, nullable=True)
    price_per_1000l = Column(Float, default=0.0)
    
    production_inputs = relationship("ProductionInput", back_populates="good")
    production_outputs = relationship("ProductionOutput", back_populates="good")

class Produktion(Base):
    __tablename__ = "produktionen"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, default="")
    cycles_per_month = Column(Float, nullable=False)
    fixed_costs_per_month = Column(Float, default=0.0)
    variable_costs_per_cycle = Column(Float, default=0.0)
    
    inputs = relationship("ProductionInput", back_populates="production", cascade="all, delete-orphan")
    outputs = relationship("ProductionOutput", back_populates="production", cascade="all, delete-orphan")
    buildings = relationship("Gebaeude", secondary=building_productions, back_populates="productions")

class Gebaeude(Base):
    __tablename__ = "gebaeude"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    building_costs_per_month = Column(Float, default=0.0)
    
    productions = relationship("Produktion", secondary=building_productions, back_populates="buildings")

class ProductionInput(Base):
    __tablename__ = "production_inputs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    production_id = Column(String, ForeignKey("produktionen.id"))
    good_id = Column(String, ForeignKey("waren.id"))
    quantity_per_cycle = Column(Float, nullable=False)
    
    production = relationship("Produktion", back_populates="inputs")
    good = relationship("Ware", back_populates="production_inputs")

class ProductionOutput(Base):
    __tablename__ = "production_outputs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    production_id = Column(String, ForeignKey("produktionen.id"))
    good_id = Column(String, ForeignKey("waren.id"))
    quantity_per_cycle = Column(Float, nullable=False)
    
    production = relationship("Produktion", back_populates="outputs")
    good = relationship("Ware", back_populates="production_outputs")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)
