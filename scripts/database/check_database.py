#!/usr/bin/env python3
"""
BarangayLink Database Check Script
This script shows the current status of the database.
"""

import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app import app
from database import db
from models.user import User
from models.barangay import Barangay
from models.location import Location
from models.benefit import Benefit
from models.announcement import Announcement
from models.document_type import DocumentType
from models.item import Item
from models.resident_profile import ResidentProfile

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"📊 {title}")
    print(f"{'='*60}")

def check_database():
    """Check what's in the database"""
    print_header("BarangayLink Database Status")
    
    with app.app_context():
        try:
            # Check Locations
            print("\n🗺️  Locations")
            print("-" * 40)
            locations = Location.query.count()
            print(f"Total locations: {locations}")
            
            # Check Barangays
            print("\n🏛️  Barangays")
            print("-" * 40)
            barangays = Barangay.query.count()
            print(f"Total barangays: {barangays}")
            
            # Check Users
            print("\n👥 Users")
            print("-" * 40)
            users = User.query.count()
            admins = User.query.filter_by(role='admin').count()
            residents = User.query.filter_by(role='resident').count()
            print(f"Total users: {users}")
            print(f"  - Admins: {admins}")
            print(f"  - Residents: {residents}")
            
            # Check Resident Profiles
            print("\n👤 Resident Profiles")
            print("-" * 40)
            profiles = ResidentProfile.query.count()
            print(f"Total profiles: {profiles}")
            
            # Check Benefits
            print("\n💰 Benefits")
            print("-" * 40)
            benefits = Benefit.query.count()
            print(f"Total benefits: {benefits}")
            
            # Check Announcements
            print("\n📢 Announcements")
            print("-" * 40)
            announcements = Announcement.query.count()
            print(f"Total announcements: {announcements}")
            
            # Check Document Types
            print("\n📋 Document Types")
            print("-" * 40)
            doc_types = DocumentType.query.count()
            print(f"Total document types: {doc_types}")
            
            # Check Items
            print("\n🛒 Marketplace Items")
            print("-" * 40)
            items = Item.query.count()
            print(f"Total items: {items}")
            
            print("\n✅ Database check completed successfully!")
            
        except Exception as e:
            print(f"❌ Error checking database: {str(e)}")
            return False
    
    return True

def main():
    """Main function"""
    print_header("BarangayLink Database Checker")
    
    if check_database():
        return 0
    else:
        return 1

if __name__ == "__main__":
    sys.exit(main())
