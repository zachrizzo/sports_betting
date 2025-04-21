"""Database‑related CLI sub‑commands."""
from __future__ import annotations

import typer
from alembic import command, config

from sports_intel.db import Base, engine
from sports_intel.db.models import Bet, Game, Player, Team  # noqa: F401 pylint: disable=unused-import


# Typer app

db_app = typer.Typer(short_help="Database utilities")


@db_app.command()
def init() -> None:
    """Drop and recreate all tables (dev shortcut, normally use Alembic migrations).
    # WARNING: this will delete all existing data.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    typer.echo("Database tables dropped and recreated.")


@db_app.command()
def upgrade(revision: str = "head") -> None:
    """Run Alembic upgrade."""

    alembic_cfg = config.Config("alembic.ini")
    command.upgrade(alembic_cfg, revision)
    typer.echo(f"Upgraded to {revision}")
