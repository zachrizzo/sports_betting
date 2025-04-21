"""CLI commands for ingestion flows."""
from __future__ import annotations

import typer

from sports_intel.ingest.nba_stats import NBAStatsProvider
from sports_intel.ingest.dk_odds import DraftKingsNBAOddsProvider
from sports_intel.ingest.sportsdb_provider import TheSportsDBProvider
from sports_intel.ingest.dk_schedule import DraftKingsScheduleProvider
from sports_intel.ingest.dk_player_props import DraftKingsPlayerPropsProvider

ingest_app = typer.Typer(short_help="Data ingestion flows")


@ingest_app.command()
def nba(season: int = typer.Argument(..., help="Season start year, e.g., 2023")) -> None:
    """Backfill NBA schedule for a season."""

    provider = NBAStatsProvider(season)
    provider.backfill()
    typer.echo(f"NBA season {season} schedule ingested.")


@ingest_app.command("dk-odds")
def dk_odds(season: int = typer.Argument(..., help="Season start year, e.g. 2023")) -> None:
    """Backfill NBA DraftKings odds for a season."""
    provider = DraftKingsNBAOddsProvider(season)
    provider.backfill()
    typer.echo(f"DraftKings odds for season {season} ingested.")


@ingest_app.command("sportsdb")
def sportsdb(season: int = typer.Argument(..., help="Season start year, e.g. 2023")) -> None:
    """Backfill sports data using TheSportsDB API."""
    provider = TheSportsDBProvider(season)
    provider.backfill()
    typer.echo(f"TheSportsDB data for season {season} ingested.")


@ingest_app.command("sportsdb-update")
def sportsdb_update(season: int = typer.Option(None, help="Season start year, e.g. 2023")) -> None:
    """Update latest games data from TheSportsDB."""
    provider = TheSportsDBProvider(season)
    provider.update()
    typer.echo("TheSportsDB data updated.")


@ingest_app.command("dk-schedule")
def dk_schedule() -> None:
    """Show upcoming NBA games from DraftKings."""
    provider = DraftKingsScheduleProvider()
    df = provider.fetch_updates()
    if df is None or df.empty:
        df = provider._fetch_upcoming()
        
    if df is None or df.empty:
        typer.echo("No upcoming games found.")
    else:
        typer.echo(df.to_string(index=False))


@ingest_app.command("dk-player-props")
def dk_player_props(
    event_url: str = typer.Argument(..., help="DraftKings event URL or ID (e.g. https://sportsbook.draftkings.com/event/mia-heat-%40-cle-cavaliers/32162077)"),
    category: str = typer.Option(None, help="Filter by category (points, rebounds, assists, threes)")
) -> None:
    """Fetch player props data for a specific DraftKings event."""
    provider = DraftKingsPlayerPropsProvider()
    df = provider.fetch_event_props(event_url, category=category)
    
    if df.empty:
        if category:
            typer.echo(f"No player props found for this event in category: {category}")
        else:
            typer.echo("No player props found for this event.")
    else:
        # Show the applied filter if any
        if category:
            typer.echo(f"Showing props for category: {category}")
            
        # Group by market type for cleaner display
        for market, group in df.groupby('market'):
            typer.echo(f"\n{market}:")
            display_df = group[['player', 'line', 'decimal_odds']].sort_values('decimal_odds')
            typer.echo(display_df.to_string(index=False))
