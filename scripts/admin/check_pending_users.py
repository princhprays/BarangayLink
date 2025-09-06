#!/usr/bin/env python3
"""
Check pending users in the database
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
    print("🔍 Checking pending users...")
    print("=" * 50)
    
    # Get all users
    users = User.query.all()
    
    print(f"Total users in database: {len(users)}")
    print()
    
    # Group by status
    status_counts = {}
    for user in users:
        status = user.status
        email_verified = user.email_verified
        status_key = f"{status} (email_verified: {email_verified})"
        status_counts[status_key] = status_counts.get(status_key, 0) + 1
    
    print("Users by status:")
    for status, count in status_counts.items():
        print(f"  {status}: {count}")
    
    print()
    print("Detailed user list:")
    for user in users:
        print(f"  ID: {user.id}")
        print(f"    Username: {user.username}")
        print(f"    Email: {user.email}")
        print(f"    Status: {user.status}")
        print(f"    Email Verified: {user.email_verified}")
        print(f"    Verification Token: {user.email_verification_token[:20] if user.email_verification_token else 'None'}...")
        print(f"    Created: {user.created_at}")
        print()
    
    # Check for users that need email verification
    unverified_users = User.query.filter_by(email_verified=False).all()
    print(f"Users needing email verification: {len(unverified_users)}")
    
    if unverified_users:
        print("\n📧 Users that need to verify their email:")
        for user in unverified_users:
            verification_url = f"http://localhost:3000/verify/{user.email_verification_token}"
            print(f"  {user.email} -> {verification_url}")
    
    # Check for users pending admin approval
    pending_users = User.query.filter_by(status='pending', email_verified=True).all()
    print(f"\n👤 Users pending admin approval: {len(pending_users)}")
    
    if pending_users:
        print("These should appear in your admin panel:")
        for user in pending_users:
            print(f"  {user.email} ({user.get_full_name()})")
