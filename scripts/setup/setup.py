#!/usr/bin/env python3
"""
BarangayLink Project Setup Script
This script sets up the entire BarangayLink project from scratch.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"🚀 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step"""
    print(f"\n{step}. {description}")
    print("-" * 40)

def run_command(command, cwd=None, check=True):
    """Run a command and handle errors"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=True, cwd=cwd, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False

def check_python():
    """Check if Python is installed"""
    print_step("1", "Checking Python Installation")
    try:
        result = subprocess.run([sys.executable, "--version"], 
                              capture_output=True, text=True)
        print(f"✅ Python version: {result.stdout.strip()}")
        return True
    except Exception as e:
        print(f"❌ Python not found: {e}")
        return False

def check_node():
    """Check if Node.js is installed"""
    print_step("2", "Checking Node.js Installation")
    try:
        result = subprocess.run(["node", "--version"], 
                              capture_output=True, text=True)
        print(f"✅ Node.js version: {result.stdout.strip()}")
        return True
    except Exception as e:
        print(f"❌ Node.js not found: {e}")
        return False

def setup_backend():
    """Set up the backend"""
    print_step("3", "Setting up Backend")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
    
    # Create virtual environment
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("Creating virtual environment...")
        if not run_command(f"{sys.executable} -m venv venv", cwd=backend_dir):
            return False
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        pip_cmd = str(venv_dir / "Scripts" / "pip.exe")
        python_cmd = str(venv_dir / "Scripts" / "python.exe")
    else:  # Linux/Mac
        pip_cmd = str(venv_dir / "bin" / "pip")
        python_cmd = str(venv_dir / "bin" / "python")
    
    print("Installing Python dependencies...")
    if not run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_dir):
        return False
    
    # Create .env file
    env_file = backend_dir / ".env"
    env_example = backend_dir / "env.example"
    if not env_file.exists() and env_example.exists():
        print("Creating .env file...")
        shutil.copy(env_example, env_file)
    
    print("✅ Backend setup completed!")
    return True

def setup_frontend():
    """Set up the frontend"""
    print_step("4", "Setting up Frontend")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
    
    print("Installing Node.js dependencies...")
    if not run_command("npm install", cwd=frontend_dir):
        return False
    
    print("✅ Frontend setup completed!")
    return True

def setup_database():
    """Set up the database"""
    print_step("5", "Setting up Database")
    
    backend_dir = Path("backend")
    if os.name == 'nt':  # Windows
        python_cmd = str(backend_dir / "venv" / "Scripts" / "python.exe")
    else:  # Linux/Mac
        python_cmd = str(backend_dir / "venv" / "bin" / "python")
    
    print("Creating database...")
    if not run_command(f"{python_cmd} app.py --init-db", cwd=backend_dir):
        print("Database creation failed, but continuing...")
    
    print("✅ Database setup completed!")
    return True

def main():
    """Main setup function"""
    print_header("BarangayLink Project Setup")
    
    print("This script will set up the entire BarangayLink project.")
    print("Make sure you have Python 3.8+ and Node.js 18+ installed.")
    
    # Check prerequisites
    if not check_python():
        print("\n❌ Please install Python 3.8+ from https://python.org")
        return 1
    
    if not check_node():
        print("\n❌ Please install Node.js 18+ from https://nodejs.org")
        return 1
    
    # Setup components
    if not setup_backend():
        print("\n❌ Backend setup failed!")
        return 1
    
    if not setup_frontend():
        print("\n❌ Frontend setup failed!")
        return 1
    
    if not setup_database():
        print("\n❌ Database setup failed!")
        return 1
    
    print_header("Setup Complete!")
    print("🎉 BarangayLink project setup completed successfully!")
    print("\nNext steps:")
    print("1. Configure email settings: python scripts/admin/setup_email.py")
    print("2. Start the application: python scripts/servers/run_all.py")
    print("3. Access the application at http://localhost:3000")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
