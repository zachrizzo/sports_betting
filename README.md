# Sports‑Intel (Local‑First MVP)

End‑to‑end sports betting intelligence platform designed to run entirely on your workstation.

## Quick Start

```bash
# 1.  Install Poetry if you don’t already have it
curl -sSL https://install.python-poetry.org | python3 -

# 2.  Clone & install deps
poetry install

# 3.  Launch Supabase local stack (Postgres + web UI)
#    Requires Docker Desktop running.
poetry run supabase start

# 4.  Initialise DB & run Alembic migrations (none yet)
poetry run sports-intel db init

# 5.  Ingest one season of NBA data (backfill)
poetry run sports-intel ingest nba --season 2023

# 6.  Train baseline model
poetry run sports-intel train baseline
```

## Layout
```
sports_intel/
  core/            # utilities
  ingest/          # data collectors & loaders
  db/              # SQLAlchemy engine & models
  features/        # feature engineering
  ml/              # modelling
  simulation/      # Monte Carlo sims
  betting/         # stake sizing & recommendations
  paper_trade/     # virtual wallet
  cli.py           # Typer command‑line entry
```

Everything is local‑only: Prefect runs in‑process, Supabase bundles PostgreSQL, and all scripts are executed via the Typer CLI.
# sports_betting
