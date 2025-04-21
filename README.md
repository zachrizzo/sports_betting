# Sports Intel Trading Simulation

A system for fetching real sports data from NBA Stats and DraftKings, and running a paper trading simulation.

## Setup

```bash
# Install dependencies
pip install -e .
# Or with Poetry
poetry install
```

## Running the Full Pipeline

The `run_all.sh` script automates the entire process:

```bash
# Run with the current season (2024)
./run_all.sh

# Run with a specific season
./run_all.sh 2023

# Run with a specific season and seed N games if no real data is found
./run_all.sh 2023 10

# Run with a specific season and clear the database first
./run_all.sh 2023 0 clear
```

## Verifying Data and Simulation

Use the `check_data_simulation.py` script to verify data ingestion and simulation:

```bash
# Run full check with current season (2024)
./check_data_simulation.py

# Run with a specific season
./check_data_simulation.py --season 2023

# Skip specific checks
./check_data_simulation.py --skip-nba --skip-odds  # Only run simulation check
```

## Manual Steps

You can also run the individual components manually:

```bash
# Initialize the database
poetry run sports-intel db init

# Fetch NBA stats for season 2023
poetry run sports-intel ingest nba 2023

# Fetch DraftKings odds for season 2023
poetry run sports-intel ingest dk-odds 2023

# Run paper trading simulation
poetry run sports-intel paper-trade season 2023
```

## Troubleshooting

If you encounter issues:

1. Check that the database has been initialized: `poetry run sports-intel db init`
2. Verify NBA data was ingested: Check Game table counts
3. Verify DraftKings odds were ingested: Check OddsLine table counts
4. Make sure games have scores (winner_team_id is not null) for simulation to work

## Data Sources

- NBA game data: stats.nba.com
- Odds data: DraftKings Sportsbook
