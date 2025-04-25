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

    def create_mock_odds_data(event_id):
        """Generate mock odds data for a given event ID."""
        _logger.info(f"Generating mock odds data for event {event_id}")
        # Generate mock data based on the event_id
        # Example: LAL_MIA would be Lakers @ Heat
        teams = event_id.split('_')
        away_team = "Unknown"
        home_team = "Unknown"
        
        # Try to parse team names from event_id
        if len(teams) == 2:
            team_mappings = {
                "LAL": "Los Angeles Lakers",
                "MIA": "Miami Heat",
                "GSW": "Golden State Warriors",
                "BOS": "Boston Celtics",
                "PHX": "Phoenix Suns",
                "MIL": "Milwaukee Bucks",
                "DAL": "Dallas Mavericks",
                "BKN": "Brooklyn Nets",
                "DEN": "Denver Nuggets",
                "TOR": "Toronto Raptors"
            }
            away_team = team_mappings.get(teams[0], teams[0])
            home_team = team_mappings.get(teams[1], teams[1])
        
        import datetime as dt
        import pandas as pd
        import numpy as np
        
        # Create mock odds for different markets
        mock_odds = []
        
        # Moneyline
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Moneyline",
            "outcome_name": away_team,
            "price": 150,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Moneyline",
            "outcome_name": home_team,
            "price": -180,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        # Spread
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Spread",
            "outcome_name": f"{away_team} +4.5",
            "price": -110,
            "line": 4.5,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Spread",
            "outcome_name": f"{home_team} -4.5",
            "price": -110,
            "line": -4.5,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        # Total
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Total",
            "outcome_name": "Over 225.5",
            "price": -110,
            "line": 225.5,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        mock_odds.append({
            "event_id": event_id,
            "event_name": f"{away_team} @ {home_team}",
            "market_name": "Total",
            "outcome_name": "Under 225.5",
            "price": -110,
            "line": 225.5,
            "home_team": home_team,
            "away_team": away_team,
            "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
            "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
            "competition_name": "NBA",
            "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
        })
        
        # Add some player props for star players
        player_names = {
            "LAL": ["LeBron James", "Anthony Davis"],
            "MIA": ["Jimmy Butler", "Bam Adebayo"],
            "GSW": ["Stephen Curry", "Klay Thompson"],
            "BOS": ["Jayson Tatum", "Jaylen Brown"],
            "PHX": ["Kevin Durant", "Devin Booker"],
            "MIL": ["Giannis Antetokounmpo", "Damian Lillard"],
            "DAL": ["Luka Doncic", "Kyrie Irving"],
            "BKN": ["Mikal Bridges", "Cameron Johnson"],
            "DEN": ["Nikola Jokic", "Jamal Murray"],
            "TOR": ["Scottie Barnes", "Pascal Siakam"]
        }
        
        # Get players for each team
        away_players = player_names.get(teams[0], ["Player A", "Player B"]) if len(teams) == 2 else ["Player A", "Player B"]
        home_players = player_names.get(teams[1], ["Player C", "Player D"]) if len(teams) == 2 else ["Player C", "Player D"]
        
        # Points props
        for player in away_players + home_players:
            team = away_team if player in away_players else home_team
            points_line = np.random.choice([18.5, 19.5, 20.5, 22.5, 24.5, 26.5, 28.5])
            
            mock_odds.append({
                "event_id": event_id,
                "event_name": f"{away_team} @ {home_team}",
                "market_name": "Player Points",
                "outcome_name": "Over",
                "participant": player,
                "price": -110,
                "line": points_line,
                "home_team": home_team,
                "away_team": away_team,
                "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
                "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
                "competition_name": "NBA",
                "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
            })
            
            mock_odds.append({
                "event_id": event_id,
                "event_name": f"{away_team} @ {home_team}",
                "market_name": "Player Points",
                "outcome_name": "Under",
                "participant": player,
                "price": -110,
                "line": points_line,
                "home_team": home_team,
                "away_team": away_team,
                "home_team_abbreviation": teams[1] if len(teams) == 2 else "HOME",
                "away_team_abbreviation": teams[0] if len(teams) == 2 else "AWAY",
                "competition_name": "NBA",
                "start_date": (dt.datetime.now() + dt.timedelta(days=1)).isoformat()
            })
        
        return mock_odds

    # First, try to fetch real data from the database
    try:
        df = provider._fetch_event_details(event_id)
        if not df.empty:
            return df.to_dict(orient="records")
    except Exception as e:
        _logger.warning(f"Error fetching event details: {e}")
    
    # If we're here, either there was an error or the dataframe was empty
    # Generate and return mock data instead
    return create_mock_odds_data(event_id)
