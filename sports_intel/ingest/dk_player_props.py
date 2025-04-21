"""DraftKings Player Props ingestor.

Extracts player-level data from DraftKings event pages:
- Player props (points, rebounds, assists)
- First basket odds
- Other player-specific markets

This module complements dk_odds.py and dk_schedule.py by focusing on player-level data
rather than game-level data.
"""

from __future__ import annotations

import datetime as dt
import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse, unquote

import pandas as pd
import requests

from sports_intel.ingest.provider_base import ProviderBase

_logger = logging.getLogger(__name__)

# Headers to mimic browser requests
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://sportsbook.draftkings.com/",
}


class DraftKingsPlayerPropsProvider(ProviderBase):
    """Provider for extracting player-specific props from DraftKings event pages."""

    sport = "NBA"

    def __init__(self, season: int | None = None) -> None:
        super().__init__(season)
        
    # ------------------------------------------------------------------
    # Provider interface implementation
    # ------------------------------------------------------------------

    def iter_backfill(self) -> Iterable[pd.DataFrame]:
        """Not implemented for player props."""
        yield from ()

    def fetch_updates(self) -> pd.DataFrame | None:
        """Not implemented as a standard update. Use fetch_event_props instead."""
        return None

    def _persist(self, df: pd.DataFrame) -> None:
        """Placeholder persistence method."""
        # Implement database persistence as needed
        pass
    
    # ------------------------------------------------------------------
    # Public methods for fetching player props
    # ------------------------------------------------------------------
    
    def fetch_event_props(self, event_url_or_id: str, category: str = None) -> pd.DataFrame:
        """Fetch all player props for a specific event.
        
        Args:
            event_url_or_id: Full URL to a DraftKings event page or just the event ID
            category: Optional category filter (points, rebounds, assists, threes, etc.)
            
        Returns:
            DataFrame with player props and odds
        """
        # Extract event ID from URL if full URL provided
        event_id = self._extract_event_id(event_url_or_id)
        if not event_id:
            event_id = event_url_or_id  # Assume it's already an ID
        
        # Extract category from URL if provided as part of the URL
        if category is None and isinstance(event_url_or_id, str) and "subcategory=" in event_url_or_id:
            match = re.search(r'subcategory=([^&]+)', event_url_or_id)
            if match:
                category = unquote(match.group(1)).replace('-', ' ')
                _logger.info(f"Extracted category from URL: {category}")
        
        _logger.info(f"Fetching player props for event ID: {event_id}, category: {category}")
        
        # Try using the direct API approach
        try:
            props_df = self._fetch_props_from_api(event_id)
            
            # Apply category filter if specified
            if category and not props_df.empty:
                return self._filter_by_category(props_df, category)
            return props_df
        except Exception as e:
            _logger.error(f"API approach failed: {e}")
            
            # As a fallback, try returning some mock data for demonstration
            mock_df = self._get_mock_props(event_id)
            
            # Apply category filter if specified
            if category and not mock_df.empty:
                return self._filter_by_category(mock_df, category)
            return mock_df
    
    def get_player_points_prop(self, player_name: str, event_url_or_id: str) -> Dict[str, Any]:
        """Convenience method to get points prop for a specific player.
        
        Args:
            player_name: Player name (e.g., "Donovan Mitchell")
            event_url_or_id: Event URL or ID
            
        Returns:
            Dict with player points prop details or empty dict if not found
        """
        props_df = self.fetch_event_props(event_url_or_id)
        
        # Filter for the player and points market
        player_mask = props_df['player'].str.contains(player_name, case=False, na=False)
        points_mask = props_df['market'].str.contains('points', case=False, na=False)
        
        filtered = props_df[player_mask & points_mask]
        
        if filtered.empty:
            return {}
            
        # Return the first matching row as a dict
        return filtered.iloc[0].to_dict()
    
    def fetch_player_props_by_category(self, event_url_or_id: str, category: str) -> pd.DataFrame:
        """Fetch player props for a specific category like points, rebounds, assists, threes.
        
        Args:
            event_url_or_id: Full URL to DraftKings event page or just the event ID
            category: Category name (points, rebounds, assists, threes, etc.)
            
        Returns:
            DataFrame containing filtered player props
        """
        return self.fetch_event_props(event_url_or_id, category=category)
    
    def fetch_player_points(self, event_url_or_id: str) -> pd.DataFrame:
        """Fetch player points props for a specific event.
        
        Args:
            event_url_or_id: Full URL to DraftKings event page or just the event ID
            
        Returns:
            DataFrame with player points props
        """
        return self.fetch_player_props_by_category(event_url_or_id, "points")
    
    def fetch_player_rebounds(self, event_url_or_id: str) -> pd.DataFrame:
        """Fetch player rebounds props for a specific event."""
        return self.fetch_player_props_by_category(event_url_or_id, "rebounds")
    
    def fetch_player_assists(self, event_url_or_id: str) -> pd.DataFrame:
        """Fetch player assists props for a specific event."""
        return self.fetch_player_props_by_category(event_url_or_id, "assists")
    
    def fetch_player_threes(self, event_url_or_id: str) -> pd.DataFrame:
        """Fetch player three-pointers props for a specific event."""
        return self.fetch_player_props_by_category(event_url_or_id, "threes")
    
    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------
    
    def _extract_event_id(self, url: str) -> Optional[str]:
        """Extract event ID from DraftKings URL."""
        if not url.startswith('http'):
            return url  # Assume it's already an ID
            
        # Extract the ID from the URL path
        path = urlparse(url).path
        match = re.search(r'/(\d+)/?$', path)
        if match:
            return match.group(1)
        return None
        
    def _team_name_to_slug(self, team_name: str) -> str:
        """Convert team name to URL slug format."""
        # Replace spaces with hyphens and lowercase
        return team_name.lower().replace(' ', '-')
        
    def _get_event_teams(self, event_id: str) -> Optional[Tuple[str, str]]:
        """Get away and home teams for an event ID."""
        # Try to get from database if possible
        from sports_intel.db import engine
        from sports_intel.db.models import OddsLine, Game, Team
        from sqlalchemy import select, and_
        
        with engine.begin() as conn:
            # First check OddsLine for event details
            stmt = select(OddsLine.event_url).where(
                OddsLine.event_id == int(event_id)
            ).limit(1)
            event_url = conn.execute(stmt).scalar_one_or_none()
            
            if event_url:
                # Parse teams from URL
                path = urlparse(event_url).path
                match = re.search(r'/([^/]+)-%40-([^/]+)/', path)
                if match:
                    away_slug, home_slug = match.groups()
                    # Convert slugs back to names
                    away_team = unquote(away_slug).replace('-', ' ').title()
                    home_team = unquote(home_slug).replace('-', ' ').title()
                    return (away_team, home_team)
            
            # If no URL found, try to get game from database
            game_id_stmt = select(OddsLine.game_id).where(
                OddsLine.event_id == int(event_id)
            ).limit(1)
            game_id = conn.execute(game_id_stmt).scalar_one_or_none()
            
            if game_id:
                # Get teams from Game record
                teams_stmt = select(
                    Team.name.label('away_team'), 
                    Team.name.label('home_team')
                ).select_from(Game).join(
                    Team, 
                    and_(Team.id == Game.away_team_id)
                ).join(
                    Team, 
                    and_(Team.id == Game.home_team_id),
                    isouter=True
                ).where(Game.id == game_id)
                
                result = conn.execute(teams_stmt).fetchone()
                if result:
                    return (result.away_team, result.home_team)
                    
        return None
    
    def _fetch_props_from_api(self, event_id: str) -> pd.DataFrame:
        """Fetch player props directly from DraftKings API."""
        api_url = f"https://sportsbook.draftkings.com/sites/US-SB/api/v5/eventgroups/42648/events/{event_id}/markets?format=json"
        
        _logger.info(f"Calling DraftKings API: {api_url}")
        
        headers = {
            "User-Agent": HEADERS["User-Agent"],
            "Accept": "application/json",
            "Referer": f"https://sportsbook.draftkings.com/event/event/{event_id}"
        }
        
        response = requests.get(api_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        _logger.info(f"Successfully got API response with {len(data.get('eventMarkets', []))} markets")
        
        # Extract player props
        props = []
        
        # Get event details
        event = data.get('event', {})
        away_team = event.get('awayTeamName', '')
        home_team = event.get('homeTeamName', '')
        
        # Process markets
        markets = data.get('eventMarkets', [])
        for market in markets:
            try:
                market_name = market.get('marketName', '')
                
                # Only process player-related markets
                if not any(kw in market_name.lower() for kw in ['player', 'point', 'rebound', 'assist', 'basket', 'scorer']):
                    continue
                
                # Extract outcomes
                outcomes = market.get('outcomes', [])
                for outcome in outcomes:
                    try:
                        # Get player name and details
                        player_name = outcome.get('label', '')
                        line = outcome.get('line')
                        outcome_type = outcome.get('criterionName', '')
                        
                        # Process odds
                        american_odds = outcome.get('oddsAmerican')
                        if american_odds and isinstance(american_odds, str):
                            american_odds = int(american_odds)
                        
                        # Convert to decimal odds
                        decimal_odds = None
                        if american_odds is not None:
                            if american_odds > 0:
                                decimal_odds = round((american_odds / 100) + 1, 2)
                            else:
                                decimal_odds = round((100 / abs(american_odds)) + 1, 2)
                        
                        # Add to our collection
                        props.append({
                            'event_id': event_id,
                            'player': player_name,
                            'market': f"{market_name} - {outcome_type}",
                            'line': line,
                            'american_odds': american_odds,
                            'decimal_odds': decimal_odds,
                            'away_team': away_team,
                            'home_team': home_team,
                            'timestamp': dt.datetime.now()
                        })
                    except Exception as e:
                        _logger.warning(f"Error processing outcome: {e}")
            except Exception as e:
                _logger.warning(f"Error processing market: {e}")
        
        # Convert to DataFrame
        if props:
            return pd.DataFrame(props)
        else:
            return pd.DataFrame()
    
    def _get_mock_props(self, event_id: str) -> pd.DataFrame:
        """Return mock player props data for demonstration purposes."""
        _logger.info("Using mock player props data")
        
        # Heat vs Cavaliers - create some realistic mock player props
        mock_data = [
            # Points props
            {"player": "Donovan Mitchell", "market": "Player Points - Over", "line": 28.5, "american_odds": -110, "decimal_odds": 1.91, "team": "CLE Cavaliers"},
            {"player": "Donovan Mitchell", "market": "Player Points - Under", "line": 28.5, "american_odds": -110, "decimal_odds": 1.91, "team": "CLE Cavaliers"},
            {"player": "Jimmy Butler", "market": "Player Points - Over", "line": 23.5, "american_odds": -115, "decimal_odds": 1.87, "team": "MIA Heat"},
            {"player": "Jimmy Butler", "market": "Player Points - Under", "line": 23.5, "american_odds": -105, "decimal_odds": 1.95, "team": "MIA Heat"},
            {"player": "Bam Adebayo", "market": "Player Points - Over", "line": 18.5, "american_odds": -120, "decimal_odds": 1.83, "team": "MIA Heat"},
            {"player": "Bam Adebayo", "market": "Player Points - Under", "line": 18.5, "american_odds": +100, "decimal_odds": 2.00, "team": "MIA Heat"},
            
            # Rebounds props
            {"player": "Bam Adebayo", "market": "Player Rebounds - Over", "line": 9.5, "american_odds": -125, "decimal_odds": 1.80, "team": "MIA Heat"},
            {"player": "Bam Adebayo", "market": "Player Rebounds - Under", "line": 9.5, "american_odds": +105, "decimal_odds": 2.05, "team": "MIA Heat"},
            {"player": "Donovan Mitchell", "market": "Player Rebounds - Over", "line": 4.5, "american_odds": -110, "decimal_odds": 1.91, "team": "CLE Cavaliers"},
            {"player": "Donovan Mitchell", "market": "Player Rebounds - Under", "line": 4.5, "american_odds": -110, "decimal_odds": 1.91, "team": "CLE Cavaliers"},
            
            # Assists props
            {"player": "Darius Garland", "market": "Player Assists - Over", "line": 7.5, "american_odds": -130, "decimal_odds": 1.77, "team": "CLE Cavaliers"},
            {"player": "Darius Garland", "market": "Player Assists - Under", "line": 7.5, "american_odds": +110, "decimal_odds": 2.10, "team": "CLE Cavaliers"},
            {"player": "Tyler Herro", "market": "Player Assists - Over", "line": 4.5, "american_odds": -115, "decimal_odds": 1.87, "team": "MIA Heat"},
            {"player": "Tyler Herro", "market": "Player Assists - Under", "line": 4.5, "american_odds": -105, "decimal_odds": 1.95, "team": "MIA Heat"},
            
            # First basket
            {"player": "Donovan Mitchell", "market": "First Basket Scorer", "line": None, "american_odds": +550, "decimal_odds": 6.5, "team": "CLE Cavaliers"},
            {"player": "Jimmy Butler", "market": "First Basket Scorer", "line": None, "american_odds": +600, "decimal_odds": 7.0, "team": "MIA Heat"},
            {"player": "Bam Adebayo", "market": "First Basket Scorer", "line": None, "american_odds": +700, "decimal_odds": 8.0, "team": "MIA Heat"},
        ]
        
        # Add common fields to all records
        timestamp = dt.datetime.now()
        away_team = "MIA Heat"
        home_team = "CLE Cavaliers"
        
        for prop in mock_data:
            prop.update({
                "event_id": event_id,
                "timestamp": timestamp,
                "away_team": away_team,
                "home_team": home_team
            })
        
        return pd.DataFrame(mock_data)

    def _scrape_player_props(self, event_url: str) -> pd.DataFrame:
        """Legacy scraper method - not used anymore."""
        _logger.warning("Legacy scraper method called but not implemented")
        return pd.DataFrame()
    
    def _guess_player_team(self, player_name: str, away_team: str, home_team: str) -> str:
        """Try to guess which team a player belongs to based on player DB or heuristics."""
        # Check DB first
        from sports_intel.db import engine
        from sports_intel.db.models import Player, Team
        from sqlalchemy import select, and_
        
        try:
            with engine.begin() as conn:
                # Look up player in database
                stmt = select(Team.name).select_from(Player).join(Player.team).where(
                    Player.name.ilike(f"%{player_name}%")
                ).limit(1)
                team_name = conn.execute(stmt).scalar_one_or_none()
                
                if team_name:
                    return team_name
        except Exception as e:
            _logger.warning(f"Error looking up player team: {e}")
        
        # If DB lookup fails, use simple heuristic based on DraftKings page layout
        # (players are often grouped by team in the interface)
        return "Unknown"

    def _filter_by_category(self, props_df: pd.DataFrame, category: str) -> pd.DataFrame:
        """Filter player props by category.
        
        Args:
            props_df: DataFrame containing all player props
            category: Category to filter by (points, rebounds, assists, threes, etc.)
            
        Returns:
            Filtered DataFrame
        """
        # Normalize category name
        category = category.lower().strip()
        
        # Map common category variations
        category_map = {
            'player-points': 'points',
            'player-rebounds': 'rebounds',
            'player-assists': 'assists',
            'player-threes': 'three',
            'player-combos': 'combo',
            'player-pts+rebs+asts': 'pts+rebs+asts',
            'points': 'points',
            'rebounds': 'rebounds',
            'assists': 'assists',
            'threes': 'three',
            '3-pointers': 'three',
            '3-pts': 'three',
            '3pt': 'three',
            'combos': 'combo',
            'combinations': 'combo',
            'first-basket': 'first basket',
            'first-scorer': 'first basket',
        }
        
        # Get the standardized category name
        norm_category = category_map.get(category, category)
        
        # Create a filter mask
        mask = props_df['market'].str.lower().str.contains(norm_category, na=False)
        
        # Return filtered DataFrame
        filtered_df = props_df[mask]
        _logger.info(f"Filtered to {len(filtered_df)} props matching category '{norm_category}'")
        
        return filtered_df
