"""FastAPI app exposing sports‑intel data providers."""

from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware

from sports_intel.api.routers import games, players, player_props

# Configure app with proper metadata
app = FastAPI(
    title="Sports‑Intel API", 
    version="0.1.0",
    description="API for accessing sports betting intelligence data",
    openapi_tags=[
        {"name": "Games", "description": "Operations with game data and schedules"},
        {"name": "Players", "description": "Operations with player data"},
        {"name": "Player Props", "description": "Operations with player proposition bets"},
        {"name": "Status", "description": "API status information"}
    ]
)

# Configure CORS to allow frontend to communicate with API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

# Include all routers
app.include_router(games.router)
app.include_router(players.router)
app.include_router(player_props.router)

@app.get("/", tags=["Status"])
def root():
    """Return API health status."""
    return {"status": "online", "version": "0.1.0"}
