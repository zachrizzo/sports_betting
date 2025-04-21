"""DraftKings Sportsbook odds ingestion provider (NBA only)."""
from __future__ import annotations

import datetime as dt
import logging
import json
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple
import pandas as pd
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy import select
from playwright.sync_api import sync_playwright
from sports_intel.ingest.provider_base import ProviderBase
from sports_intel.db import engine
from sports_intel.db.models import OddsLine, Team, Game

_logger = logging.getLogger(__name__)

# DraftKings sport id mapping – NBA = 42648 (US Sportsbook)
NBA_SPORT_ID = 42648
BASE_URL = "https://sportsbook.draftkings.com/sites/US-AZ-SB/api/v5/eventgroups/{sport_id}"

class DraftKingsNBAOddsProvider(ProviderBase):
    """Pull moneyline / spread / total odds for NBA games."""

    sport = "NBA"

    def __init__(self, season: int | None = None) -> None:
        super().__init__(season)
        self.sport_id = NBA_SPORT_ID
        self.base_url = BASE_URL.format(sport_id=self.sport_id)
        # mimic browser headers to avoid blocking
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "https://sportsbook.draftkings.com/",
        }
        # no longer using direct HTTP session for API

    # ------------------------------------------------------------------
    # Provider implementation
    # ------------------------------------------------------------------

    def iter_backfill(self) -> Iterable[pd.DataFrame]:
        """Backfill odds by fetching only dates with scheduled games."""
        if self.season is None:
            raise ValueError("Backfill requires season param")
        # get distinct game dates for season from DB
        from sports_intel.db.models import Game
        from sqlalchemy import select
        with engine.begin() as conn:
            result = conn.execute(
                select(Game.date).where(Game.season == self.season).distinct()
            )
            dates = [row[0] for row in result]
        for day in sorted(dates):
            df = self._fetch_day(day)
            if not df.empty:
                yield df

                # Fetch detailed odds for each game event if available
                event_ids = df['event_id'].unique()
                for event_id in event_ids:
                    try:
                        event_df = self._fetch_event_details(event_id)
                        if not event_df.empty:
                            yield event_df
                    except Exception as e:
                        _logger.error(f"Error fetching event details for {event_id}: {e}")

    def fetch_updates(self) -> pd.DataFrame | None:  # noqa: D401
        """Fetch today's odds and detailed event data for upcoming games."""
        today_df = self._fetch_day(dt.date.today())
        if today_df.empty:
            return None

        # For each event today, fetch detailed odds
        all_dfs = [today_df]
        event_ids = today_df['event_id'].unique()
        for event_id in event_ids:
            try:
                event_df = self._fetch_event_details(event_id)
                if not event_df.empty:
                    all_dfs.append(event_df)
            except Exception as e:
                _logger.error(f"Error fetching event details for {event_id}: {e}")

        # Combine all dataframes
        if len(all_dfs) > 1:
            return pd.concat(all_dfs, ignore_index=True)
        return today_df

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_day(self, day: dt.date) -> pd.DataFrame:
        """Fetch odds JSON directly from DraftKings API endpoint."""
        # Use Playwright to render page and extract Next.js JSON
        slug = self.sport.lower()
        url = f"https://sportsbook.draftkings.com/leagues/basketball/{slug}?subcategory={day.isoformat()}"
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers(self.headers)
                page.goto(url, timeout=45000, wait_until="networkidle")
                json_text = page.text_content("script#__NEXT_DATA__")
                browser.close()
            data = json.loads(json_text or "{}")
        except Exception as e:
            _logger.error("Page render/extract failed for %s: %s", url, e)
            return pd.DataFrame()
        # traverse payload to find eventGroup
        def find_eventgroup(obj: Any) -> dict | None:
            if isinstance(obj, dict):
                if "eventGroup" in obj and "events" in obj.get("eventGroup", {}):
                    return obj["eventGroup"]
                for v in obj.values():
                    res = find_eventgroup(v)
                    if res:
                        return res
            elif isinstance(obj, list):
                for item in obj:
                    res = find_eventgroup(item)
                    if res:
                        return res
            return None
        eg = find_eventgroup(data)
        if not eg:
            _logger.error("No eventGroup found in payload for %s", url)
            return pd.DataFrame()
        events = {e["eventId"]: e for e in eg.get("events", [])}
        team_rows = self._load_team_rows()
        records: List[Dict[str, Any]] = []
        for cat in eg.get("offerCategories", []):
            for subcat in cat.get("offerSubcategoryDescriptors", []):
                for offer in subcat.get("offerSubcategory", {}).get("offers", []):
                    event_id = offer.get("eventId")
                    evt = events.get(event_id)
                    if not evt:
                        continue
                    game_date = dt.datetime.fromtimestamp(
                        evt["startDate"] / 1000
                    ).date()

                    # Attempt rudimentary mapping to Game by team names & date
                    home_name, away_name = self._parse_event_name(evt.get("name", ""))
                    game_id = self._lookup_game_id(game_date, home_name, away_name, team_rows)

                    # Store the event URL for later detailed fetching
                    event_url = None
                    if 'eventPath' in evt:
                        event_url = f"https://sportsbook.draftkings.com{evt['eventPath']}"

                    for outcome in offer.get("outcomes", []):
                        rec = {
                            "ts": dt.datetime.utcnow(),
                            "sportsbook": "DraftKings",
                            "event_id": event_id,
                            "game_id": game_id,
                            "market": offer.get("label", subcat.get("name", "")),
                            "outcome": outcome.get("label"),
                            "line": outcome.get("line"),
                            "odds": self._to_decimal_odds(outcome.get("oddsAmerican")),
                            "event_url": event_url  # Store for reference
                        }
                        records.append(rec)
        if records:
            return pd.DataFrame(records)
        return pd.DataFrame()

    def _fetch_event_details(self, event_id: int) -> pd.DataFrame:
        """Fetch detailed odds for a specific event from its dedicated page."""
        # First, find the event URL
        with engine.begin() as conn:
            result = conn.execute(
                select(OddsLine.event_url).where(OddsLine.event_id == event_id).limit(1)
            ).scalar_one_or_none()

        event_url = result
        if not event_url:
            # Try to construct the URL from the main page if we don't have it
            url = f"https://sportsbook.draftkings.com/leagues/basketball/{self.sport.lower()}"
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers(self.headers)
                page.goto(url, timeout=45000, wait_until="networkidle")
                json_text = page.text_content("script#__NEXT_DATA__")
                browser.close()

            data = json.loads(json_text or "{}")
            eg = self._find_eventgroup(data)
            if eg:
                events = {str(e["eventId"]): e for e in eg.get("events", [])}
                evt = events.get(str(event_id))
                if evt and 'eventPath' in evt:
                    event_url = f"https://sportsbook.draftkings.com{evt['eventPath']}"

        if not event_url:
            _logger.error(f"Could not find URL for event ID {event_id}")
            return pd.DataFrame()

        # Now fetch the detailed event page
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_extra_http_headers(self.headers)
                page.goto(event_url, timeout=45000, wait_until="networkidle")
                json_text = page.text_content("script#__NEXT_DATA__")
                browser.close()

            data = json.loads(json_text or "{}")
            # Find game data in the event page
            game_data = self._find_event_data(data, event_id)
            if not game_data:
                _logger.error(f"No event data found for {event_id} at {event_url}")
                return pd.DataFrame()

            # Extract team info and all available odds
            team_rows = self._load_team_rows()
            game_date = dt.datetime.fromtimestamp(
                game_data.get("startDate", 0) / 1000
            ).date()
            home_name, away_name = self._parse_event_name(game_data.get("name", ""))
            game_id = self._lookup_game_id(game_date, home_name, away_name, team_rows)

            # Process all markets and odds
            records = []
            offer_categories = game_data.get("eventCategories", [])
            for category in offer_categories:
                cat_name = category.get("name", "")
                for subcat in category.get("componentizedOfferCategories", []):
                    subcat_name = subcat.get("name", "")
                    for offer_container in subcat.get("offerCategories", []):
                        for offer in offer_container.get("offers", []):
                            market_name = offer.get("label", "")
                            # Create full market name with category context
                            full_market = f"{cat_name} - {subcat_name} - {market_name}"

                            for outcome in offer.get("outcomes", []):
                                rec = {
                                    "ts": dt.datetime.utcnow(),
                                    "sportsbook": "DraftKings",
                                    "event_id": event_id,
                                    "game_id": game_id,
                                    "market": full_market,
                                    "outcome": outcome.get("label"),
                                    "line": outcome.get("line"),
                                    "odds": self._to_decimal_odds(outcome.get("oddsAmerican")),
                                    "event_url": event_url
                                }
                                records.append(rec)

            if records:
                return pd.DataFrame(records)

        except Exception as e:
            _logger.error(f"Error fetching event page {event_url}: {e}")

        return pd.DataFrame()

    def _find_eventgroup(self, data: Dict[str, Any]) -> Dict[str, Any] | None:
        """Find the eventGroup object in the Next.js data structure."""
        if isinstance(data, dict):
            if "eventGroup" in data and "events" in data.get("eventGroup", {}):
                return data["eventGroup"]
            for v in data.values():
                res = self._find_eventgroup(v)
                if res:
                    return res
        elif isinstance(data, list):
            for item in data:
                res = self._find_eventgroup(item)
                if res:
                    return res
        return None

    def _find_event_data(self, data: Dict[str, Any], event_id: int) -> Dict[str, Any] | None:
        """Find the specific event data in the Next.js data structure."""
        # First look for the event in the typical structure
        def _recurse_find_event(obj: Any, target_id: int) -> Dict[str, Any] | None:
            if isinstance(obj, dict):
                if obj.get("eventId") == target_id:
                    return obj
                for v in obj.values():
                    res = _recurse_find_event(v, target_id)
                    if res:
                        return res
            elif isinstance(obj, list):
                for item in obj:
                    res = _recurse_find_event(item, target_id)
                    if res:
                        return res
            return None

        return _recurse_find_event(data, event_id)

    def _persist(self, df: pd.DataFrame) -> None:
        """Store odds data to database, ignoring any duplicate entries."""
        if 'event_url' in df.columns:
            # Remove the event_url column before persisting since it's not in our model
            df = df.drop(columns=['event_url'])

        with engine.begin() as conn:
            for _, row in df.iterrows():
                conn.execute(
                    insert(OddsLine)
                    .values(**row.to_dict())
                    .prefix_with("OR IGNORE")
                )

    # ------------------------------------------------------------------
    # Utility helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _to_decimal_odds(american: int | None) -> float | None:
        """Convert American odds to decimal (e.g., +150 -> 2.5)."""
        if american is None:
            return None
        if american > 0:
            return (american / 100) + 1
        return (100 / abs(american)) + 1

    @staticmethod
    def _parse_event_name(name: str) -> tuple[str | None, str | None]:
        # "Lakers @ Warriors" -> away, home
        if "@" in name:
            away, home = [p.strip() for p in name.split("@", 1)]
            return home, away  # we treat first as home in DB
        if " at " in name.lower():
            away, home = [p.strip() for p in name.split(" at ", 1)]
            return home, away
        return None, None

    @staticmethod
    def _lookup_game_id(date: dt.date, home_name: str | None, away_name: str | None, team_rows: Dict[str, int]) -> int | None:
        if not home_name or not away_name:
            return None
        with engine.begin() as conn:
            home_id = team_rows.get(home_name.lower())
            away_id = team_rows.get(away_name.lower())
            if home_id and away_id:
                res = conn.execute(
                    select(Game.id)
                    .filter(Game.date == date)
                    .filter(Game.home_team_id == home_id)
                    .filter(Game.away_team_id == away_id)
                ).scalar_one_or_none()
                return res
        return None

    @staticmethod
    def _load_team_rows() -> Dict[str, int]:
        with engine.begin() as conn:
            rows = conn.execute(select(Team.id, Team.name)).all()
        return {name.lower(): tid for tid, name in rows}
