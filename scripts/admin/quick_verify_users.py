#!/usr/bin/env python3
"""
Quick script to verify all pending users manually
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
    
    # Check unverified users
    cursor.execute("""
        SELECT id, username, email, first_name, last_name, email_verified, status 
        FROM users 
        WHERE email_verified = 0
    """)
    
    unverified_users = cursor.fetchall()
    
    if not unverified_users:
        print("✅ No unverified users found!")
    else:
        print(f"📧 Found {len(unverified_users)} unverified users:")
        print("=" * 50)
        
        for user in unverified_users:
            user_id, username, email, first_name, last_name, email_verified, status = user
            print(f"ID: {user_id}")
            print(f"Name: {first_name} {last_name}")
            print(f"Email: {email}")
            print(f"Username: {username}")
            print(f"Status: {status}")
            print(f"Email Verified: {bool(email_verified)}")
            print("-" * 30)
        
        # Ask for confirmation
        response = input(f"\nDo you want to verify all {len(unverified_users)} users? (y/n): ").strip().lower()
        
        if response == 'y':
            # Update all unverified users
            cursor.execute("""
                UPDATE users 
                SET email_verified = 1, 
                    email_verification_token = NULL,
                    email_verification_expires = NULL
                WHERE email_verified = 0
            """)
            
            conn.commit()
            print(f"✅ Successfully verified {len(unverified_users)} users!")
            print("🎉 They should now appear in your admin panel for approval.")
        else:
            print("❌ Verification cancelled.")
    
    # Check pending approval users
    cursor.execute("""
        SELECT id, username, email, first_name, last_name 
        FROM users 
        WHERE status = 'pending' AND role = 'resident' AND email_verified = 1
    """)
    
    pending_approval = cursor.fetchall()
    
    print(f"\n👤 Users now pending admin approval: {len(pending_approval)}")
    if pending_approval:
        print("These should appear in your admin panel:")
        for user in pending_approval:
            user_id, username, email, first_name, last_name = user
            print(f"  • {first_name} {last_name} ({email})")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
