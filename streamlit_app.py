"""Streamlit UI for Sports‑Intel project.

Provides an interactive dashboard to:
1. Initialize / reset the SQLite database
2. Ingest NBA schedule data from stats.nba.com
3. Ingest DraftKings NBA odds data
4. Ingest sports data from TheSportsDB
5. Run a paper‑trading simulation for a selected season
6. Inspect database tables (Games, Odds, Bets)

Run with:
    streamlit run streamlit_app.py
"""
from __future__ import annotations

import datetime as dt
import logging
from pathlib import Path
from typing import Tuple

import pandas as pd
import streamlit as st
from sqlalchemy import select, func
from sqlalchemy.orm import aliased

# Local package imports
from sports_intel.db import Base, SessionLocal, engine
from sports_intel.db.models import Bet, Game, OddsLine, Team, Player
from sports_intel.ingest.dk_odds import DraftKingsNBAOddsProvider
from sports_intel.ingest.nba_stats import NBAStatsProvider
from sports_intel.ingest.sportsdb_provider import TheSportsDBProvider
from sports_intel.paper_trade.simulator import simulate_season

_logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helper functions (DB access & provider wrappers)
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create all tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """Drop all tables (danger – destructive)."""
    Base.metadata.drop_all(bind=engine)


def ingest_nba_stats(season: int) -> None:
    """Backfill NBA schedule for *season* via NBA Stats API.

    Note: This method is kept for backward compatibility but TheSportsDB is preferred.
    """
    provider = NBAStatsProvider(season)
    provider.backfill()


def ingest_dk_odds(season: int) -> None:
    """Backfill DraftKings odds for *season*. Requires that games already exist."""
    provider = DraftKingsNBAOddsProvider(season)
    provider.backfill()


def ingest_sportsdb(season: int, update_only: bool = False, date_range: Tuple[dt.date, dt.date] = None) -> None:
    """Ingest data from TheSportsDB API for NBA games, teams, and players."""
    provider = TheSportsDBProvider(season)
    if update_only:
        if date_range:
            provider.update_specific_range(*date_range)
        else:
            provider.update()
    else:
        provider.backfill()


def fetch_specific_game(game_id: str) -> None:
    """Fetch detailed data for a specific game."""
    provider = TheSportsDBProvider()
    provider.fetch_game_details(game_id)


def fetch_team_roster(team_id: int) -> None:
    """Fetch detailed roster data for a specific team."""
    provider = TheSportsDBProvider()
    provider.fetch_team_roster(team_id)


def fetch_player_stats(player_id: int) -> None:
    """Fetch historical stats for a specific player."""
    provider = TheSportsDBProvider()
    provider.fetch_player_stats(player_id)


def fetch_event_details(event_url: str, season: int) -> None:
    """Fetch detailed odds for a specific event URL."""
    # Extract event ID from URL if possible
    import re
    event_id_match = re.search(r"/event/.*?/(\d+)", event_url)
    if not event_id_match:
        st.error("Could not extract event ID from URL")
        return

    event_id = int(event_id_match.group(1))
    provider = DraftKingsNBAOddsProvider(season)

    try:
        event_df = provider._fetch_event_details(event_id)
        if event_df.empty:
            st.error(f"No odds data found for event ID {event_id}")
            return

        # Store the data
        provider._persist(event_df)
        st.success(f"Successfully fetched and stored {len(event_df)} odds lines for event ID {event_id}")
    except Exception as e:
        st.error(f"Error fetching event details: {e}")


def load_table_df(model, season: int | None = None) -> pd.DataFrame:
    """Return a DataFrame for *model* limited to *season* if provided."""
    session = SessionLocal()
    try:
        query = select(model)
        if season is not None and hasattr(model, "season"):
            query = query.where(model.season == season)  # type: ignore[attr-defined]
        df = pd.read_sql(query, session.bind)
    finally:
        session.close()
    return df


