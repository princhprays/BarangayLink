#!/usr/bin/env python3
"""
Clear User Data Script for BarangayLink

This script safely removes all user-related data from the database
while preserving location data and system configurations.

WARNING: This will permanently delete all user accounts and their data!
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app import app
from database import db
from models.user import User
from models.resident_profile import ResidentProfile
from models.item import Item
from models.item_request import ItemRequest
from models.transaction import Transaction
from models.document_request import DocumentRequest
from models.sos_request import SOSRequest
from models.relocation_request import RelocationRequest
from models.benefit_application import BenefitApplication
from models.announcement import Announcement
from models.activity_log import ActivityLog
from models.jwt_blacklist import JWTBlacklist
from models.location import Location
from models.barangay import Barangay
from models.benefit import Benefit
from models.document_type import DocumentType
from models.community_alert import CommunityAlert

def get_confirmation():
    """Get user confirmation before proceeding"""
    print("⚠️  WARNING: This will permanently delete ALL user data!")
    print("   This includes:")
    print("   - All user accounts")
    print("   - All resident profiles")
    print("   - All marketplace items and requests")
    print("   - All document requests")
    print("   - All SOS and relocation requests")
    print("   - All benefit applications")
    print("   - All announcements")
    print("   - All activity logs")
    print("   - All JWT tokens")
    print()
    print("   The following data will be PRESERVED:")
    print("   - Location data (provinces, municipalities, barangays)")
    print("   - Barangay information")
    print("   - Benefit definitions")
    print("   - Document type definitions")
    print("   - Community alerts")
    print()
    
    while True:
        response = input("Are you sure you want to proceed? Type 'YES' to confirm: ").strip()
        if response == 'YES':
            return True
        elif response.lower() in ['no', 'n', 'cancel', 'exit']:
            return False
        else:
            print("Please type 'YES' to confirm or 'no' to cancel.")

def get_backup_confirmation():
    """Ask if user wants to create a backup"""
    print()
    print("💾 Would you like to create a backup before clearing data?")
    print("   This will create a copy of the current database.")
    
    while True:
        response = input("Create backup? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            return True
        elif response in ['n', 'no']:
            return False
        else:
            print("Please enter 'y' for yes or 'n' for no.")

def create_backup():
    """Create a backup of the current database"""
    try:
        import shutil
        from datetime import datetime
        
        # Get database path
        db_path = Path('backend/instance/barangaylink.db')
        if not db_path.exists():
            print("❌ Database file not found!")
            return False
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = Path(f'backend/instance/barangaylink_backup_{timestamp}.db')
        
        # Copy database file
        shutil.copy2(db_path, backup_path)
        
        print(f"✅ Backup created: {backup_path}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create backup: {str(e)}")
        return False

def clear_user_data():
    """Clear all user-related data from the database"""
    try:
        print("\n🧹 Starting data cleanup...")
        
        # Count records before deletion
        counts_before = {
            'users': User.query.count(),
            'resident_profiles': ResidentProfile.query.count(),
            'items': Item.query.count(),
            'item_requests': ItemRequest.query.count(),
            'transactions': Transaction.query.count(),
            'document_requests': DocumentRequest.query.count(),
            'sos_requests': SOSRequest.query.count(),
            'relocation_requests': RelocationRequest.query.count(),
            'benefit_applications': BenefitApplication.query.count(),
            'announcements': Announcement.query.count(),
            'activity_logs': ActivityLog.query.count(),
            'jwt_tokens': JWTBlacklist.query.count()
        }
        
        print("📊 Records to be deleted:")
        for table, count in counts_before.items():
            print(f"   {table}: {count}")
        
        # Clear data in correct order (respecting foreign key constraints)
        print("\n🗑️  Deleting user data...")
        
        # 1. Clear JWT blacklist (no dependencies)
        JWTBlacklist.query.delete()
        print("   ✅ JWT tokens cleared")
        
        # 2. Clear activity logs (references users)
        ActivityLog.query.delete()
        print("   ✅ Activity logs cleared")
        
        # 3. Clear transactions (references users and items)
        Transaction.query.delete()
        print("   ✅ Transactions cleared")
        
        # 4. Clear item requests (references users and items)
        ItemRequest.query.delete()
        print("   ✅ Item requests cleared")
        
        # 5. Clear document requests (references users)
        DocumentRequest.query.delete()
        print("   ✅ Document requests cleared")
        
        # 6. Clear SOS requests (references users)
        SOSRequest.query.delete()
        print("   ✅ SOS requests cleared")
        
        # 7. Clear relocation requests (references users)
        RelocationRequest.query.delete()
        print("   ✅ Relocation requests cleared")
        
        # 8. Clear benefit applications (references users)
        BenefitApplication.query.delete()
        print("   ✅ Benefit applications cleared")
        
        # 9. Clear announcements (references users)
        Announcement.query.delete()
        print("   ✅ Announcements cleared")
        
        # 10. Clear items (references users)
        Item.query.delete()
        print("   ✅ Items cleared")
        
        # 11. Clear resident profiles (references users)
        ResidentProfile.query.delete()
        print("   ✅ Resident profiles cleared")
        
        # 12. Clear users (main table)
        User.query.delete()
        print("   ✅ Users cleared")
        
        # Commit all changes
        db.session.commit()
        
        print("\n✅ All user data has been successfully cleared!")
        
        # Verify cleanup
        counts_after = {
            'users': User.query.count(),
            'resident_profiles': ResidentProfile.query.count(),
            'items': Item.query.count(),
            'item_requests': ItemRequest.query.count(),
            'transactions': Transaction.query.count(),
            'document_requests': DocumentRequest.query.count(),
            'sos_requests': SOSRequest.query.count(),
            'relocation_requests': RelocationRequest.query.count(),
            'benefit_applications': BenefitApplication.query.count(),
            'announcements': Announcement.query.count(),
            'activity_logs': ActivityLog.query.count(),
            'jwt_tokens': JWTBlacklist.query.count()
        }
        
        print("\n📊 Verification - Records remaining:")
        for table, count in counts_after.items():
            print(f"   {table}: {count}")
        
        # Show preserved data
        preserved_counts = {
            'locations': Location.query.count(),
            'barangays': Barangay.query.count(),
            'benefits': Benefit.query.count(),
            'document_types': DocumentType.query.count(),
            'community_alerts': CommunityAlert.query.count()
        }
        
        print("\n📊 Preserved data:")
        for table, count in preserved_counts.items():
            print(f"   {table}: {count}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        db.session.rollback()
        return False

def main():
    """Main function"""
    print("🧹 BarangayLink User Data Cleanup Tool")
    print("=" * 50)
    
    # Use Flask app context
    with app.app_context():
        # Get confirmation
        if not get_confirmation():
            print("\n❌ Operation cancelled by user.")
            return 1
        
        # Ask about backup
        if get_backup_confirmation():
            if not create_backup():
                print("\n❌ Backup creation failed. Aborting.")
                return 1
        
        # Clear user data
        if clear_user_data():
            print("\n🎉 Database cleanup completed successfully!")
            print("\n📝 Next steps:")
            print("   1. You can now register new users")
            print("   2. All location data is preserved")
            print("   3. System configurations are intact")
            return 0
        else:
            print("\n❌ Database cleanup failed!")
            return 1

if __name__ == "__main__":
    sys.exit(main())
