#!/usr/bin/env python3
"""
Check user uploaded files in database
"""

import sqlite3
import os

# Path to your database
db_path = "backend/instance/barangaylink.db"

if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    exit(1)

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check user files
    cursor.execute("""
        SELECT id, username, email, first_name, last_name, 
               valid_id_path, selfie_with_id_path, profile_picture_url
        FROM users 
        WHERE email_verified = 1 AND status = 'pending'
    """)
    
    users = cursor.fetchall()
    
    if not users:
        print("❌ No verified pending users found!")
    else:
        print(f"📁 Found {len(users)} verified pending users with files:")
        print("=" * 70)
        
        for user in users:
            user_id, username, email, first_name, last_name, valid_id_path, selfie_path, profile_pic = user
            print(f"User ID: {user_id}")
            print(f"Name: {first_name} {last_name}")
            print(f"Email: {email}")
            print(f"Username: {username}")
            print(f"Valid ID Path: {valid_id_path}")
            print(f"Selfie Path: {selfie_path}")
            print(f"Profile Picture: {profile_pic}")
            
            # Check if files exist
            if valid_id_path:
                full_path = f"backend/uploads/temp/{valid_id_path}"
                exists = "✅ EXISTS" if os.path.exists(full_path) else "❌ MISSING"
                print(f"  Valid ID File: {exists} ({full_path})")
            
            if selfie_path:
                full_path = f"backend/uploads/temp/{selfie_path}"
                exists = "✅ EXISTS" if os.path.exists(full_path) else "❌ MISSING"
                print(f"  Selfie File: {exists} ({full_path})")
            
            if profile_pic:
                full_path = f"backend/uploads/temp/{profile_pic}"
                exists = "✅ EXISTS" if os.path.exists(full_path) else "❌ MISSING"
                print(f"  Profile Pic: {exists} ({full_path})")
            
            print("-" * 50)
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
