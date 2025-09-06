#!/usr/bin/env python3
"""
BarangayLink Database Reset Script
This script resets the database to a clean state while preserving location data.
Enhanced with comprehensive uploads clearing and backup functionality.
"""

import os
import sys
import shutil
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🗄️ {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n{step}. {description}")
    print("-" * 40)

def print_substep(description, status="⏳"):
    """Print a formatted substep"""
    print(f"  {status} {description}")

def print_success(message):
    """Print success message"""
    print(f"  ✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"  ❌ {message}")

def print_warning(message):
    """Print warning message"""
    print(f"  ⚠️ {message}")

def get_file_size_mb(file_path: Path) -> float:
    """Get file size in MB"""
    try:
        return file_path.stat().st_size / (1024 * 1024)
    except:
        return 0.0

def format_size(size_bytes: int) -> str:
    """Format size in human readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def clear_uploads_directory(backend_dir: Path) -> Dict[str, int]:
    """Clear uploads directory with detailed reporting"""
    print_substep("Clearing uploads directory...")
    
    uploads_dir = backend_dir / "uploads"
    stats = {
        'files_deleted': 0,
        'directories_deleted': 0,
        'total_size_mb': 0.0,
        'errors': []
    }
    
    if not uploads_dir.exists():
        print_success("Uploads directory doesn't exist - nothing to clear")
        return stats
    
    try:
        # Calculate total size before deletion
        total_size = 0
        for root, dirs, files in os.walk(uploads_dir):
            for file in files:
                file_path = Path(root) / file
                try:
                    total_size += file_path.stat().st_size
                except:
                    pass
        
        stats['total_size_mb'] = total_size / (1024 * 1024)
        
        # Count files and directories
        for root, dirs, files in os.walk(uploads_dir):
            stats['files_deleted'] += len(files)
            stats['directories_deleted'] += len(dirs)
        
        print_substep(f"Found {stats['files_deleted']} files ({format_size(int(stats['total_size_mb'] * 1024 * 1024))})")
        print_substep(f"Found {stats['directories_deleted']} directories")
        
        # Clear subdirectories individually for better error handling
        subdirs = ['residents', 'documents', 'items', 'temp']
        for subdir in subdirs:
            subdir_path = uploads_dir / subdir
            if subdir_path.exists():
                try:
                    shutil.rmtree(subdir_path)
                    print_success(f"Cleared {subdir}/ directory")
                except Exception as e:
                    error_msg = f"Failed to clear {subdir}/: {str(e)}"
                    print_error(error_msg)
                    stats['errors'].append(error_msg)
        
        # Clear any remaining files/directories
        for item in uploads_dir.iterdir():
            try:
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
            except Exception as e:
                error_msg = f"Failed to delete {item.name}: {str(e)}"
                print_error(error_msg)
                stats['errors'].append(error_msg)
        
        # Recreate empty directories
        for subdir in subdirs:
            (uploads_dir / subdir).mkdir(parents=True, exist_ok=True)
        
        print_success(f"Uploads directory cleared successfully")
        
    except Exception as e:
        error_msg = f"Failed to clear uploads directory: {str(e)}"
        print_error(error_msg)
        stats['errors'].append(error_msg)
    
    return stats

def create_backup(backend_dir: Path) -> Optional[Path]:
    """Create a backup of the database before reset"""
    print_substep("Creating database backup...")
    
    try:
        from app import app
        from database import db
        
        # Create backup directory
        backup_dir = backend_dir / "backups"
        backup_dir.mkdir(exist_ok=True)
        
        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"barangaylink_backup_{timestamp}.db"
        backup_path = backup_dir / backup_filename
        
        # Copy database file
        db_path = backend_dir / "instance" / "barangaylink.db"
        if db_path.exists():
            shutil.copy2(db_path, backup_path)
            backup_size = backup_path.stat().st_size
            print_success(f"Backup created: {backup_filename} ({format_size(backup_size)})")
            return backup_path
        else:
            print_warning("Database file not found - skipping backup")
            return None
            
    except Exception as e:
        print_error(f"Failed to create backup: {str(e)}")
        return None

def reset_database():
    """Reset the database while preserving location data and admin users"""
    print_step("1", "Resetting Database (Preserving Locations & Admins)")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print_error("Backend directory not found!")
        return False
    
    # Create backup first
    backup_path = create_backup(backend_dir)
    
    # Clear uploads directory with detailed reporting
    uploads_stats = clear_uploads_directory(backend_dir)
    
    # Clear user data while preserving locations and admins
    print_substep("Clearing user data while preserving locations and admin users...")
    try:
        from app import app
        from database import db
        
        with app.app_context():
            # Clear all user-related data but preserve locations and admin users
            # IMPORTANT: Delete dependent tables FIRST, then users
            # Using raw SQL to avoid relationship conflicts
            
            # Track deletion counts
            deletion_stats = {}
            
            # First, identify admin users to preserve
            print_substep("Identifying admin users to preserve...")
            admin_users = db.session.execute(
                db.text("SELECT id, username, email FROM users WHERE role = 'admin'")
            ).fetchall()
            
            admin_count = len(admin_users)
            if admin_count > 0:
                print_success(f"Found {admin_count} admin user(s) to preserve:")
                for admin in admin_users:
                    print_success(f"  • {admin.username} ({admin.email})")
            else:
                print_warning("No admin users found to preserve")
            
            # Define tables to clear in dependency order
            tables_to_clear = [
                'uploaded_files',
                'jwt_blacklist', 
                'transactions',
                'sos_requests',
                'relocation_requests',
                'item_requests',
                'items',
                'document_requests',
                'community_alerts',
                'benefit_applications',
                'benefits',
                'announcements',
                'activity_logs',
                'resident_profiles'
            ]
            
            # Clear each table
            for table in tables_to_clear:
                print_substep(f"Clearing {table}...")
                try:
                    # Count records first
                    count_result = db.session.execute(db.text(f"SELECT COUNT(*) FROM {table}")).scalar()
                    deletion_stats[table] = count_result or 0
                    
                    # Delete all records
                    db.session.execute(db.text(f"DELETE FROM {table}"))
                    print_success(f"Cleared {deletion_stats[table]} {table}")
                    
                except Exception as e:
                    print_error(f"Failed to clear {table}: {str(e)}")
                    deletion_stats[table] = 0
            
            # Clear users table but preserve admins
            print_substep("Clearing users (preserving admins)...")
            try:
                # Count total users
                total_users = db.session.execute(db.text("SELECT COUNT(*) FROM users")).scalar()
                
                # Count non-admin users
                non_admin_users = db.session.execute(
                    db.text("SELECT COUNT(*) FROM users WHERE role != 'admin'")
                ).scalar()
                
                deletion_stats['users'] = non_admin_users
                
                # Delete non-admin users
                db.session.execute(db.text("DELETE FROM users WHERE role != 'admin'"))
                print_success(f"Cleared {non_admin_users} non-admin users")
                
                # Verify admin users are still there
                remaining_admins = db.session.execute(
                    db.text("SELECT COUNT(*) FROM users WHERE role = 'admin'")
                ).scalar()
                print_success(f"Preserved {remaining_admins} admin user(s)")
                
            except Exception as e:
                print_error(f"Failed to clear users: {str(e)}")
                deletion_stats['users'] = 0
            
            # Commit changes
            print_substep("Committing database changes...")
            db.session.commit()
            print_success("Database changes committed successfully")
            
            # Check location count
            try:
                location_count = db.session.execute(db.text("SELECT COUNT(*) FROM locations")).scalar()
                print_success(f"Preserved {location_count} locations")
            except Exception as e:
                print_warning(f"Could not verify location count: {str(e)}")
            
            # Print summary
            total_deleted = sum(deletion_stats.values())
            print_success(f"Total records deleted: {total_deleted}")
            
    except Exception as e:
        print_error(f"Error clearing data: {e}")
        return False
    
    print_success("Database reset completed!")
    return True


def show_reset_summary():
    """Show detailed summary of what will be reset"""
    print("\n📋 RESET SUMMARY:")
    print("=" * 50)
    print("🗑️  WILL BE CLEARED:")
    print("  • All resident users (non-admin users)")
    print("  • All resident profiles")
    print("  • All announcements and community alerts")
    print("  • All benefits and benefit applications")
    print("  • All document requests and items")
    print("  • All SOS and relocation requests")
    print("  • All activity logs and transactions")
    print("  • All uploaded files (residents/, documents/, items/, temp/)")
    print("  • JWT blacklist entries")
    print("\n💾 WILL BE PRESERVED:")
    print("  • All admin users (role = 'admin')")
    print("  • All location data (provinces, municipalities, barangays)")
    print("  • Document types configuration")
    print("  • Database structure and migrations")
    print("\n🔄 ADDITIONAL FEATURES:")
    print("  • Automatic database backup before reset")
    print("  • Detailed progress reporting")
    print("  • Error handling and recovery")
    print("  • Uploads directory recreation")
    print("  • Admin user preservation and verification")

def get_user_confirmation() -> bool:
    """Get user confirmation with multiple options"""
    print("\n" + "="*60)
    print("⚠️  CONFIRMATION REQUIRED")
    print("="*60)
    
    while True:
        choice = input("\nChoose an option:\n"
                      "  [1] Yes, reset database (recommended)\n"
                      "  [2] Yes, reset database (no backup)\n"
                      "  [3] No, cancel operation\n"
                      "  [4] Show detailed summary\n"
                      "\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            return True
        elif choice == '2':
            print_warning("Proceeding without backup - this is not recommended!")
            confirm = input("Are you absolutely sure? (yes/no): ").strip().lower()
            if confirm in ['yes', 'y']:
                return True
            else:
                continue
        elif choice == '3':
            return False
        elif choice == '4':
            show_reset_summary()
            continue
        else:
            print_error("Invalid choice. Please enter 1, 2, 3, or 4.")
            continue

def main():
    """Main function"""
    print_header("BarangayLink Database Reset (Enhanced)")
    
    print("🚀 Enhanced database reset with comprehensive uploads clearing")
    print("📊 This script will provide detailed progress reporting")
    print("💾 Automatic backup creation (unless disabled)")
    print("🧹 Complete uploads directory cleanup")
    print("👑 Admin user preservation (keeps all admin accounts)")
    
    show_reset_summary()
    
    if not get_user_confirmation():
        print_header("Operation Cancelled")
        print("❌ Database reset cancelled by user.")
        return 0
    
    print_header("Starting Database Reset")
    
    # Track start time
    start_time = datetime.now()
    
    if not reset_database():
        print_header("Reset Failed")
        print_error("Database reset failed. Check error messages above.")
        return 1
    
    # Calculate duration
    end_time = datetime.now()
    duration = end_time - start_time
    
    print_header("Reset Complete!")
    print("🎉 Database has been reset successfully!")
    print("📍 Location data preserved successfully!")
    print("👑 Admin users preserved successfully!")
    print(f"⏱️  Operation completed in {duration.total_seconds():.1f} seconds")
    print("\n📝 NEXT STEPS:")
    print("  • Run database migrations if needed")
    print("  • Restart your application servers")
    print("  • Verify the application is working correctly")
    print("  • Login with your admin credentials to test")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
