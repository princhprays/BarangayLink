#!/usr/bin/env python3
"""
Script to help verify pending users manually
"""

import sys
import os

# Add the backend directory to the Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))
sys.path.insert(0, backend_path)

# Change to the backend directory
os.chdir(backend_path)

from database import db
from models.user import User
from app import app

with app.app_context():
    print("🔍 Finding users that need email verification...")
    print("=" * 60)
    
    # Find users who haven't verified their email
    unverified_users = User.query.filter_by(email_verified=False).all()
    
    if not unverified_users:
        print("✅ No users need email verification!")
        print("All users have verified their emails.")
    else:
        print(f"📧 Found {len(unverified_users)} users needing email verification:")
        print()
        
        for i, user in enumerate(unverified_users, 1):
            print(f"{i}. {user.get_full_name()} ({user.email})")
            print(f"   Username: {user.username}")
            print(f"   Status: {user.status}")
            print(f"   Created: {user.created_at}")
            
            if user.email_verification_token:
                verification_url = f"http://localhost:3000/verify/{user.email_verification_token}"
                print(f"   Verification URL: {verification_url}")
            else:
                print("   ⚠️  No verification token found!")
            print()
        
        print("🔧 To verify these users:")
        print("1. Copy the verification URLs above")
        print("2. Paste them in your browser")
        print("3. Or use the manual verification script below")
        print()
        
        # Ask if user wants to manually verify
        response = input("Would you like to manually verify all users? (y/n): ").strip().lower()
        
        if response == 'y':
            print("\n🔧 Manually verifying all users...")
            for user in unverified_users:
                # Manually verify the user
                user.email_verified = True
                user.email_verification_token = None
                user.email_verification_expires = None
                print(f"✅ Verified: {user.email}")
            
            db.session.commit()
            print(f"\n🎉 Successfully verified {len(unverified_users)} users!")
            print("They should now appear in your admin panel for approval.")
        else:
            print("\n📝 To verify manually, copy the URLs above and visit them in your browser.")
    
    # Check for users now pending admin approval
    pending_approval = User.query.filter_by(
        status='pending', 
        role='resident', 
        email_verified=True
    ).all()
    
    print(f"\n👤 Users now pending admin approval: {len(pending_approval)}")
    if pending_approval:
        print("These should appear in your admin panel:")
        for user in pending_approval:
            print(f"  • {user.get_full_name()} ({user.email})")
    else:
        print("No users are currently pending admin approval.")
