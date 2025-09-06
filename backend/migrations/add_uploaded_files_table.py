#!/usr/bin/env python3
"""
Migration script to add the uploaded_files table and update document_requests table
"""

import sqlite3
import os
from datetime import datetime

def run_migration():
    """Run the migration to add uploaded_files table and update document_requests"""
    
    # Get database path
    db_path = os.path.join(os.path.dirname(__file__), '..', 'instance', 'barangaylink.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("Starting migration...")
        
        # Create uploaded_files table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER,
                file_type VARCHAR(50) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                stored_filename VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                upload_purpose VARCHAR(100),
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Add requirement_files column to document_requests table
        cursor.execute('''
            ALTER TABLE document_requests 
            ADD COLUMN requirement_files TEXT
        ''')
        
        # Create indexes for better performance
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id 
            ON uploaded_files (user_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_uploaded_files_entity 
            ON uploaded_files (entity_type, entity_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type 
            ON uploaded_files (file_type)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_uploaded_files_active 
            ON uploaded_files (is_active)
        ''')
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Show table info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='uploaded_files'")
        if cursor.fetchone():
            print("✅ uploaded_files table created")
        
        cursor.execute("PRAGMA table_info(document_requests)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'requirement_files' in columns:
            print("✅ requirement_files column added to document_requests table")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = run_migration()
    if success:
        print("\n🎉 Database migration completed successfully!")
        print("You can now use the enhanced file management system.")
    else:
        print("\n💥 Migration failed. Please check the error messages above.")
