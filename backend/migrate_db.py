#!/usr/bin/env python3
"""
Database migration script to add the is_watchlisted column to the cryptocurrencies table.
This script should be run once to migrate the existing database.
"""

import asyncio
import sqlite3
from pathlib import Path

async def migrate_database():
    """Add is_watchlisted column to cryptocurrencies table."""
    # Path to the database file
    db_path = Path(__file__).parent / "crypto_dashboard.db"
    
    if not db_path.exists():
        print("Database file not found. Creating new database...")
        return
    
    print(f"Migrating database at: {db_path}")
    
    # Connect to the database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    try:
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(cryptocurrencies)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_watchlisted' in columns:
            print("Column 'is_watchlisted' already exists. No migration needed.")
            return
        
        print("Adding 'is_watchlisted' column to cryptocurrencies table...")
        
        # Add the is_watchlisted column with default value False
        cursor.execute("""
            ALTER TABLE cryptocurrencies 
            ADD COLUMN is_watchlisted BOOLEAN DEFAULT 0
        """)
        
        # Create an index on the new column for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_cryptocurrencies_is_watchlisted 
            ON cryptocurrencies(is_watchlisted)
        """)
        
        # Commit the changes
        conn.commit()
        print("Migration completed successfully!")
        
        # Show the updated table structure
        cursor.execute("PRAGMA table_info(cryptocurrencies)")
        columns = cursor.fetchall()
        print("\nUpdated table structure:")
        for column in columns:
            print(f"  {column[1]} ({column[2]})")
        
    except sqlite3.Error as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    asyncio.run(migrate_database())