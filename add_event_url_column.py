"""Script to add event_url column to the odds_lines table."""
from sqlalchemy import create_engine, text

# Create a database engine
db_path = "sqlite:///sports_intel.db"  # Update this if your DB is elsewhere
engine = create_engine(db_path)

with engine.begin() as conn:
    # Add event_url column if it doesn't exist
    conn.execute(text("ALTER TABLE odds_lines ADD COLUMN event_url TEXT"))
    print("Added event_url column to odds_lines table")
    
print("Database schema updated successfully")
