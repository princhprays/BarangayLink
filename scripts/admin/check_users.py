#!/usr/bin/env python3
"""
User Checker Script - View user information and status
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app import app
from database import db
from models.user import User
from models.resident_profile import ResidentProfile
from models.location import Location

def display_user_info(user):
    """Display detailed user information"""
    print(f"\n👤 User ID: {user.id}")
    print(f"📧 Email: {user.email}")
    print(f"👤 Username: {user.username}")
    print(f"📝 Name: {user.first_name} {user.middle_name or ''} {user.last_name}".strip())
    print(f"📱 Phone: {user.phone_number or 'Not provided'}")
    print(f"🏢 Role: {user.role}")
    print(f"📊 Status: {user.status}")
    print(f"✅ Email Verified: {'Yes' if user.email_verified else 'No'}")
    print(f"🔄 Active: {'Yes' if user.is_active else 'No'}")
    print(f"📅 Created: {user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'Unknown'}")
    print(f"🕒 Last Login: {user.last_login.strftime('%Y-%m-%d %H:%M') if user.last_login else 'Never'}")
    
    # Location info
    if user.barangay_id:
        barangay = db.session.get(Location, user.barangay_id)
        if barangay:
            print(f"🏘️ Barangay: {barangay.name}")
            
            # Get municipality/city
            if barangay.parent_id:
                municipality = db.session.get(Location, barangay.parent_id)
                if municipality:
                    print(f"🏙️ Municipality/City: {municipality.name}")
                    
                    # Get province
                    if municipality.parent_id:
                        province = db.session.get(Location, municipality.parent_id)
                        if province:
                            print(f"🏞️ Province: {province.name}")
    
    # File uploads
    print(f"📄 Valid ID: {'✓ Uploaded' if user.valid_id_path else '✗ Not uploaded'}")
    print(f"📸 Selfie: {'✓ Uploaded' if user.selfie_with_id_path else '✗ Not uploaded'}")
    print(f"🖼️ Profile Pic: {'✓ Uploaded' if user.profile_picture_url else '✗ Not uploaded'}")
    
    # Rejection reason if applicable
    if user.status == 'rejected' and user.rejection_reason:
        print(f"❌ Rejection Reason: {user.rejection_reason}")
    
    print("-" * 60)

def list_all_users():
    """List all users with basic info"""
    users = User.query.all()
    
    if not users:
        print("❌ No users found in database")
        return
    
    print(f"📊 Total Users: {len(users)}")
    print("=" * 80)
    
    for user in users:
        print(f"ID: {user.id:3d} | {user.username:15s} | {user.email:25s} | {user.role:8s} | {user.status:8s} | {'✓' if user.email_verified else '✗'}")
    
    print("=" * 80)

def search_users():
    """Search for specific users"""
    print("\n🔍 Search Options:")
    print("1. Search by email")
    print("2. Search by username")
    print("3. Search by name")
    print("4. Search by status")
    print("5. Search by role")
    
    choice = input("\nEnter choice (1-5): ").strip()
    
    if choice == "1":
        email = input("Enter email: ").strip()
        users = User.query.filter(User.email.contains(email)).all()
    elif choice == "2":
        username = input("Enter username: ").strip()
        users = User.query.filter(User.username.contains(username)).all()
    elif choice == "3":
        name = input("Enter name (first, last, or middle): ").strip()
        users = User.query.filter(
            (User.first_name.contains(name)) |
            (User.last_name.contains(name)) |
            (User.middle_name.contains(name))
        ).all()
    elif choice == "4":
        status = input("Enter status (pending/approved/rejected): ").strip()
        users = User.query.filter_by(status=status).all()
    elif choice == "5":
        role = input("Enter role (resident/admin): ").strip()
        users = User.query.filter_by(role=role).all()
    else:
        print("❌ Invalid choice")
        return
    
    if not users:
        print("❌ No users found matching your search")
        return
    
    print(f"\n📊 Found {len(users)} user(s):")
    print("=" * 80)
    
    for user in users:
        display_user_info(user)

def view_user_details():
    """View detailed information for a specific user"""
    user_id = input("\nEnter User ID: ").strip()
    
    try:
        user_id = int(user_id)
        user = db.session.get(User, user_id)
        
        if not user:
            print(f"❌ User with ID {user_id} not found")
            return
        
        display_user_info(user)
        
    except ValueError:
        print("❌ Invalid User ID")

def check_user_stats():
    """Display user statistics"""
    total_users = User.query.count()
    pending_users = User.query.filter_by(status='pending').count()
    approved_users = User.query.filter_by(status='approved').count()
    rejected_users = User.query.filter_by(status='rejected').count()
    verified_users = User.query.filter_by(email_verified=True).count()
    admin_users = User.query.filter_by(role='admin').count()
    resident_users = User.query.filter_by(role='resident').count()
    
    print("\n📊 User Statistics:")
    print("=" * 40)
    print(f"Total Users: {total_users}")
    print(f"Pending: {pending_users}")
    print(f"Approved: {approved_users}")
    print(f"Rejected: {rejected_users}")
    print(f"Email Verified: {verified_users}")
    print(f"Admins: {admin_users}")
    print(f"Residents: {resident_users}")
    print("=" * 40)

def main():
    """Main menu"""
    with app.app_context():
        while True:
            print("\n🔍 User Checker")
            print("=" * 30)
            print("1. List all users")
            print("2. Search users")
            print("3. View user details")
            print("4. Check user statistics")
            print("5. Exit")
            
            choice = input("\nEnter choice (1-5): ").strip()
            
            if choice == "1":
                list_all_users()
            elif choice == "2":
                search_users()
            elif choice == "3":
                view_user_details()
            elif choice == "4":
                check_user_stats()
            elif choice == "5":
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice")

if __name__ == "__main__":
    main()
