"""Paper‑trading CLI commands for simulation."""
from __future__ import annotations

import typer
import datetime as dt

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from sports_intel.db import engine, SessionLocal, Base
from sports_intel.db.models import Game, Team
from sports_intel.paper_trade.simulator import simulate_season

paper_app = typer.Typer(name="paper-trade", help="Paper‑Trading simulations")

@paper_app.command("season")
def simulate_season_cmd(
    season: int = typer.Argument(..., help="Season to simulate, e.g. 2023"),
    initial_bankroll: float = typer.Option(1000.0, help="Initial bankroll amount"),
    seed_games: int = typer.Option(
        0,
        help="Number of dummy games to seed for simulation if no games found",
    ),
) -> None:
    """Simulate paper trading for a given season."""
    # ensure tables exist
    Base.metadata.create_all(bind=engine)
    session: Session = SessionLocal()
    # seed dummy games if requested and none exist
    # Use direct COUNT() to avoid loading all columns
    count = session.execute(
        select(func.count()).select_from(Game).where(Game.season == season)
    ).scalar_one()
    if seed_games > 0 and count == 0:
        teams = session.query(Team).all()
        if len(teams) < 2:
            # create two dummy teams
            t1 = Team(name="Team A", league="NBA")
            t2 = Team(name="Team B", league="NBA")
            session.add_all([t1, t2])
            session.commit()
            teams = [t1, t2]
        # seed games
        for i in range(seed_games):
            date = dt.date(season, 1, 1) + dt.timedelta(days=i)
            game = Game(
                ext_game_id=1000 + i,
                season=season,
                date=date,
                home_team_id=teams[0].id,
                away_team_id=teams[1].id,
                venue="Simulator Arena",
            )
            session.add(game)
        session.commit()
        typer.echo(f"Seeded {seed_games} dummy games for season {season}.")
    session.close()
    # run simulation
    final_bankroll, stats = simulate_season(season, initial_bankroll)
    typer.echo(f"Final bankroll: {final_bankroll:.2f}")
    typer.echo(f"Stats: {stats}")
