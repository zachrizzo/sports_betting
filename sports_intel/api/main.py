from __future__ import annotations

"""FastAPI app exposing sports‑intel data providers."""

from fastapi import FastAPI, HTTPException

from sports_intel.ingest.dk_schedule import DraftKingsScheduleProvider
from sports_intel.ingest.dk_odds import DraftKingsNBAOddsProvider
from sports_intel.ingest.sportsdb_provider import TheSportsDBProvider
from sports_intel.ingest.dk_player_props import DraftKingsPlayerPropsProvider

app = FastAPI(title="Sports‑Intel API", version="0.1.0")


@app.get("/games/upcoming")
def upcoming_games() -> list[dict]:
    """Return upcoming NBA games from DraftKings schedule provider."""
    provider = DraftKingsScheduleProvider()
    df = provider.fetch_updates() or provider._fetch_upcoming()
    if df is None or df.empty:
        return []
    return df.to_dict(orient="records")


@app.get("/games/{event_id}")
def game_details(event_id: str) -> list[dict]:
    """Return detailed odds lines for a specific DraftKings event."""
    provider = DraftKingsNBAOddsProvider()
    df = provider._fetch_event_details(event_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="Event not found or no odds available")
    return df.to_dict(orient="records")


@app.get("/players/{player_id}/history")
def player_history(player_id: int) -> list[dict]:
    """Return historical player stats (via TheSportsDB placeholder)."""
    provider = TheSportsDBProvider()
    df = provider.fetch_player_stats(player_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="No stats found for player")
    return df.to_dict(orient="records")


@app.get("/games/{event_id}/player-props")
def game_player_props(event_id: str) -> list[dict]:
    """Return player props for a specific DraftKings event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_event_props(event_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="No player props found for this event")
    return df.to_dict(orient="records")


@app.get("/games/{event_id}/player-props/{market_type}")
def game_player_props_by_market(
    event_id: str, 
    market_type: str
) -> list[dict]:
    """Return specific market player props (points, rebounds, etc) for a DraftKings event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_event_props(event_id, category=market_type)
    
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No {market_type} props found for this event")
        
    return df.to_dict(orient="records")


@app.get("/players/{player_name}/props/{event_id}")
def player_props(player_name: str, event_id: str) -> list[dict]:
    """Return all props for a specific player in a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_event_props(event_id)
    if df.empty:
        raise HTTPException(status_code=404, detail="No player props found for this event")
    
    # Filter for the specific player (case-insensitive partial match)
    player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
    
    if player_df.empty:
        raise HTTPException(status_code=404, detail=f"No props found for player '{player_name}'")
        
    return player_df.to_dict(orient="records")


@app.get("/players/{player_name}/props/{event_id}/{market_type}")
def player_props_by_market(
    player_name: str, 
    event_id: str, 
    market_type: str
) -> list[dict]:
    """Return specific market props for a specific player in a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_event_props(event_id, category=market_type)
    
    if df.empty:
        raise HTTPException(status_code=404, detail=f"No {market_type} props found for this event")
    
    # Filter for the specific player (case-insensitive partial match)
    player_df = df[df["player"].str.lower().str.contains(player_name.lower())]
    
    if player_df.empty:
        raise HTTPException(status_code=404, detail=f"No {market_type} props found for player '{player_name}'")
        
    return player_df.to_dict(orient="records")


@app.get("/props/points/{event_id}")
def player_points(event_id: str) -> list[dict]:
    """Return player points props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_player_points(event_id)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No points props found for this event")
        
    return df.to_dict(orient="records")


@app.get("/props/rebounds/{event_id}")
def player_rebounds(event_id: str) -> list[dict]:
    """Return player rebounds props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_player_rebounds(event_id)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No rebounds props found for this event")
        
    return df.to_dict(orient="records")


@app.get("/props/assists/{event_id}")
def player_assists(event_id: str) -> list[dict]:
    """Return player assists props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_player_assists(event_id)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No assists props found for this event")
        
    return df.to_dict(orient="records")


@app.get("/props/threes/{event_id}")
def player_threes(event_id: str) -> list[dict]:
    """Return player three-pointers props for a specific event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_player_threes(event_id)
    
    if df.empty:
        raise HTTPException(status_code=404, detail="No three-pointers props found for this event")
        
    return df.to_dict(orient="records")
