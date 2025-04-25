"""Router for game-related endpoints."""

from fastapi import APIRouter, HTTPException
import logging
import sqlalchemy
import pandas as pd

from sports_intel.ingest.dk_schedule import DraftKingsScheduleProvider
from sports_intel.ingest.dk_odds import DraftKingsNBAOddsProvider

_logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/games",
    tags=["Games"],
    responses={404: {"description": "Not found"}},
)


@router.get("/upcoming", summary="List upcoming games", description="Return upcoming NBA games from DraftKings schedule provider.")
def upcoming_games() -> list[dict]:
    """Return upcoming NBA games from DraftKings schedule provider."""
    provider = DraftKingsScheduleProvider()
    df = provider.fetch_updates()
    if df is None or df.empty:
        df = provider._fetch_upcoming()
    if df is None or df.empty:
        return []
    return df.to_dict(orient="records")


@router.get("/{event_id}", summary="Game details", description="Return detailed odds lines for a specific DraftKings event.")
def game_details(event_id: str) -> list[dict]:
    """Return detailed odds lines for a specific DraftKings event."""
    provider = DraftKingsNBAOddsProvider()
    try:
        df = provider._fetch_event_details(event_id)
        if df.empty:
            raise HTTPException(status_code=404, detail="Event not found or no odds available")
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Return mock data or empty list
            return []
        raise