def get_available_seasons() -> list[int]:
    """Return a list of seasons available for NBA data."""
    current_year = dt.datetime.utcnow().year
    # Return current season and 5 previous seasons
    return list(range(current_year, current_year - 6, -1))


def get_upcoming_games(days: int = 15) -> pd.DataFrame:
    """Get upcoming NBA games from database for the next *days*."""
    session = SessionLocal()
    try:
        today = dt.date.today()
        future = today + dt.timedelta(days=days)

        # Use explicit table aliases
        HomeTeam = aliased(Team)
        AwayTeam = aliased(Team)

        # Build query with aliases
        query = (
            select(
                Game.id,
                Game.ext_game_id,
                Game.season,
                Game.date,
                Game.home_team_id,
                Game.away_team_id,
                Game.venue,
                Game.home_score,
                Game.away_score,
                HomeTeam.name.label('home_team_name'),
                HomeTeam.alias.label('home_team_alias'),
                AwayTeam.name.label('away_team_name'),
                AwayTeam.alias.label('away_team_alias')
            )
            .join(HomeTeam, HomeTeam.id == Game.home_team_id)
            .join(AwayTeam, AwayTeam.id == Game.away_team_id)
            .where(Game.date >= today)
            .where(Game.date <= future)
            .order_by(Game.date)
        )

        df = pd.read_sql(query, session.bind)
    except Exception as e:
        st.error(f"Error fetching upcoming games: {e}")
        df = pd.DataFrame()
    finally:
        session.close()
    return df


def get_teams() -> pd.DataFrame:
    """Get all teams from database."""
    return load_table_df(Team)


def get_players(team_id: int = None) -> pd.DataFrame:
    """Get players from database, filtered by team_id if provided."""
    session = SessionLocal()
    try:
        query = select(Player)
        if team_id is not None:
            query = query.where(Player.team_id == team_id)
        df = pd.read_sql(query, session.bind)
    finally:
        session.close()
    return df


# ---------------------------------------------------------------------------
# Streamlit UI
# ---------------------------------------------------------------------------

