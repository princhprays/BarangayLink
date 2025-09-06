#!/usr/bin/env python3
"""
Script to upload PH_LOC.json to Railway and populate the database
"""

import os
import subprocess
import sys

def upload_file_to_railway():
    """Upload PH_LOC.json to Railway"""
    print("📤 Uploading PH_LOC.json to Railway...")
    
    try:
        # Copy PH_LOC.json to Railway
        result = subprocess.run([
            'railway', 'cp', '../PH_LOC.json', 'barangaylink-production.up.railway.app:/app/PH_LOC.json'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Successfully uploaded PH_LOC.json to Railway")
            return True
        else:
            print(f"❌ Failed to upload file: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error uploading file: {e}")
        return False

def run_populate_script():
    """Run the populate script on Railway"""
    print("🚀 Running population script on Railway...")
    
    try:
        # Run the populate script on Railway
        result = subprocess.run([
            'railway', 'run', 'python', 'run_populate.py'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Successfully populated database")
            print(result.stdout)
            return True
        else:
            print(f"❌ Failed to populate database: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error running script: {e}")
        return False

def main():
    """Main function"""
    print("🇵🇭 Philippine Location Data Upload and Population")
    print("=" * 60)
    
    # Check if Railway CLI is available
    try:
        subprocess.run(['railway', '--version'], capture_output=True, check=True)
    except:
        print("❌ Railway CLI not found. Please install it first.")
        sys.exit(1)
    
    # Upload file
    if not upload_file_to_railway():
        print("❌ Failed to upload file. Exiting.")
        sys.exit(1)
    
    # Run populate script
    if not run_populate_script():
        print("❌ Failed to populate database. Exiting.")
        sys.exit(1)
    
    print("\n🎉 Successfully populated Railway database with Philippine location data!")

if __name__ == "__main__":
    main()
