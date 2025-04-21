"""Initial MVP table definitions."""
from __future__ import annotations

import datetime as dt
from enum import Enum
from typing import Optional, List, Union

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sports_intel.db import Base


class League(str, Enum):
    nba = "NBA"


class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ext_team_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True)
    name: Mapped[str] = mapped_column(String(64))
    alias: Mapped[Optional[str]] = mapped_column(String(16))
    league: Mapped[League] = mapped_column(String(8), default=League.nba)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    players: Mapped[List["Player"]] = relationship("Player", back_populates="team")

    __table_args__ = (UniqueConstraint("name", "league", name="uq_team_name_league"),)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ext_player_id: Mapped[Optional[int]] = mapped_column(Integer, unique=True)
    name: Mapped[str] = mapped_column(String(64), index=True)
    position: Mapped[Optional[str]] = mapped_column(String(8))
    height: Mapped[Optional[int]] = mapped_column(Integer)
    weight: Mapped[Optional[int]] = mapped_column(Integer)
    team_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teams.id"))
    team: Mapped[Optional[Team]] = relationship("Team", back_populates="players")


class Game(Base):
    __tablename__ = "games"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ext_game_id: Mapped[Optional[int]] = mapped_column(BigInteger, unique=True)
    season: Mapped[int] = mapped_column(Integer, index=True)
    date: Mapped[dt.date] = mapped_column(Date, index=True)
    home_team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    away_team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    venue: Mapped[Optional[str]] = mapped_column(String(64))
    home_score: Mapped[Optional[int]] = mapped_column(Integer)
    away_score: Mapped[Optional[int]] = mapped_column(Integer)

    @property
    def winner_team_id(self) -> Optional[int]:  # noqa: D401
        """Return team_id of winner if scores available."""
        if self.home_score is None or self.away_score is None:
            return None
        return self.home_team_id if self.home_score > self.away_score else self.away_team_id


class Bet(Base):
    __tablename__ = "bets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow, index=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    market: Mapped[str] = mapped_column(String(32))  # e.g., moneyline, spread, total, prop
    selection: Mapped[str] = mapped_column(String(64))
    stake: Mapped[float] = mapped_column()
    odds: Mapped[float] = mapped_column()
    mode: Mapped[str] = mapped_column(String(16), default="paper")
    profit: Mapped[Optional[float]] = mapped_column(default=None)  # Final profit/loss amount


class OddsLine(Base):
    """Snapshot of sportsbook odds for a given event/game."""

    __tablename__ = "odds_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ts: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow, index=True)
    sportsbook: Mapped[str] = mapped_column(String(32), default="DraftKings")
    event_id: Mapped[int] = mapped_column(BigInteger, index=True)
    game_id: Mapped[Optional[int]] = mapped_column(ForeignKey("games.id"), nullable=True)
    market: Mapped[str] = mapped_column(String(32))  # moneyline, spread, total, prop, etc.
    outcome: Mapped[str] = mapped_column(String(64))  # e.g., home/away, over/under, specific player
    line: Mapped[Optional[float]] = mapped_column()
    odds: Mapped[float] = mapped_column()  # Decimal odds
    event_url: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)  # URL to event page

    # Avoid duplicate snapshots for same timestamp & keys
    __table_args__ = (
        UniqueConstraint("ts", "event_id", "market", "outcome", name="uq_odds_snapshot"),
    )
