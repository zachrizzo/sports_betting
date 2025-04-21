"""TheSportsDB data ingestion provider."""
from __future__ import annotations

import datetime as dt
import logging
import requests
import pandas as pd
from typing import Iterable, Dict, Any, List
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy import select, update

from sports_intel.ingest.provider_base import ProviderBase
from sports_intel.db import engine
from sports_intel.db.models import Team, Game, Player

_logger = logging.getLogger(__name__)

# TheSportsDB API endpoints
BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"
LEAGUE_ID = {
    "NBA": 4387,  # NBA League ID in TheSportsDB
}

class TheSportsDBProvider(ProviderBase):
    """Pull sports data from TheSportsDB."""

    sport = "NBA"  # Default sport

    def __init__(self, season: int | None = None) -> None:
        super().__init__(season)
        self.base_url = BASE_URL
        self.league_id = LEAGUE_ID.get(self.sport)
        if not self.league_id:
            _logger.error(f"No league ID found for sport {self.sport}")
            self.league_id = 4387  # Fallback to NBA ID
            
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
        }
        self.session.headers.update(self.headers)

    # ------------------------------------------------------------------
    # Provider implementation
    # ------------------------------------------------------------------

    def iter_backfill(self) -> Iterable[pd.DataFrame]:
        """Backfill sports data by fetching teams, players, and events."""
        if self.season is None:
            raise ValueError("Backfill requires season param")

        # Step 1: Get all teams for the league
        teams_df = self._fetch_teams()
        if not teams_df.empty:
            self._persist_teams(teams_df)
            # We don't yield teams_df as it's not handled by the generic _persist method

        # Step 2: Get players for each team
        team_ids = self._get_team_ids_from_db()
        for team_id in team_ids:
            players_df = self._fetch_players_for_team(team_id)
            if not players_df.empty:
                self._persist_players(players_df)
                # We don't yield players_df as it's not handled by the generic _persist method

        # Step 3: Get games/events for the season
        season_str = f"{self.season}-{self.season + 1}"
        games_df = self._fetch_events(season_str)
        if not games_df.empty:
            # We persist and yield games data only
            yield games_df

    def fetch_updates(self, days_ahead: int = 15) -> pd.DataFrame | None:
        """Fetch latest upcoming games (next 25 events) using eventsnextleague endpoint."""
        df = self._fetch_next_events()
        if df is not None and not df.empty:
            # Persist inside fetch_updates so generic ProviderBase.update works too
            self._persist(df)
            return df
        return pd.DataFrame()

    def update(self, days_ahead: int = 15) -> None:
        """Incremental; fetch latest items only."""
        df = self.fetch_updates(days_ahead=days_ahead)
        if df is not None and not df.empty:
            self._persist(df)

    def update_specific_range(self, start_date: dt.date, end_date: dt.date) -> None:
        """Fetch games within a specific date range."""
        print(f"Fetching games between {start_date} and {end_date}")
        df = self.fetch_date_range(start_date, end_date)
        if df is not None and not df.empty:
            self._persist(df)

    def fetch_game_details(self, game_id: str) -> pd.DataFrame:
        """Fetch detailed information for a specific game."""
        print(f"Fetching detailed information for game ID: {game_id}")
        try:
            url = f"{self.base_url}/lookupevent.php"
            params = {
                "id": game_id
            }
            response = self.session.get(url, params=params)
            data = response.json()
            
            events = data.get("events", [])
            if not events:
                print(f"No detailed data found for game ID: {game_id}")
                return pd.DataFrame()
                
            # Process detailed game information
            event = events[0]
            
            # Game details as a DataFrame
            game_details = {
                "ext_game_id": event.get("idEvent"),
                "date": dt.datetime.strptime(event.get("dateEvent", ""), "%Y-%m-%d").date(),
                "time": event.get("strTime"),
                "venue": event.get("strVenue"),
                "home_team": event.get("strHomeTeam"),
                "away_team": event.get("strAwayTeam"),
                "league": event.get("strLeague"),
                "season": event.get("strSeason"),
                "home_score": event.get("intHomeScore"),
                "away_score": event.get("intAwayScore"),
                "status": event.get("strStatus"),
                "description": event.get("strDescriptionEN"),
            }
            
            df = pd.DataFrame([game_details])
            
            # Display the detailed information
            print(f"Game details retrieved: {game_details}")
            return df
            
        except Exception as e:
            print(f"Error fetching game details: {e}")
            return pd.DataFrame()

    def fetch_team_roster(self, team_id: int) -> pd.DataFrame:
        """Fetch and persist the roster for a specific team."""
        print(f"Fetching roster for team ID: {team_id}")
        try:
            # Get external team ID
            ext_team_id = self._get_ext_team_id(team_id)
            if not ext_team_id:
                print(f"No external ID found for team ID: {team_id}")
                return pd.DataFrame()
                
            url = f"{self.base_url}/lookup_all_players.php"
            params = {
                "id": ext_team_id
            }
            response = self.session.get(url, params=params)
            data = response.json()
            
            players = data.get("player", [])
            if not players:
                print(f"No players found for team ID: {team_id}")
                return pd.DataFrame()
                
            print(f"Found {len(players)} players for team ID: {team_id}")
                
            records = []
            for player in players:
                record = {
                    "ext_player_id": player.get("idPlayer"),
                    "name": player.get("strPlayer"),
                    "position": player.get("strPosition"),
                    "height": self._parse_height(player.get("strHeight", "")),
                    "weight": self._parse_weight(player.get("strWeight", "")),
                    "team_id": team_id,
                    "nationality": player.get("strNationality"),
                    "birth_date": player.get("dateBorn"),
                    "description": player.get("strDescriptionEN"),
                }
                records.append(record)
                
            df = pd.DataFrame(records)
            if not df.empty:
                self._persist_players(df)
            return df
            
        except Exception as e:
            print(f"Error fetching team roster: {e}")
            return pd.DataFrame()

    def fetch_player_stats(self, player_id: int) -> pd.DataFrame:
        """Fetch historical statistics for a specific player."""
        print(f"Fetching stats for player ID: {player_id}")
        try:
            # This is a placeholder as TheSportsDB free tier doesn't provide detailed player stats
            # In a real implementation, you would use their premium API or another source
            
            # Get external player ID
            session = SessionLocal()
            player = session.execute(
                select(Player).where(Player.id == player_id)
            ).scalar_one_or_none()
            session.close()
            
            if not player or not player.ext_player_id:
                print(f"No external ID found for player ID: {player_id}")
                return pd.DataFrame()
                
            # For the free tier, we can only get basic player info
            url = f"{self.base_url}/lookupplayer.php"
            params = {
                "id": player.ext_player_id
            }
            response = self.session.get(url, params=params)
            data = response.json()
            
            players = data.get("players", [])
            if not players:
                print(f"No player details found for ID: {player_id}")
                return pd.DataFrame()
                
            # Simulated stats (since detailed stats aren't available in free tier)
            player_data = players[0]
            
            # Create a simulated stats DataFrame with basic info and placeholder stats
            stats = {
                "player_id": player_id,
                "name": player_data.get("strPlayer"),
                "team": player_data.get("strTeam"),
                "position": player_data.get("strPosition"),
                "height": player_data.get("strHeight"),
                "weight": player_data.get("strWeight"),
                "birth_date": player_data.get("dateBorn"),
                "nationality": player_data.get("strNationality"),
                "signing": player_data.get("strSigning"),
                "description": player_data.get("strDescriptionEN"),
                # Note: Below are simulated stats fields that would need a premium API
                "ppg": "N/A (Premium API required)",
                "rpg": "N/A (Premium API required)",
                "apg": "N/A (Premium API required)",
                "games_played": "N/A (Premium API required)"
            }
            
            df = pd.DataFrame([stats])
            return df
            
        except Exception as e:
            print(f"Error fetching player stats: {e}")
            return pd.DataFrame()

    def fetch_date_range(self, start_date: dt.date, end_date: dt.date) -> pd.DataFrame:
        """Fetch events within a specific date range using daily endpoint."""
        records: list[dict[str, Any]] = []
        current = start_date
        while current <= end_date:
            date_str = current.strftime("%Y-%m-%d")
            print(f"Fetching events for date {date_str}")
            url = f"{self.base_url}/eventsday.php"
            params = {"d": date_str, "l": self.league_id}
            print(f"TheSportsDB API request: {url} with params {params}")
            response = self.session.get(url, params=params)
            if response.status_code != 200:
                print(f"Error response for {date_str}: {response.status_code}")
                current += dt.timedelta(days=1)
                continue
            data = response.json()
            events = data.get("events") or []
            for event in events:
                try:
                    event_date = dt.datetime.strptime(event.get("dateEvent", ""), "%Y-%m-%d").date()
                    home_team_name = event.get("strHomeTeam", "")
                    away_team_name = event.get("strAwayTeam", "")
                    home_team_id = self._get_team_id_by_name(home_team_name) or self._create_team_from_event(event, "home")
                    away_team_id = self._get_team_id_by_name(away_team_name) or self._create_team_from_event(event, "away")
                    if not home_team_id or not away_team_id:
                        _logger.warning(f"Unable to map teams for event: {home_team_name} vs {away_team_name}")
                        continue
                    try:
                        home_score = int(event.get("intHomeScore")) if event.get("intHomeScore") else None
                    except:
                        home_score = None
                    try:
                        away_score = int(event.get("intAwayScore")) if event.get("intAwayScore") else None
                    except:
                        away_score = None
                    records.append({
                        "ext_game_id": event.get("idEvent"),
                        "season": self.season or event_date.year,
                        "date": event_date,
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "venue": event.get("strVenue"),
                        "home_score": home_score,
                        "away_score": away_score,
                    })
                except Exception as e:
                    _logger.error(f"Error processing event on {date_str}: {e}")
                    continue
            current += dt.timedelta(days=1)
        print(f"Finished fetching for date range. Total records processed: {len(records)}")
        if records:
            df = pd.DataFrame(records)
            print(f"Persisting {len(df)} game records...")
            self._persist(df)
            return df
        print("No game records found to persist.")
        return pd.DataFrame()

    def _fetch_teams(self) -> pd.DataFrame:
        """Fetch all teams for the configured league."""
        try:
            url = f"{self.base_url}/lookup_all_teams.php"
            params = {
                "id": self.league_id
            }
            response = self.session.get(url, params=params)
            data = response.json()

            teams = data.get("teams", [])
            if not teams:
                return pd.DataFrame()

            records = []
            for team in teams:
                record = {
                    "ext_team_id": team.get("idTeam"),
                    "name": team.get("strTeam"),
                    "alias": team.get("strTeamShort"),
                    "league": self.sport,
                }
                records.append(record)

            return pd.DataFrame(records)

        except Exception as e:
            _logger.error(f"Error fetching teams: {e}")
            return pd.DataFrame()

    def _fetch_players_for_team(self, team_id: int) -> pd.DataFrame:
        """Fetch players for a specific team."""
        try:
            # First get the external team ID from our internal ID
            ext_team_id = self._get_ext_team_id(team_id)
            if not ext_team_id:
                return pd.DataFrame()

            url = f"{self.base_url}/lookup_all_players.php"
            params = {
                "id": ext_team_id
            }
            response = self.session.get(url, params=params)
            data = response.json()

            players = data.get("player", [])
            if not players:
                return pd.DataFrame()

            records = []
            for player in players:
                record = {
                    "ext_player_id": player.get("idPlayer"),
                    "name": player.get("strPlayer"),
                    "position": player.get("strPosition"),
                    "height": self._parse_height(player.get("strHeight", "")),
                    "weight": self._parse_weight(player.get("strWeight", "")),
                    "team_id": team_id,
                }
                records.append(record)

            return pd.DataFrame(records)

        except Exception as e:
            _logger.error(f"Error fetching players for team {team_id}: {e}")
            return pd.DataFrame()

    def _fetch_events(self, season: str) -> pd.DataFrame:
        """Fetch events/games for the specified season."""
        try:
            print(f"Fetching NBA events for season {season} from TheSportsDB")
            url = f"{self.base_url}/eventsseason.php"
            params = {
                "id": self.league_id,
                "s": season
            }
            print(f"TheSportsDB API request: {url} with params {params}")
            response = self.session.get(url, params=params)
            print(f"TheSportsDB API response status: {response.status_code}")
            
            if response.status_code != 200:
                _logger.error(f"Error response from TheSportsDB: {response.status_code} - {response.text}")
                return pd.DataFrame()
                
            data = response.json()
            
            # Helpful debugging for API response structure
            if "events" not in data:
                print(f"No 'events' key in response data. Available keys: {list(data.keys())}")
                if data:
                    print(f"Sample of response data: {str(data)[:200]}...")
                return pd.DataFrame()

            events = data.get("events", [])
            if not events:
                print("No events found in the API response")
                return pd.DataFrame()
                
            print(f"Found {len(events)} events from TheSportsDB")

            records = []
            for event in events:
                try:
                    event_date = dt.datetime.strptime(event.get("dateEvent", ""), "%Y-%m-%d").date()
                    home_team_name = event.get("strHomeTeam", "")
                    away_team_name = event.get("strAwayTeam", "")

                    # Map to internal team IDs
                    home_team_id = self._get_team_id_by_name(home_team_name)
                    away_team_id = self._get_team_id_by_name(away_team_name)

                    if not home_team_id or not away_team_id:
                        # Try to create the teams first
                        if not home_team_id:
                            home_team_id = self._create_team_from_event(event, "home")
                        if not away_team_id:
                            away_team_id = self._create_team_from_event(event, "away")
                            
                        if not home_team_id or not away_team_id:
                            _logger.warning(f"Unable to map teams for event: {home_team_name} vs {away_team_name}")
                            continue

                    # Extract scores safely
                    try:
                        home_score = int(event.get("intHomeScore")) if event.get("intHomeScore") else None
                    except (ValueError, TypeError):
                        home_score = None
                        
                    try:
                        away_score = int(event.get("intAwayScore")) if event.get("intAwayScore") else None
                    except (ValueError, TypeError):
                        away_score = None

                    record = {
                        "ext_game_id": event.get("idEvent"),
                        "season": self.season,
                        "date": event_date,
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "venue": event.get("strVenue"),
                        "home_score": home_score,
                        "away_score": away_score,
                    }
                    records.append(record)
                except Exception as e:
                    _logger.error(f"Error processing event {event.get('idEvent')}: {e}")
                    continue

            df = pd.DataFrame(records)
            print(f"Processed {len(df)} valid games from TheSportsDB")
            return df

        except Exception as e:
            _logger.error(f"Error fetching events: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()
            
    def _fetch_next_events(self, max_events: int = 25) -> pd.DataFrame:
        """Fetch the next *max_events* upcoming events for the league."""
        try:
            url = f"{self.base_url}/eventsnextleague.php"
            params = {"id": self.league_id}
            print(f"TheSportsDB API request (next events): {url} with params {params}")
            response = self.session.get(url, params=params)
            if response.status_code != 200:
                _logger.error(f"TheSportsDB returned status {response.status_code} for next events")
                return pd.DataFrame()

            data = response.json()
            events = data.get("events", [])
            if not events:
                print("No upcoming events found from TheSportsDB")
                return pd.DataFrame()

            records: list[dict[str, Any]] = []
            for event in events[:max_events]:
                try:
                    date_str = event.get("dateEvent")
                    time_str = event.get("strTime") or "00:00:00"
                    date = pd.to_datetime(f"{date_str} {time_str}") if date_str else None

                    # Team mapping / lookup
                    home_team_id = self._get_team_id_by_name(event.get("strHomeTeam", "")) or self._create_team_from_event(event, "home")
                    away_team_id = self._get_team_id_by_name(event.get("strAwayTeam", "")) or self._create_team_from_event(event, "away")

                    record = {
                        "ext_game_id": event.get("idEvent"),
                        "season": event.get("strSeason"),
                        "date": date,
                        "home_team_id": home_team_id,
                        "away_team_id": away_team_id,
                        "venue": event.get("strVenue"),
                        "home_score": event.get("intHomeScore"),
                        "away_score": event.get("intAwayScore"),
                    }
                    records.append(record)
                except Exception as e:
                    _logger.error(f"Error processing next event {event.get('idEvent')}: {e}")
                    continue

            print(f"Fetched {len(records)} upcoming events from TheSportsDB")
            return pd.DataFrame(records)
        except Exception as e:
            _logger.error(f"Error fetching next events: {e}")
            return pd.DataFrame()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _persist(self, df: pd.DataFrame) -> None:
        """Persist game records, updating scores for existing games."""
        if df.empty:
            print("_persist called with empty DataFrame. Skipping.")
            return

        print(f"_persist attempting to save {len(df)} records.")
        
        # Verify that this is a games dataframe by checking for necessary columns
        if "ext_game_id" not in df.columns:
            _logger.warning(f"DataFrame doesn't contain game data, skipping persistence")
            return

        # Ensure required columns are present
        required_cols = ['ext_game_id', 'season', 'date', 'home_team_id', 'away_team_id']
        
        # Process records for upsert
        records_to_upsert = []
        for _, row in df.iterrows():
            record = {k: v for k, v in row.to_dict().items() if k in Game.__table__.columns}
            records_to_upsert.append(record)
        
        # Perform upsert
        with engine.begin() as conn:
            for record in records_to_upsert:
                # Check if game exists
                stmt = select(Game.id).where(Game.ext_game_id == record["ext_game_id"])
                existing_game_id = conn.execute(stmt).scalar_one_or_none()

                if existing_game_id:
                    # Update existing game if scores are available
                    if pd.notna(record.get("home_score")) and pd.notna(record.get("away_score")):
                        conn.execute(
                            update(Game)
                            .where(Game.id == existing_game_id)
                            .values(
                                home_score=record["home_score"],
                                away_score=record["away_score"]
                            )
                        )
                else:
                    # Insert new game
                    conn.execute(
                        insert(Game)
                        .values(**record)
                    )
        
        print(f"_persist successfully upserted {len(records_to_upsert)} records.")

    def _persist_teams(self, df: pd.DataFrame) -> None:
        """Persist team records to the database."""
        if df.empty:
            return

        with engine.begin() as conn:
            for _, row in df.iterrows():
                conn.execute(
                    insert(Team)
                    .values(**row.to_dict())
                    .prefix_with("OR IGNORE")
                )

    def _persist_players(self, df: pd.DataFrame) -> None:
        """Persist player records to the database."""
        if df.empty:
            return

        with engine.begin() as conn:
            for _, row in df.iterrows():
                conn.execute(
                    insert(Player)
                    .values(**row.to_dict())
                    .prefix_with("OR IGNORE")
                )

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------

    def _get_team_ids_from_db(self) -> List[int]:
        """Get all team IDs from the database."""
        with engine.begin() as conn:
            result = conn.execute(select(Team.id))
            return [row[0] for row in result]

    def _get_team_id_by_name(self, name: str) -> int | None:
        """Look up team ID by name."""
        with engine.begin() as conn:
            result = conn.execute(
                select(Team.id)
                .where(Team.name.ilike(f"%{name}%"))
            ).scalar_one_or_none()
            return result

    def _get_ext_team_id(self, team_id: int) -> int | None:
        """Get external team ID from internal ID."""
        with engine.begin() as conn:
            result = conn.execute(
                select(Team.ext_team_id)
                .where(Team.id == team_id)
            ).scalar_one_or_none()
            return result

    @staticmethod
    def _parse_height(height_str: str) -> int | None:
        """Parse height string to cm."""
        try:
            if "cm" in height_str:
                return int(height_str.split("cm")[0].strip())
            elif "m" in height_str:
                return int(float(height_str.split("m")[0].strip()) * 100)
            return None
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _parse_weight(weight_str: str) -> int | None:
        """Parse weight string to kg."""
        try:
            if "kg" in weight_str:
                return int(weight_str.split("kg")[0].strip())
            elif "lbs" in weight_str:
                return int(float(weight_str.split("lbs")[0].strip()) * 0.453592)
            return None
        except (ValueError, TypeError):
            return None

    # Helper method to create a team when it doesn't exist in our database
    def _create_team_from_event(self, event: dict, team_type: str) -> int | None:
        """Create a team record from event data and return its ID."""
        try:
            prefix = "str" + ("Home" if team_type == "home" else "Away") + "Team"
            team_name = event.get(prefix)
            if not team_name:
                return None
                
            team_id_key = "id" + ("Home" if team_type == "home" else "Away") + "Team"
            ext_team_id = event.get(team_id_key)
            
            with engine.begin() as conn:
                # Insert the team
                conn.execute(
                    insert(Team)
                    .values(
                        ext_team_id=ext_team_id,
                        name=team_name,
                        alias=team_name[:3].upper(),  # Simple alias from first 3 chars
                        league=self.sport
                    )
                    .prefix_with("OR IGNORE")
                )
                
                # Get the team ID
                stmt = select(Team.id).where(Team.name == team_name)
                team_id = conn.execute(stmt).scalar_one_or_none()
                
            return team_id
            
        except Exception as e:
            _logger.error(f"Error creating team from event: {e}")
            return None
