#!/usr/bin/env python3
"""
BarangayLink Frontend Runner Script
This script starts the React frontend development server.
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🎨 {title}")
    print(f"{'='*60}")

def check_frontend_setup():
    """Check if frontend is properly set up"""
    print("Checking frontend setup...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    node_modules = frontend_dir / "node_modules"
    if not node_modules.exists():
        print("❌ Node modules not found!")
        print("Please run: python scripts/setup/setup.py")
        return False
    
    return True

def main():
    """Main function"""
    print_header("BarangayLink Frontend Server")
    
    if not check_frontend_setup():
        return 1
    
    frontend_dir = Path("frontend")
    
    print("Starting React frontend server...")
    print("Server will be available at: http://localhost:3000")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run(["npm", "run", "dev"], cwd=frontend_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend server failed: {e}")
        return 1
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped")
        return 0

if __name__ == "__main__":
    sys.exit(main())
