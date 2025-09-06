#!/usr/bin/env python3
"""
BarangayLink Complete Runner Script
This script starts both backend and frontend servers simultaneously.
"""

import os
import sys
import subprocess
import threading
import time
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🚀 {title}")
    print(f"{'='*60}")

def run_backend():
    """Run the backend server in a separate thread"""
    backend_dir = Path("backend")
    python_cmd = str(backend_dir / "venv" / "Scripts" / "python.exe") if os.name == 'nt' else str(backend_dir / "venv" / "bin" / "python")
    
    try:
        print("🔄 Starting backend server...")
        subprocess.run([python_cmd, "app.py"], cwd=backend_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend server failed: {e}")
    except KeyboardInterrupt:
        print("🛑 Backend server stopped")

def run_frontend():
    """Run the frontend server in a separate thread"""
    frontend_dir = Path("frontend")
    
    try:
        print("🔄 Starting frontend server...")
        subprocess.run(["npm", "run", "dev"], cwd=frontend_dir, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend server failed: {e}")
    except KeyboardInterrupt:
        print("🛑 Frontend server stopped")

def main():
    """Main function"""
    print_header("BarangayLink Development Servers")
    
    print("Starting both backend and frontend servers...")
    print("Press Ctrl+C to stop both servers")
    print("\nServers will be available at:")
    print("  - Frontend: http://localhost:3000")
    print("  - Backend:  http://localhost:5000")
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=run_backend, daemon=True)
    backend_thread.start()
    
    # Wait a moment for backend to start
    time.sleep(2)
    
    # Start frontend in the main thread
    try:
        run_frontend()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down servers...")
        sys.exit(0)

if __name__ == "__main__":
    main()
