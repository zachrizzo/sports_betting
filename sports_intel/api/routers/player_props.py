"""Router for player props endpoints."""

from fastapi import APIRouter, HTTPException
import logging
import sqlalchemy
import pandas as pd

from sports_intel.ingest.dk_player_props import DraftKingsPlayerPropsProvider

_logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/player-props",
    tags=["Player Props"],
    responses={404: {"description": "Not found"}},
)


@router.get("/games/{event_id}", summary="All player props", 
         description="Return all player props for a specific DraftKings event.")
def game_player_props(event_id: str) -> list[dict]:
    """Return player props for a specific DraftKings event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_event_props(event_id)
        if df.empty:
            raise HTTPException(status_code=404, detail="No player props found for this event")
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            return df.to_dict(orient="records")
        raise


@router.get("/games/{event_id}/{market_type}", summary="Player props by market", 
          description="Return specific market player props (points, rebounds, etc) for a DraftKings event.")
def game_player_props_by_market(
    event_id: str, 
    market_type: str
) -> list[dict]:
    """Return specific market player props (points, rebounds, etc) for a DraftKings event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_event_props(event_id, category=market_type)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No {market_type} props found for this event")
            
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            # Filter by market type
            filtered = provider._filter_by_category(df, market_type)
            return filtered.to_dict(orient="records")
        raise


@router.get("/players/{player_name}/{event_id}", summary="Player specific props", 
          description="Return all props for a specific player in a specific event.")
def player_props(player_name: str, event_id: str) -> list[dict]:
    """Return all props for a specific player in a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_event_props(event_id)
        if df.empty:
            raise HTTPException(status_code=404, detail="No player props found for this event")
        
        # Filter for the specific player (case-insensitive partial match)
        player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
        
        if player_df.empty:
            raise HTTPException(status_code=404, detail=f"No props found for player '{player_name}'")
            
        return player_df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
            return player_df.to_dict(orient="records")
        raise


@router.get("/players/{player_name}/{event_id}/{market_type}", summary="Player specific market props", 
          description="Return specific market props for a specific player in a specific event.")
def player_props_by_market(
    player_name: str, 
    event_id: str, 
    market_type: str
) -> list[dict]:
    """Return specific market props for a specific player in a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_event_props(event_id, category=market_type)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No {market_type} props found for this event")
        
        # Filter for the specific player (case-insensitive partial match)
        player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
        
        if player_df.empty:
            raise HTTPException(status_code=404, detail=f"No {market_type} props found for player '{player_name}'")
            
        return player_df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
            # Filter by market type
            filtered = provider._filter_by_category(player_df, market_type)
            return filtered.to_dict(orient="records")
        raise


@router.get("/points/{event_id}", summary="Points props", 
          description="Return player points props for a specific event.")
def player_points(event_id: str) -> list[dict]:
    """Return player points props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_player_points(event_id)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No points props found for this event")
            
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            # Filter by market type
            filtered = provider._filter_by_category(df, "points")
            return filtered.to_dict(orient="records")
        raise


@router.get("/rebounds/{event_id}", summary="Rebounds props", 
          description="Return player rebounds props for a specific event.")
def player_rebounds(event_id: str) -> list[dict]:
    """Return player rebounds props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_player_rebounds(event_id)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No rebounds props found for this event")
            
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            # Filter by market type
            filtered = provider._filter_by_category(df, "rebounds")
            return filtered.to_dict(orient="records")
        raise


@router.get("/assists/{event_id}", summary="Assists props", 
          description="Return player assists props for a specific event.")
def player_assists(event_id: str) -> list[dict]:
    """Return player assists props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_player_assists(event_id)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No assists props found for this event")
            
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            # Filter by market type
            filtered = provider._filter_by_category(df, "assists")
            return filtered.to_dict(orient="records")
        raise


@router.get("/threes/{event_id}", summary="Three-pointers props", 
          description="Return player three-pointers props for a specific event.")
def player_threes(event_id: str) -> list[dict]:
    """Return player three-pointers props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    try:
        df = provider.fetch_player_threes(event_id)
        
        if df.empty:
            raise HTTPException(status_code=404, detail="No three-pointers props found for this event")
            
        return df.to_dict(orient="records")
    except sqlalchemy.exc.OperationalError as e:
        if "no such table" in str(e):
            _logger.warning(f"Database table not found: {e}")
            # Try to use mock data if possible
            df = provider._get_mock_props(event_id)
            # Filter by market type
            filtered = provider._filter_by_category(df, "three-pointers")
            return filtered.to_dict(orient="records")
        raise
