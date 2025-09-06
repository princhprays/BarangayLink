#!/usr/bin/env python3
"""
BarangayLink Backend Runner Script
This script starts the Flask backend server.
"""

import os
import sys
import subprocess
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🚀 {title}")
    print(f"{'='*60}")

def check_backend_setup():
    """Check if backend is properly set up"""
    print("Checking backend setup...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("❌ Virtual environment not found!")
        print("Please run: python scripts/setup/setup.py")
        return False
    
    return True

def main():
    """Main function"""
    print_header("BarangayLink Backend Server")
    
    if not check_backend_setup():
        return 1
    
    backend_dir = Path("backend")
    python_cmd = str(backend_dir / "venv" / "Scripts" / "python.exe") if os.name == 'nt' else str(backend_dir / "venv" / "bin" / "python")
    
    print("Starting Flask backend server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run([python_cmd, "app.py"], cwd=backend_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend server failed: {e}")
        return 1
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")
        return 0

if __name__ == "__main__":
    sys.exit(main())
