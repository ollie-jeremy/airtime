from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---

class DutyDefinition(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    qualifications: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DutyDefinitionCreate(BaseModel):
    name: str
    code: str
    qualifications: List[str] = []

class ScheduleDuty(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    duty_id: str
    duty_name: str
    duty_code: str
    qualifications: List[str] = []
    date: str  # YYYY-MM-DD
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduleDutyCreate(BaseModel):
    duty_id: str
    duty_name: str
    duty_code: str
    qualifications: List[str] = []
    date: str

# --- Seed Data ---

SEED_DUTIES = [
    {"name": "Guard Duty - Main Gate", "code": "G1", "qualifications": ["Security L1", "Firearm"]},
    {"name": "Guard Duty - East Wing", "code": "G2", "qualifications": ["Security L1", "Comms"]},
    {"name": "Guard Duty - Perimeter", "code": "G3", "qualifications": ["Security L2", "Patrol"]},
    {"name": "Patrol - Sector A", "code": "P1", "qualifications": ["Driver", "Security L1"]},
    {"name": "Desk Ops - HQ", "code": "D1", "qualifications": ["Admin", "Comms"]},
    {"name": "Logistics Support", "code": "L1", "qualifications": ["Heavy Lift"]},
]

async def seed_duties():
    count = await db.duties.count_documents({})
    if count == 0:
        for d in SEED_DUTIES:
            duty = DutyDefinition(**d)
            await db.duties.insert_one(duty.model_dump())
        logger.info(f"Seeded {len(SEED_DUTIES)} duties")

# --- Routes ---

@api_router.get("/")
async def root():
    return {"message": "OpsScheduler API"}

@api_router.get("/duties", response_model=List[DutyDefinition])
async def get_duties(search: Optional[str] = None):
    query = {}
    if search:
        query = {"name": {"$regex": search, "$options": "i"}}
    duties = await db.duties.find(query, {"_id": 0}).to_list(100)
    return duties

@api_router.post("/duties", response_model=DutyDefinition)
async def create_duty(input: DutyDefinitionCreate):
    duty = DutyDefinition(**input.model_dump())
    doc = duty.model_dump()
    await db.duties.insert_one(doc)
    return duty

@api_router.get("/schedule-duties", response_model=List[ScheduleDuty])
async def get_schedule_duties(date: str):
    duties = await db.schedule_duties.find({"date": date}, {"_id": 0}).to_list(100)
    return duties

@api_router.post("/schedule-duties", response_model=ScheduleDuty)
async def add_schedule_duty(input: ScheduleDutyCreate):
    schedule_duty = ScheduleDuty(**input.model_dump())
    doc = schedule_duty.model_dump()
    await db.schedule_duties.insert_one(doc)
    return schedule_duty

@api_router.delete("/schedule-duties/{duty_id}")
async def remove_schedule_duty(duty_id: str):
    result = await db.schedule_duties.delete_one({"id": duty_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule duty not found")
    return {"deleted": True}

# --- App Setup ---

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await seed_duties()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
