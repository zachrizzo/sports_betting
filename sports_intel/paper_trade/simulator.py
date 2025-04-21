"""Simple paper‑trade simulator for a season."""
from __future__ import annotations

import datetime as dt
import random
import logging
from typing import Tuple, Dict, Union, Optional, List, Any

from sqlalchemy.orm import Session

from sports_intel.db import SessionLocal
from sports_intel.db.models import Game, Bet, OddsLine
from sports_intel.betting.kelly import kelly_fraction

_logger = logging.getLogger(__name__)

def simulate_season(season: int, initial_bankroll: float = 1000.0) -> Tuple[float, Dict[str, Union[float, int]]]:
    """
    Run a simple paper‑trade simulation for all games in a season.

    For each game, assigns a random win probability, computes Kelly stake,
    simulates outcome, updates bankroll, and records Bet in DB.

    Returns final bankroll and statistics.
    """
    session: Session = SessionLocal()
    games = session.query(Game).filter(Game.season == season).order_by(Game.date).all()

    if not games:
        _logger.warning(f"No games found for season {season}")
        session.close()
        return initial_bankroll, {"n_bets": 0, "win_rate": 0.0, "roi": 0.0}

    bankroll = initial_bankroll
    n_bets = 0
    wins = 0

    for game in games:
        # Skip games without determined winners
        if game.winner_team_id is None:
            _logger.info(f"Skipping game {game.id} without winner")
            continue

        # Pull latest odds snapshot (moneyline) for the game
        odds_row = (
            session.query(OddsLine)
            .filter(OddsLine.game_id == game.id)
            .filter(OddsLine.market.ilike("%moneyline%"))
            .order_by(OddsLine.ts.desc())
            .first()
        )
        if odds_row is None or odds_row.odds is None:
            _logger.info(f"No odds found for game {game.id}")
            continue

        odds = odds_row.odds
        # naive edge model: bet if implied prob < 0.5
        implied = 1 / odds
        p_win = max(implied + 0.05, implied)  # assume 5% edge
        fraction = kelly_fraction(p_win, odds)
        stake = fraction * bankroll
        if stake <= 0:
            continue

        # Determine actual result
        win = (
            game.winner_team_id == game.home_team_id
            if odds_row.outcome.lower().startswith("home")
            else game.winner_team_id == game.away_team_id
        )
        profit = stake * (odds - 1) if win else -stake
        bankroll += profit
        n_bets += 1
        if win:
            wins += 1

        bet = Bet(
            ts=dt.datetime.utcnow(),
            game_id=game.id,
            market=odds_row.market,
            selection=odds_row.outcome,
            stake=stake,
            odds=odds,
            mode="paper",
            profit=profit,  # Store the profit/loss
        )
        session.add(bet)
        session.commit()

    session.close()
    win_rate = wins / n_bets if n_bets > 0 else 0.0
    roi = (bankroll - initial_bankroll) / initial_bankroll
    stats: Dict[str, Union[float, int]] = {
        "n_bets": n_bets,
        "win_rate": win_rate,
        "roi": roi,
    }
    return bankroll, stats
