"""Router for player-related endpoints."""

from fastapi import APIRouter, HTTPException
import logging
import sqlalchemy
import pandas as pd

from sports_intel.ingest.sportsdb_provider import TheSportsDBProvider

_logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/players",
    tags=["Players"],
    responses={404: {"description": "Not found"}},
)


@router.get("/{player_id}/history", summary="Player history", 
          description="Return historical player stats from TheSportsDB.")
def player_history(player_id: int) -> list[dict]:
    """Return historical player stats (via TheSportsDB placeholder)."""
    provider = TheSportsDBProvider()
    try:
        df = provider.fetch_player_stats(player_id)
        if df.empty:
            raise HTTPException(status_code=404, detail="No stats found for player")
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Return mock data or empty list
            return []
        raise