def main() -> None:
    st.set_page_config(page_title="Sports‑Intel Dashboard", layout="wide")

    st.title("🏀 Sports‑Intel Dashboard")
    st.markdown(
        "NBA data fetching and analysis dashboard using TheSportsDB API."
    )

    # Sidebar controls ------------------------------------------------------
    with st.sidebar:
        st.header("⚙️ Controls")

        available_seasons = get_available_seasons()
        season = st.selectbox(
            "Season",
            options=available_seasons,
            index=0,
            format_func=lambda x: f"{x}-{x+1}",
        )

        bankroll = st.number_input(
            "Initial bankroll (USD)",
            min_value=100.0,
            value=1000.0,
            step=100.0,
            format="%.2f",
        )

        st.divider()
        if st.button("Initialize DB"):
            with st.spinner("Creating tables …"):
                init_db()
            st.success("Database tables ensured.")

        if st.button("Drop DB (danger)"):
            if st.confirm("Really drop ALL tables? This deletes data irreversibly."):
                with st.spinner("Dropping tables …"):
                    drop_db()
                st.success("All tables dropped.")

    # ---------------------------------------------------------------------
    # Main content (tabs)
    # ---------------------------------------------------------------------
    tabs = st.tabs(["Data Ingestion", "Games", "Teams", "Players", "Odds", "Bets", "Simulation"])

    # Data Ingestion tab ------------------------------------------------------------
    with tabs[0]:
        st.header("Data Ingestion Options")

        fetch_col1, fetch_col2 = st.columns(2)

        with fetch_col1:
            st.subheader("TheSportsDB Data")
            data_source = st.selectbox(
                "Data Source",
                options=["TheSportsDB", "NBA Stats", "DraftKings Odds", "DraftKings Game Detail"],
                index=0
            )

            update_only = False
            if data_source == "TheSportsDB":
                update_only = st.checkbox("Update mode (recent/upcoming data only)", value=False)

            if data_source == "DraftKings Game Detail":
                event_url = st.text_input(
                    "DraftKings event URL",
                    placeholder="https://sportsbook.draftkings.com/event/team-vs-team/12345678"
                )

            if data_source == "TheSportsDB":
                data_mode = st.radio(
                    "Fetching Mode:",
                    options=["Upcoming Games", "Date Range", "Season Backfill"],
                    index=0,
                )

                if data_mode == "Upcoming Games":
                    days_ahead = st.slider("Days to fetch ahead", min_value=1, max_value=30, value=15)
                    if st.button("Fetch Upcoming Games"):
                        with st.spinner(f"Fetching NBA data for next {days_ahead} days..."):
                            try:
                                provider = TheSportsDBProvider(season)
                                provider.update(days_ahead=days_ahead)
                                st.success(f"Successfully fetched upcoming games for the next {days_ahead} days")
                            except Exception as e:
                                st.error(f"Failed to fetch upcoming games: {str(e)}")

                elif data_mode == "Date Range":
                    col1, col2 = st.columns(2)
                    with col1:
                        start_date = st.date_input("Start Date", value=dt.date.today() - dt.timedelta(days=7))
                    with col2:
                        end_date = st.date_input("End Date", value=dt.date.today() + dt.timedelta(days=7))

                    if st.button("Fetch Games in Date Range"):
                        if start_date <= end_date:
                            with st.spinner(f"Fetching NBA data from {start_date} to {end_date}..."):
                                try:
                                    provider = TheSportsDBProvider(season)
                                    provider.update_specific_range(start_date, end_date)
                                    st.success(f"Successfully fetched games from {start_date} to {end_date}")
                                except Exception as e:
                                    st.error(f"Failed to fetch games in date range: {str(e)}")
                        else:
                            st.error("End date must be after start date")

                else:  # Season Backfill
                    st.warning(f"This will attempt to fetch all games for the {season}-{season+1} season. This may not work for future seasons.")
                    if st.button("Backfill Season Data"):
                        with st.spinner(f"Fetching full season data for {season}-{season+1}..."):
                            try:
                                ingest_sportsdb(season, update_only=False)
                                st.success(f"Successfully fetched data for {season}-{season+1} season")
                            except Exception as e:
                                st.error(f"Failed to backfill season data: {str(e)}")

        with fetch_col2:
            st.subheader("Other Data Sources")
            other_source = st.selectbox(
                "Source:",
                options=["DraftKings Odds", "NBA Stats (Legacy)", "DraftKings Game Detail"],
            )

            if other_source == "DraftKings Game Detail":
                event_url = st.text_input(
                    "DraftKings event URL",
                    placeholder="https://sportsbook.draftkings.com/event/team-vs-team/12345678"
                )

            if st.button(f"Fetch from {other_source}"):
                if other_source == "DraftKings Odds":
                    with st.spinner("Fetching DraftKings odds..."):
                        try:
                            ingest_dk_odds(season)
                            st.success("Successfully fetched DraftKings odds")
                        except Exception as e:
                            st.error(f"Failed to fetch odds: {str(e)}")
                elif other_source == "NBA Stats (Legacy)":
                    with st.spinner("Fetching from NBA Stats API (not recommended)..."):
                        try:
                            ingest_nba_stats(season)
                            st.success("Successfully fetched data from NBA Stats API")
                        except Exception as e:
                            st.error(f"Failed to fetch from NBA Stats API: {str(e)}")
                            st.info("We recommend using TheSportsDB instead for more reliable data")
                elif other_source == "DraftKings Game Detail":
                    if not event_url:
                        st.error("Please enter a DraftKings event URL")
                    else:
                        with st.spinner(f"Fetching detailed odds from DraftKings for {event_url}..."):
                            try:
                                fetch_event_details(event_url, season)
                                st.success("Successfully fetched detailed odds from DraftKings!")
                            except Exception as e:
                                st.error(f"Failed to fetch detailed odds: {str(e)}")

    # Games tab ------------------------------------------------------------
    with tabs[1]:
        st.header("NBA Games")

        # Games filtering options
        filter_col1, filter_col2, filter_col3 = st.columns(3)
        with filter_col1:
            filter_option = st.radio("Filter by:", ["Upcoming", "Recent", "All", "Date Range"])

        if filter_option == "Upcoming":
            games_df = get_upcoming_games(days=15)
        elif filter_option == "Recent":
            today = dt.date.today()
            past_date = today - dt.timedelta(days=7)
            session = SessionLocal()
            query = (
                select(Game)
                .where(Game.date >= past_date)
                .where(Game.date <= today)
                .order_by(Game.date.desc())
            )
            games_df = pd.read_sql(query, session.bind)
            session.close()
        elif filter_option == "Date Range":
            with filter_col2:
                start_date = st.date_input("Start Date", value=dt.date.today() - dt.timedelta(days=7))
            with filter_col3:
                end_date = st.date_input("End Date", value=dt.date.today() + dt.timedelta(days=7))

            session = SessionLocal()
            try:
                # Use explicit table aliases
                HomeTeam = aliased(Team)
                AwayTeam = aliased(Team)

                # Build query with aliases
                query = (
                    select(
                        Game.id,
                        Game.ext_game_id,
                        Game.season,
                        Game.date,
                        Game.home_team_id,
                        Game.away_team_id,
                        Game.venue,
                        Game.home_score,
                        Game.away_score,
                        HomeTeam.name.label('home_team_name'),
                        HomeTeam.alias.label('home_team_alias'),
                        AwayTeam.name.label('away_team_name'),
                        AwayTeam.alias.label('away_team_alias')
                    )
                    .join(HomeTeam, HomeTeam.id == Game.home_team_id)
                    .join(AwayTeam, AwayTeam.id == Game.away_team_id)
                    .where(Game.date >= start_date)
                    .where(Game.date <= end_date)
                    .order_by(Game.date)
                )
                games_df = pd.read_sql(query, session.bind)
            finally:
                session.close()
        else:  # All
            games_df = load_table_df(Game, season)

        # Display games
        if not games_df.empty:
            # Enhance with team names
            session = SessionLocal()
            teams_df = pd.read_sql(select(Team), session.bind)
            session.close()

            # Create a mapping from team_id to team_name
            team_map = dict(zip(teams_df['id'], teams_df['name']))

            # Add team names
            if 'home_team_id' in games_df.columns:
                games_df['home_team'] = games_df['home_team_id'].map(team_map)
            if 'away_team_id' in games_df.columns:
                games_df['away_team'] = games_df['away_team_id'].map(team_map)

            # Create a readable format for display
            display_df = games_df.copy()
            if 'home_team' in display_df.columns and 'away_team' in display_df.columns:
                display_df['matchup'] = display_df['away_team'] + ' @ ' + display_df['home_team']

            # Display the games
            st.dataframe(display_df)

            # Game selection for detailed view
            if 'id' in games_df.columns:
                selected_game_id = st.selectbox(
                    "Select a game for detailed view:",
                    options=games_df['id'].tolist(),
                    format_func=lambda x: f"{games_df[games_df['id']==x]['away_team'].values[0]} @ {games_df[games_df['id']==x]['home_team'].values[0]} ({games_df[games_df['id']==x]['date'].values[0]})"
                    if 'away_team' in games_df.columns and 'home_team' in games_df.columns else str(x)
                )

                if st.button("Fetch Detailed Game Data"):
                    with st.spinner("Fetching detailed game data..."):
                        # Here you'd implement logic to get detailed game info from the API
                        st.info("Detailed game data fetching is not yet implemented")
                        # Future implementation: fetch_specific_game(selected_game_id)
        else:
            st.info("No games found; ingest data first.")

    # Teams tab ------------------------------------------------------------
    with tabs[2]:
        st.header("NBA Teams")

        teams_df = get_teams()
        if not teams_df.empty:
            st.dataframe(teams_df)

            selected_team_id = st.selectbox(
                "Select a team to view roster:",
                options=teams_df['id'].tolist(),
                format_func=lambda x: teams_df[teams_df['id']==x]['name'].values[0]
            )

            if st.button("Fetch Team Roster"):
                with st.spinner(f"Fetching roster for {teams_df[teams_df['id']==selected_team_id]['name'].values[0]}..."):
                    players_df = get_players(selected_team_id)
                    if not players_df.empty:
                        st.subheader(f"Roster - {teams_df[teams_df['id']==selected_team_id]['name'].values[0]}")
                        st.dataframe(players_df)
                    else:
                        st.info(f"No players found for this team. Try fetching roster data first.")

                        if st.button("Fetch Players from TheSportsDB"):
                            with st.spinner("Fetching player data..."):
                                try:
                                    provider = TheSportsDBProvider()
                                    provider.fetch_team_roster(selected_team_id)
                                    st.success("Successfully fetched team roster")
                                    # Refresh the view
                                    players_df = get_players(selected_team_id)
                                    if not players_df.empty:
                                        st.dataframe(players_df)
                                except Exception as e:
                                    st.error(f"Failed to fetch team roster: {str(e)}")
        else:
            st.info("No teams found; ingest data first.")

    # Players tab ----------------------------------------------------------
    with tabs[3]:
        st.header("NBA Players")

        players_df = get_players()
        if not players_df.empty:
            # Add filtering options
            filter_options = st.multiselect(
                "Filter by team:",
                options=get_teams()['name'].tolist()
            )

            if filter_options:
                teams_df = get_teams()
                team_ids = teams_df[teams_df['name'].isin(filter_options)]['id'].tolist()
                filtered_players = players_df[players_df['team_id'].isin(team_ids)]
                st.dataframe(filtered_players)

                if not filtered_players.empty:
                    selected_player_id = st.selectbox(
                        "Select a player for detailed stats:",
                        options=filtered_players['id'].tolist(),
                        format_func=lambda x: filtered_players[filtered_players['id']==x]['name'].values[0]
                    )

                    if st.button("Fetch Player Stats"):
                        with st.spinner("Fetching player statistics..."):
                            # Here you would implement the player stats fetching
                            st.info("Player statistics fetching is not yet implemented")
                            # Future implementation: fetch_player_stats(selected_player_id)
            else:
                st.dataframe(players_df)
        else:
            st.info("No players found; ingest team rosters first.")

    # Odds tab ------------------------------------------------------------
    with tabs[4]:
        st.header("Betting Odds")

        odds_df = load_table_df(OddsLine, season)
        if not odds_df.empty:
            # Add filtering options
            filter_col1, filter_col2 = st.columns(2)

            with filter_col1:
                market_filter = st.selectbox(
                    "Filter by market type:",
                    options=["All"] + sorted(odds_df["market"].unique().tolist()),
                )

            with filter_col2:
                sportsbook_filter = st.selectbox(
                    "Filter by sportsbook:",
                    options=["All"] + sorted(odds_df["sportsbook"].unique().tolist()),
                )

            # Apply filters
            filtered_df = odds_df
            if market_filter != "All":
                filtered_df = filtered_df[filtered_df["market"] == market_filter]
            if sportsbook_filter != "All":
                filtered_df = filtered_df[filtered_df["sportsbook"] == sportsbook_filter]

            # Display filtered data
            st.dataframe(filtered_df)

            # Add a section for fetching detailed odds from DraftKings
            st.subheader("Fetch Detailed Odds from DraftKings")
            st.info("Enter a DraftKings event URL to fetch detailed odds including player props and more.")

            dk_url = st.text_input(
                "DraftKings event URL",
                placeholder="https://sportsbook.draftkings.com/event/team-vs-team/12345678"
            )

            if st.button("Fetch Detailed Odds"):
                if not dk_url:
                    st.error("Please enter a valid DraftKings event URL")
                else:
                    with st.spinner("Fetching detailed odds from DraftKings..."):
                        try:
                            fetch_event_details(dk_url, season)
                            # Refresh the odds dataframe after fetching
                            fresh_odds = load_table_df(OddsLine, season)
                            st.success("Detailed odds data fetched successfully!")
                            st.info("Refresh the page to see all new market types in the filter dropdown.")
                        except Exception as e:
                            st.error(f"Failed to fetch detailed odds: {str(e)}")

            # Display events with existing detailed odds
            if 'event_id' in filtered_df.columns:
                unique_events = filtered_df.groupby('event_id')['market'].nunique().reset_index()
                unique_events = unique_events.sort_values('market', ascending=False)

                if not unique_events.empty:
                    st.subheader("Events with Most Market Types")
                    for _, row in unique_events.head(5).iterrows():
                        event_id = row['event_id']
                        market_count = row['market']

                        # Try to find the teams involved
                        event_data = filtered_df[filtered_df['event_id'] == event_id].iloc[0]
                        event_markets = filtered_df[filtered_df['event_id'] == event_id]['market'].unique()

                        if 'game_id' in event_data and event_data['game_id']:
                            session = SessionLocal()
                            game_data = session.execute(
                                select(Game, Team.name.label("home_team"), Team.name.label("away_team"))
                                .join(Team, Team.id == Game.home_team_id)
                                .join(Team, Team.id == Game.away_team_id, isouter=True)
                                .where(Game.id == event_data['game_id'])
                            ).first()
                            session.close()

                            if game_data:
                                teams_display = f"{game_data.away_team} @ {game_data.home_team}"
                                st.markdown(f"**Event ID {event_id}**: {teams_display} ({market_count} markets)")

                                # Show a sample of markets
                                with st.expander(f"Sample of markets for {teams_display}"):
                                    st.write(sorted(event_markets)[:10])
        else:
            st.info("No odds data found; ingest DraftKings odds first.")

    # Bets tab ------------------------------------------------------------
    with tabs[5]:
        st.header("Bets")

        bets_df = load_table_df(Bet, season)
        if not bets_df.empty:
            st.dataframe(bets_df)
        else:
            st.info("No bets found; run a simulation first.")

    # Simulation tab ------------------------------------------------------
    with tabs[6]:
        st.header("Simulation")

        st.subheader("Configure Simulation")
        sim_bankroll = st.number_input(
            "Simulation Bankroll (USD)",
            min_value=100.0,
            value=bankroll,
            step=100.0,
            format="%.2f",
        )

        if st.button("Run Simulation"):
            with st.spinner("Running paper‑trade simulation …"):
                final_bankroll, stats = simulate_season(int(season), float(sim_bankroll))
            st.session_state["last_sim"] = {
                "final_bankroll": final_bankroll,
                "stats": stats,
            }
            st.success("Simulation complete.")

        st.subheader("Simulation Results")
        if "last_sim" in st.session_state:
            sim = st.session_state["last_sim"]
            st.metric("Final Bankroll", f"$ {sim['final_bankroll']:.2f}")
            st.json(sim["stats"], expanded=False)
        else:
            st.info("Run a simulation to see results.")

        # Quick counts summary
        with SessionLocal() as sess:
            game_count = sess.execute(select(func.count()).select_from(Game)).scalar_one()
            team_count = sess.execute(select(func.count()).select_from(Team)).scalar_one()
            player_count = sess.execute(select(func.count()).select_from(Player)).scalar_one()
            odds_count = sess.execute(select(func.count()).select_from(OddsLine)).scalar_one()
            bet_count = sess.execute(select(func.count()).select_from(Bet)).scalar_one()

        col1, col2, col3 = st.columns(3)
        col1.metric("🏀 Teams", f"{team_count}")
        col2.metric("👤 Players", f"{player_count}")
        col3.metric("🎮 Games", f"{game_count}")

        col1, col2 = st.columns(2)
        col1.metric("📈 Odds Lines", f"{odds_count}")
        col2.metric("💵 Bets", f"{bet_count}")


# ----------------------------------------------------------------------------
if __name__ == "__main__":
    main()
