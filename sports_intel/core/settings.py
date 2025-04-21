"""Application‑wide settings using manual config."""
from __future__ import annotations

import os
import pathlib


class AppSettings:
    """Simple config resolved from env vars or defaults."""

    def __init__(self):
        # Database URL (SQLite default)
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///sports_intel.db")
        # Project root
        self.project_root = pathlib.Path(__file__).resolve().parents[2]
        # Database
        self.supabase_url = os.getenv("SUPABASE_URL", "http://localhost:54321")
        self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "anon")


settings = AppSettings()
