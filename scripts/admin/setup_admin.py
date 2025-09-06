#!/usr/bin/env python3
"""
Admin Account Setup Script for BarangayLink

This script helps you create an admin account for the BarangayLink application.
It provides an interactive interface to select location and create admin users.
"""

import os
import sys
import getpass
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from database import db
from models.user import User
from models.location import Location
from models.resident_profile import ResidentProfile
from models.activity_log import ActivityLog
from app import app

def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    if not (has_upper and has_lower and has_digit):
        return False, "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
    
    return True, "Password is valid"

def select_location():
    """Interactive location selection"""
    print("\n📍 Location Selection")
    print("=" * 30)
    
    # Get provinces
    provinces = Location.get_provinces()
    if not provinces:
        print("❌ No provinces found in database. Please run database setup first.")
        return None, None, None
    
    # Display provinces
    print("\nAvailable Provinces:")
    for i, province in enumerate(provinces, 1):
        print(f"{i:2d}. {province.name}")
    
    # Select province
    while True:
        try:
            choice = int(input(f"\nSelect province (1-{len(provinces)}): "))
            if 1 <= choice <= len(provinces):
                selected_province = provinces[choice - 1]
                break
            else:
                print(f"Please enter a number between 1 and {len(provinces)}")
        except ValueError:
            print("Please enter a valid number")
    
    print(f"✅ Selected Province: {selected_province.name}")
    
    # Get municipalities
    municipalities = Location.get_municipalities_by_province(selected_province.id)
    if not municipalities:
        print("❌ No municipalities found for this province.")
        return None, None, None
    
    # Display municipalities
    print(f"\nAvailable Municipalities/Cities in {selected_province.name}:")
    for i, municipality in enumerate(municipalities, 1):
        print(f"{i:2d}. {municipality.name} ({municipality.geographic_level})")
    
    # Select municipality
    while True:
        try:
            choice = int(input(f"\nSelect municipality/city (1-{len(municipalities)}): "))
            if 1 <= choice <= len(municipalities):
                selected_municipality = municipalities[choice - 1]
                break
            else:
                print(f"Please enter a number between 1 and {len(municipalities)}")
        except ValueError:
            print("Please enter a valid number")
    
    print(f"✅ Selected Municipality: {selected_municipality.name}")
    
    # Get barangays
    barangays = Location.get_barangays_by_municipality(selected_municipality.id)
    if not barangays:
        print("❌ No barangays found for this municipality.")
        return None, None, None
    
    # Display barangays
    print(f"\nAvailable Barangays in {selected_municipality.name}:")
    for i, barangay in enumerate(barangays, 1):
        print(f"{i:2d}. {barangay.name}")
    
    # Select barangay
    while True:
        try:
            choice = int(input(f"\nSelect barangay (1-{len(barangays)}): "))
            if 1 <= choice <= len(barangays):
                selected_barangay = barangays[choice - 1]
                break
            else:
                print(f"Please enter a number between 1 and {len(barangays)}")
        except ValueError:
            print("Please enter a valid number")
    
    print(f"✅ Selected Barangay: {selected_barangay.name}")
    
    return selected_province, selected_municipality, selected_barangay

def get_admin_details():
    """Get admin account details from user"""
    print("\n👤 Admin Account Details")
    print("=" * 30)
    
    # Get basic information
    while True:
        username = input("Username: ").strip()
        if not username:
            print("❌ Username is required!")
            continue
        
        # Check if username already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"❌ Username '{username}' is already taken!")
            continue
        
        break
    
    while True:
        email = input("Email address: ").strip()
        if not email:
            print("❌ Email is required!")
            continue
        
        if '@' not in email:
            print("❌ Please enter a valid email address!")
            continue
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ Email '{email}' is already registered!")
            continue
        
        break
    
    first_name = input("First name: ").strip()
    while not first_name:
        print("❌ First name is required!")
        first_name = input("First name: ").strip()
    
    last_name = input("Last name: ").strip()
    while not last_name:
        print("❌ Last name is required!")
        last_name = input("Last name: ").strip()
    
    middle_name = input("Middle name (optional): ").strip() or None
    
    phone_number = input("Phone number: ").strip()
    while not phone_number:
        print("❌ Phone number is required!")
        phone_number = input("Phone number: ").strip()
    
    complete_address = input("Complete address (optional): ").strip() or None
    
    # Get password
    while True:
        print("\nPassword requirements:")
        print("  • At least 8 characters")
        print("  • At least one uppercase letter")
        print("  • At least one lowercase letter")
        print("  • At least one digit")
        print("  • Special characters recommended")
        
        try:
            password = getpass.getpass("Password: ")
        except (KeyboardInterrupt, EOFError):
            # Fallback to regular input if getpass fails
            print("\n⚠️  Using visible password input (getpass not available)")
            password = input("Password: ")
        
        if not password:
            print("❌ Password is required!")
            continue
        
        valid, message = validate_password(password)
        if not valid:
            print(f"❌ {message}")
            continue
        
        try:
            confirm_password = getpass.getpass("Confirm password: ")
        except (KeyboardInterrupt, EOFError):
            # Fallback to regular input if getpass fails
            confirm_password = input("Confirm password: ")
        
        if password != confirm_password:
            print("❌ Passwords do not match!")
            continue
        
        break
    
    return {
        'username': username,
        'email': email,
        'first_name': first_name,
        'last_name': last_name,
        'middle_name': middle_name,
        'phone_number': phone_number,
        'complete_address': complete_address,
        'password': password
    }

