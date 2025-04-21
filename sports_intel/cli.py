"""Typer command‑line interface entry point."""
from __future__ import annotations

import typer

from sports_intel.db.cli import db_app
from sports_intel.ingest.cli import ingest_app
from sports_intel.paper_trade.cli import paper_app

app = typer.Typer(name="sports-intel", help="Sports‑Intel CLI".title())
app.add_typer(db_app, name="db", help="Database utilities")
app.add_typer(ingest_app, name="ingest", help="Data ingestion flows")
app.add_typer(paper_app, name="paper-trade", help="Paper‑Trading simulations")


if __name__ == "__main__":  # pragma: no cover
    app()
