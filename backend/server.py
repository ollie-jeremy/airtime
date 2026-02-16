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
    duty_type: str = "single"  # "single" or "group"
    qualifications: List[str] = []
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduleDutyCreate(BaseModel):
    duty_id: str
    duty_name: str
    duty_code: str
    duty_type: str = "single"
    qualifications: List[str] = []
    date: str

class Personnel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    callsign: str
    name: str
    qualifications: List[str] = []
    total_duties: int = 0
    available: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Assignment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    schedule_duty_id: str
    duty_code: str
    duty_name: str
    personnel_id: str
    personnel_name: str
    personnel_callsign: str
    date: str
    start_time: str
    end_time: str
    sub_duty_name: str = ""  # For group duties: "Pilot", "Tower", etc.
    slot_index: int = 0       # For group duties: slot number within sub-duty
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AssignmentCreate(BaseModel):
    schedule_duty_id: str
    duty_code: str
    duty_name: str
    personnel_id: str
    personnel_name: str
    personnel_callsign: str
    date: str
    start_time: str
    end_time: str
    sub_duty_name: str = ""
    slot_index: int = 0

class AssignmentUpdate(BaseModel):
    personnel_id: str
    personnel_name: str
    personnel_callsign: str

class DutyConfigItem(BaseModel):
    name: str
    count: int

class DutyGroupConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    schedule_duty_id: str
    duties: List[DutyConfigItem] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DutyGroupConfigCreate(BaseModel):
    schedule_duty_id: str
    duties: List[DutyConfigItem] = []

class RecurrencePattern(BaseModel):
    frequency: str  # "daily", "weekly", "biweekly", "monthly", "custom"
    interval: int = 1  # every N days/weeks/months
    end_type: str  # "occurrences", "date", "never"
    occurrences: Optional[int] = None
    end_date: Optional[str] = None
    custom_days: List[int] = []  # For custom: 0=Mon, 1=Tue, etc.

class RecurringAssignmentCreate(BaseModel):
    schedule_duty_id: str
    duty_code: str
    duty_name: str
    personnel_id: str
    personnel_name: str
    personnel_callsign: str
    start_date: str
    start_time: str
    end_time: str
    recurrence: RecurrencePattern
    sub_duty_name: str = ""
    slot_index: int = 0

# --- Seed Data ---

SEED_DUTIES = [
    {"name": "Guard Duty - Main Gate", "code": "G1", "qualifications": ["Security L1", "Firearm"]},
    {"name": "Guard Duty - East Wing", "code": "G2", "qualifications": ["Security L1", "Comms"]},
    {"name": "Guard Duty - Perimeter", "code": "G3", "qualifications": ["Security L2", "Patrol"]},
    {"name": "Patrol - Sector A", "code": "P1", "qualifications": ["Driver", "Security L1"]},
    {"name": "Desk Ops - HQ", "code": "D1", "qualifications": ["Admin", "Comms"]},
    {"name": "Logistics Support", "code": "L1", "qualifications": ["Heavy Lift"]},
]

SEED_PERSONNEL = [
    {"callsign": "Alpha-1", "name": "John Miller", "qualifications": ["Security L1", "Firearm", "Comms"], "total_duties": 7, "available": True},
    {"callsign": "Alpha-2", "name": "Sarah Chen", "qualifications": ["Security L1", "Security L2", "Patrol"], "total_duties": 5, "available": True},
    {"callsign": "Bravo-1", "name": "Marcus Lee", "qualifications": ["Driver", "Security L1", "Heavy Lift"], "total_duties": 3, "available": True},
    {"callsign": "Bravo-2", "name": "Emily Park", "qualifications": ["Admin", "Comms", "Security L1"], "total_duties": 6, "available": True},
    {"callsign": "Charlie-1", "name": "David Kim", "qualifications": ["Security L2", "Firearm", "Patrol"], "total_duties": 4, "available": True},
    {"callsign": "Charlie-2", "name": "Jessica Wang", "qualifications": ["Heavy Lift", "Driver"], "total_duties": 2, "available": True},
    {"callsign": "Delta-1", "name": "Ryan Torres", "qualifications": ["Comms", "Admin"], "total_duties": 8, "available": False},
    {"callsign": "Delta-2", "name": "Olivia Brown", "qualifications": ["Security L1", "Firearm", "Security L2"], "total_duties": 5, "available": False},
]

