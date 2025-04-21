"""Minimal NBA Stats ingestion (game schedule endpoint as example)."""
from __future__ import annotations

import datetime as dt
from typing import Iterable
import logging

import pandas as pd
import requests
from sqlalchemy import select
# Use SQLite dialect insert for OR IGNORE support
from sqlalchemy.dialects.sqlite import insert

from sports_intel.db import engine
from sports_intel.db.models import Game, Team
from sports_intel.ingest.provider_base import ProviderBase


class NBAStatsProvider(ProviderBase):
    """Ingest data from stats.nba.com endpoints."""

    sport = "NBA"

    def __init__(self, season: int) -> None:
        super().__init__(season)
        self.base_url = "https://stats.nba.com/stats"  # uses memcache bust param internally
        self.headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.nba.com/",
            "Origin": "https://www.nba.com",
        }

    # ---------------------------------------------------------------------
    # API helpers
    # ---------------------------------------------------------------------

    def _get(self, endpoint: str, params: dict[str, str]) -> list[dict[str, str | int | float]]:
        resp = requests.get(self.base_url + "/" + endpoint, params=params, headers=self.headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        headers = data["resultSets"][0]["headers"]
        rows = data["resultSets"][0]["rowSet"]
        return [dict(zip(headers, row)) for row in rows]

    # ------------------------------------------------------------------
    # ProviderBase implementation
    # ------------------------------------------------------------------

    def iter_backfill(self) -> Iterable[pd.DataFrame]:
        """Backfill game schedule via leaguegamefinder, grouped to one row per game."""
        params = {
            "LeagueID": "00",
            "Season": f"{self.season}-{str(self.season + 1)[-2:]}",
            "SeasonType": "Regular Season",
        }
        data = self._get("leaguegamefinder", params)
        raw = pd.DataFrame(data)
        df = self._clean_cols(raw)
        
        # Check if we have the game_id column, if not look for possible alternatives
        if "game_id" not in df.columns:
            print(f"Available columns: {df.columns.tolist()}")
            # Try to find a suitable game ID column 
            for possible_id in ["game_id", "gameid", "game_code", "game_date_est", "game_sequence"]:
                if possible_id in df.columns:
                    print(f"Using '{possible_id}' as game identifier")
                    game_id_col = possible_id
                    break
            else:
                # If we can't find a game ID column, use a combination of columns to create one
                print("Creating game ID from date and teams")
                if "game_date" in df.columns and "team_id" in df.columns:
                    df["game_id"] = df["game_date"] + "_" + df["team_id"].astype(str)
                    game_id_col = "game_id"
                else:
                    # If we still can't create a game ID, we're stuck
                    print(f"ERROR: Cannot find or create game ID column. Available columns: {df.columns.tolist()}")
                    return
        else:
            game_id_col = "game_id"
            
        games: list[dict[str, str | int]] = []
        # Group two rows per game
        for gid, grp in df.groupby(game_id_col):
            # Check if we have the necessary columns
            if "game_date" not in grp.columns or "matchup" not in grp.columns:
                print(f"Missing required columns. Available: {grp.columns.tolist()}")
                continue
                
            # parse date
            date_str = grp["game_date"].iat[0]
            # parse matchup codes
            matchup = grp["matchup"].iat[0]
            if "@" in matchup:
                away_code, home_code = [p.strip().upper() for p in matchup.split("@")]
            elif " vs " in matchup.lower():
                home_code, away_code = [p.strip().upper() for p in matchup.split("vs")]
            else:
                continue
            # find team names
            try:
                home_row = grp[grp["team_abbreviation"].str.upper() == home_code].iloc[0]
                away_row = grp[grp["team_abbreviation"].str.upper() == away_code].iloc[0]
            except IndexError:
                continue
                
            # Use the original ID from the API
            games.append({
                "game_id": gid,
                "game_date": date_str,
                "home_team_name": home_row["team_name"],
                "visitor_team_name": away_row["team_name"],
            })
        if games:
            yield pd.DataFrame(games)

    def fetch_updates(self) -> pd.DataFrame | None:  # noqa: D401
        today = dt.date.today().strftime("%m/%d/%Y")
        params = {
            "DateFrom": today,
            "DateTo": today,
            "LeagueID": "00",
        }
        data = self._get("scoreboard", params)
        if not data:
            return None
        return self._clean_cols(pd.DataFrame(data))

    # ------------------------------------------------------------------
    # Persistence helper
    # ------------------------------------------------------------------

    def _persist(self, df: pd.DataFrame) -> None:
        # Persist teams and games in SQLite with IGNORE conflicts
        team_map: dict[str, int] = {}
        with engine.begin() as conn:
            for _, row in df.iterrows():
                # Use cleaned column names: 'home_team_name', 'visitor_team_name'
                for prefix in ("home", "visitor"):
                    tname = row[f"{prefix}_team_name"]
                    if tname not in team_map:
                        conn.execute(
                            insert(Team)
                            .values(name=tname, league="NBA")
                            .prefix_with("OR IGNORE")
                        )
                        tid = conn.execute(
                            select(Team.id)
                            .filter_by(name=tname, league="NBA")
                        ).scalar_one()
                        team_map[tname] = tid
                # Insert game, ignore if exists
                conn.execute(
                    insert(Game)
                    .values(
                        ext_game_id=row["game_id"],
                        season=self.season,
                        date=dt.datetime.strptime(row["game_date"], "%Y-%m-%d").date(),
                        home_team_id=team_map[row["home_team_name"]],
                        away_team_id=team_map[row["visitor_team_name"]],
                        venue=row.get("arena_name"),
                    )
                    .prefix_with("OR IGNORE")
                )
