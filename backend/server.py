from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import httpx
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# NASA API Key
NASA_API_KEY = os.environ.get('NASA_API_KEY', 'YaeTkdGozgtqBzRQTn50IIxV4YZLxaGMr417d3cG')
NASA_APOD_BASE_URL = "https://api.nasa.gov/planetary/apod"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class APODResponse(BaseModel):
    date: str
    title: str
    explanation: str
    url: str
    hdurl: Optional[str] = None
    media_type: str
    copyright: Optional[str] = None

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    title: str
    explanation: str
    url: str
    hdurl: Optional[str] = None
    media_type: str
    copyright: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteCreate(BaseModel):
    date: str
    title: str
    explanation: str
    url: str
    hdurl: Optional[str] = None
    media_type: str
    copyright: Optional[str] = None

class UserPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    dark_mode: bool = True
    deep_black_mode: bool = False
    notifications_enabled: bool = True
    notification_time: str = "20:00"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserPreferencesUpdate(BaseModel):
    dark_mode: Optional[bool] = None
    deep_black_mode: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    notification_time: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "APOD Explorer API"}

# NASA APOD Proxy Endpoints
@api_router.get("/apod/today", response_model=APODResponse)
async def get_today_apod():
    """Fetch today's Astronomy Picture of the Day"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                NASA_APOD_BASE_URL,
                params={"api_key": NASA_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            return APODResponse(**data)
    except httpx.HTTPStatusError as e:
        logger.error(f"NASA API error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="NASA API error")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=503, detail="Unable to connect to NASA API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/apod/date/{date}", response_model=APODResponse)
async def get_apod_by_date(date: str):
    """Fetch APOD for a specific date (format: YYYY-MM-DD)"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                NASA_APOD_BASE_URL,
                params={"api_key": NASA_API_KEY, "date": date}
            )
            response.raise_for_status()
            data = response.json()
            return APODResponse(**data)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            raise HTTPException(status_code=400, detail="Invalid date format or date out of range")
        logger.error(f"NASA API error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="NASA API error")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=503, detail="Unable to connect to NASA API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/apod/random", response_model=APODResponse)
async def get_random_apod():
    """Fetch a random APOD from the archive (June 16, 1995 to today)"""
    try:
        # APOD started on June 16, 1995
        start_date = datetime(1995, 6, 16)
        end_date = datetime.now()
        
        # Calculate random date
        time_between = end_date - start_date
        random_days = random.randint(0, time_between.days)
        random_date = start_date + timedelta(days=random_days)
        date_str = random_date.strftime("%Y-%m-%d")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                NASA_APOD_BASE_URL,
                params={"api_key": NASA_API_KEY, "date": date_str}
            )
            response.raise_for_status()
            data = response.json()
            return APODResponse(**data)
    except httpx.HTTPStatusError as e:
        logger.error(f"NASA API error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="NASA API error")
    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        raise HTTPException(status_code=503, detail="Unable to connect to NASA API")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Favorites Endpoints
@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(favorite: FavoriteCreate):
    """Add an APOD to favorites"""
    # Check if already exists
    existing = await db.favorites.find_one({"date": favorite.date})
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    favorite_obj = Favorite(**favorite.dict())
    await db.favorites.insert_one(favorite_obj.dict())
    return favorite_obj

@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites():
    """Get all favorites sorted by created_at descending"""
    favorites = await db.favorites.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Favorite(**fav) for fav in favorites]

@api_router.get("/favorites/check/{date}")
async def check_favorite(date: str):
    """Check if a specific date is in favorites"""
    existing = await db.favorites.find_one({"date": date})
    return {"is_favorite": existing is not None}

@api_router.delete("/favorites/{date}")
async def remove_favorite(date: str):
    """Remove an APOD from favorites by date"""
    result = await db.favorites.delete_one({"date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Removed from favorites"}

# User Preferences Endpoints
@api_router.get("/preferences", response_model=UserPreferences)
async def get_preferences():
    """Get user preferences"""
    prefs = await db.preferences.find_one()
    if not prefs:
        # Create default preferences
        default_prefs = UserPreferences()
        await db.preferences.insert_one(default_prefs.dict())
        return default_prefs
    return UserPreferences(**prefs)

@api_router.put("/preferences", response_model=UserPreferences)
async def update_preferences(prefs_update: UserPreferencesUpdate):
    """Update user preferences"""
    existing = await db.preferences.find_one()
    if not existing:
        default_prefs = UserPreferences()
        await db.preferences.insert_one(default_prefs.dict())
        existing = default_prefs.dict()
    
    update_data = {k: v for k, v in prefs_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.preferences.update_one(
        {"id": existing["id"]},
        {"$set": update_data}
    )
    
    updated = await db.preferences.find_one({"id": existing["id"]})
    return UserPreferences(**updated)

# Status check endpoints (keeping original)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
