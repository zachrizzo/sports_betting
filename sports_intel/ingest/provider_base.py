"""Abstract ingestion provider base class."""
from __future__ import annotations

import abc
from typing import Any, Iterable
import pandas as pd
import re


class ProviderBase(abc.ABC):
    """Defines common interface for data provider connectors."""

    sport: str

    def __init__(self, season: int | None = None) -> None:
        self.season = season

    # Public -----------------------------------------------------------------

    def backfill(self) -> None:
        """Full historical load (blocking)."""

        for df in self.iter_backfill():
            self._persist(df)

    def update(self) -> None:
        """Incremental; fetch latest items only."""

        df = self.fetch_updates()
        if df is not None and not df.empty:
            self._persist(df)

    # Abstract ----------------------------------------------------------------

    @abc.abstractmethod
    def iter_backfill(self) -> Iterable[pd.DataFrame]:
        """Yield chunks of DataFrames for historical load."""

    @abc.abstractmethod
    def fetch_updates(self) -> pd.DataFrame | None:
        """Return a DataFrame of latest incremental updates."""

    # Internal ----------------------------------------------------------------

    @abc.abstractmethod
    def _persist(self, df: pd.DataFrame) -> None:
        """Persist raw records to database (to be implemented per provider)."""

    # Helper ------------------------------------------------------------------

    @staticmethod
    def _clean_cols(df: pd.DataFrame) -> pd.DataFrame:
        # Normalize column names: lowercase, replace non-alphanumeric with underscore, strip extras
        df.columns = [re.sub(r"\W+", "_", str(col).lower()).strip("_") for col in df.columns]
        return df