def create_admin_account(admin_data, province, municipality, barangay):
    """Create admin account in database"""
    try:
        # Create admin user
        admin = User(
            username=admin_data['username'],
            email=admin_data['email'],
            first_name=admin_data['first_name'],
            last_name=admin_data['last_name'],
            middle_name=admin_data['middle_name'],
            phone_number=admin_data['phone_number'],
            province_id=province.id,
            municipality_id=municipality.id,
            barangay_id=barangay.id,
            complete_address=admin_data['complete_address'],
            role='admin',
            status='approved',  # Admin accounts are auto-approved
            email_verified=True,  # Admin accounts bypass email verification
            is_active=True
        )
        admin.set_password(admin_data['password'])
        admin.set_phone_number(admin_data['phone_number'])
        
        db.session.add(admin)
        db.session.flush()  # Get the user ID before committing
        
        # Create resident profile (required for all users)
        profile = ResidentProfile(
            user_id=admin.id,
            barangay_id=barangay.id,
            is_verified=True,  # Admin profiles are auto-verified
            verification_notes="Admin account - auto-verified",
            verified_by=admin.id,
            verified_at=db.func.now()
        )
        db.session.add(profile)
        
        # Log activity
        activity = ActivityLog(
            barangay_id=barangay.id,
            user_id=admin.id,
            action='admin_account_created',
            entity_type='user',
            entity_id=admin.id,
            description=f'Admin account created for {admin.email}',
            ip_address='127.0.0.1',  # Local setup
            user_agent='Admin Setup Script'
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return admin
        
    except Exception as e:
        db.session.rollback()
        raise e

def list_existing_admins():
    """List existing admin accounts"""
    admins = User.query.filter_by(role='admin').all()
    
    if not admins:
        print("📋 No admin accounts found.")
        return
    
    print("\n📋 Existing Admin Accounts:")
    print("=" * 50)
    for admin in admins:
        status_icon = "✅" if admin.status == 'approved' else "⏳" if admin.status == 'pending' else "❌"
        verified_icon = "✅" if admin.email_verified else "❌"
        location = admin.get_location_string() if admin.barangay else "No location"
        
        print(f"{status_icon} {admin.username} ({admin.email})")
        print(f"   Name: {admin.get_full_name()}")
        print(f"   Status: {admin.status} | Email Verified: {verified_icon}")
        print(f"   Location: {location}")
        print(f"   Created: {admin.created_at.strftime('%Y-%m-%d %H:%M')}")
        print()

def main():
    """Main setup function"""
    print("Welcome to BarangayLink Admin Account Setup!")
    print()
    
    # Use the Flask app directly
    with app.app_context():
        # Check if database is initialized
        try:
            # Test database connection
            Location.query.first()
        except Exception as e:
            print("❌ Database not initialized or accessible.")
            print("   Please run 'python scripts/setup/setup.py' first.")
            return 1
        
        # Show existing admins
        list_existing_admins()
        
        # Ask if user wants to create another admin
        while True:
            choice = input("\nDo you want to create a new admin account? (y/n): ").strip().lower()
            if choice in ['y', 'yes']:
                break
            elif choice in ['n', 'no']:
                print("✅ Admin setup completed.")
                return 0
            else:
                print("Please enter 'y' or 'n'")
        
        try:
            # Get location selection
            province, municipality, barangay = select_location()
            if not all([province, municipality, barangay]):
                print("❌ Location selection failed.")
                return 1
            
            # Get admin details
            admin_data = get_admin_details()
            
            # Confirm creation
            print(f"\n📋 Admin Account Summary:")
            print("=" * 40)
            print(f"Username: {admin_data['username']}")
            print(f"Email: {admin_data['email']}")
            print(f"Name: {admin_data['first_name']} {admin_data['middle_name'] or ''} {admin_data['last_name']}".strip())
            print(f"Phone: {admin_data['phone_number']}")
            print(f"Location: {barangay.name}, {municipality.name}, {province.name}")
            print(f"Role: Admin (Auto-approved)")
            
            while True:
                confirm = input(f"\nCreate this admin account? (y/n): ").strip().lower()
                if confirm in ['y', 'yes']:
                    break
                elif confirm in ['n', 'no']:
                    print("❌ Admin account creation cancelled.")
                    return 0
                else:
                    print("Please enter 'y' or 'n'")
            
            # Create admin account
            print("\n🔄 Creating admin account...")
            admin = create_admin_account(admin_data, province, municipality, barangay)
            
            print("✅ Admin account created successfully!")
            print(f"\n📋 Account Details:")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Name: {admin.get_full_name()}")
            print(f"   Location: {admin.get_location_string()}")
            print(f"   Status: {admin.status}")
            print(f"   Email Verified: {'Yes' if admin.email_verified else 'No'}")
            
            print(f"\n📝 Next steps:")
            print("   1. Start the backend server: python scripts/servers/run_backend.py")
            print("   2. Start the frontend server: python scripts/servers/run_frontend.py")
            print("   3. Login with your admin credentials")
            print("   4. Access the admin dashboard to manage the system")
            
            return 0
            
        except Exception as e:
            print(f"❌ Error creating admin account: {str(e)}")
            return 1

if __name__ == "__main__":
    sys.exit(main())