async def seed_duties():
    count = await db.duties.count_documents({})
    if count == 0:
        for d in SEED_DUTIES:
            duty = DutyDefinition(**d)
            await db.duties.insert_one(duty.model_dump())
        logger.info(f"Seeded {len(SEED_DUTIES)} duties")

async def seed_personnel():
    count = await db.personnel.count_documents({})
    if count == 0:
        for p in SEED_PERSONNEL:
            person = Personnel(**p)
            await db.personnel.insert_one(person.model_dump())
        logger.info(f"Seeded {len(SEED_PERSONNEL)} personnel")

# --- Duty Routes ---

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
async def get_schedule_duties(date: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    duties = await db.schedule_duties.find(query, {"_id": 0}).to_list(500)
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
    # Also delete related configs and assignments
    await db.duty_group_configs.delete_many({"schedule_duty_id": duty_id})
    await db.assignments.delete_many({"schedule_duty_id": duty_id})
    return {"deleted": True}

# --- Personnel Routes ---

@api_router.get("/personnel", response_model=List[Personnel])
async def get_personnel(search: Optional[str] = None, available: Optional[bool] = None):
    query = {}
    if search:
        query["$or"] = [
            {"callsign": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
        ]
    if available is not None:
        query["available"] = available
    personnel = await db.personnel.find(query, {"_id": 0}).to_list(100)
    return personnel

# --- Assignment Routes ---

@api_router.get("/assignments", response_model=List[Assignment])
async def get_assignments(date: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    assignments = await db.assignments.find(query, {"_id": 0}).to_list(500)
    return assignments

@api_router.post("/assignments", response_model=Assignment)
async def create_assignment(input: AssignmentCreate):
    assignment = Assignment(**input.model_dump())
    doc = assignment.model_dump()
    await db.assignments.insert_one(doc)
    await db.personnel.update_one(
        {"id": input.personnel_id},
        {"$inc": {"total_duties": 1}}
    )
    return assignment

@api_router.put("/assignments/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: str, input: AssignmentUpdate):
    old = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not old:
        raise HTTPException(status_code=404, detail="Assignment not found")
    # Decrement old personnel
    await db.personnel.update_one(
        {"id": old["personnel_id"]},
        {"$inc": {"total_duties": -1}}
    )
    # Update assignment
    await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {
            "personnel_id": input.personnel_id,
            "personnel_name": input.personnel_name,
            "personnel_callsign": input.personnel_callsign,
        }}
    )
    # Increment new personnel
    await db.personnel.update_one(
        {"id": input.personnel_id},
        {"$inc": {"total_duties": 1}}
    )
    updated = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    return updated

@api_router.delete("/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.assignments.delete_one({"id": assignment_id})
    await db.personnel.update_one(
        {"id": assignment["personnel_id"]},
        {"$inc": {"total_duties": -1}}
    )
    return {"deleted": True}

# --- Duty Group Config Routes ---

@api_router.get("/duty-group-configs/{schedule_duty_id}", response_model=Optional[DutyGroupConfig])
async def get_duty_group_config(schedule_duty_id: str):
    config = await db.duty_group_configs.find_one(
        {"schedule_duty_id": schedule_duty_id}, {"_id": 0}
    )
    return config

@api_router.post("/duty-group-configs", response_model=DutyGroupConfig)
async def save_duty_group_config(input: DutyGroupConfigCreate):
    # Upsert: replace existing config for this schedule duty
    existing = await db.duty_group_configs.find_one(
        {"schedule_duty_id": input.schedule_duty_id}, {"_id": 0}
    )
    if existing:
        await db.duty_group_configs.update_one(
            {"schedule_duty_id": input.schedule_duty_id},
            {"$set": {"duties": [d.model_dump() for d in input.duties]}}
        )
        updated = await db.duty_group_configs.find_one(
            {"schedule_duty_id": input.schedule_duty_id}, {"_id": 0}
        )
        return updated
    else:
        config = DutyGroupConfig(**input.model_dump())
        doc = config.model_dump()
        await db.duty_group_configs.insert_one(doc)
        return config

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
    await seed_personnel()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
