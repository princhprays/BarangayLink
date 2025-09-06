# BarangayLink Scripts

This directory contains organized scripts for managing the BarangayLink project.

## 📁 Directory Structure

```
scripts/
├── setup/           # Project setup and installation
├── servers/         # Server management (start/stop)
├── database/        # Database operations
├── admin/           # Administration tasks
└── README.md        # This file
```

## 🚀 Quick Start

### **First Time Setup**
```bash
# Complete project setup
python scripts/setup/setup.py

# Configure email (required for user registration)
python scripts/admin/setup_email.py

# Start both servers
python scripts/servers/run_all.py
```

### **Daily Development**
```bash
# Start both servers
python scripts/servers/run_all.py

# Or start separately
python scripts/servers/run_backend.py   # Backend only
python scripts/servers/run_frontend.py  # Frontend only
```

## 📋 Script Categories

### **🔧 Setup Scripts** (`scripts/setup/`)

#### `setup.py`
Complete project setup from scratch.
```bash
python scripts/setup/setup.py
```
**What it does:**
- Checks Python and Node.js installation
- Creates virtual environment for backend
- Installs Python dependencies
- Installs Node.js dependencies
- Creates .env file from template
- Sets up database

### **🏃 Server Scripts** (`scripts/servers/`)

#### `run_all.py`
Start both backend and frontend servers simultaneously.
```bash
python scripts/servers/run_all.py
```
**What it does:**
- Starts Flask backend server on port 5000
- Starts React frontend server on port 3000
- Both servers run simultaneously

#### `run_backend.py`
Start only the Flask backend server.
```bash
python scripts/servers/run_backend.py
```
**What it does:**
- Checks backend setup
- Starts Flask server on port 5000
- Available at: http://localhost:5000

#### `run_frontend.py`
Start only the React frontend server.
```bash
python scripts/servers/run_frontend.py
```
**What it does:**
- Checks frontend setup
- Starts React dev server on port 3000
- Available at: http://localhost:3000

### **🗄️ Database Scripts** (`scripts/database/`)

#### `reset_database.py`
Reset database to clean state with sample data.
```bash
python scripts/database/reset_database.py
```
**What it does:**
- Removes existing database file
- Clears uploads directory
- Creates fresh database
- Populates with sample data

#### `populate_sample_data.py`
Populate database with sample data only.
```bash
python scripts/database/populate_sample_data.py
```
**What it does:**
- Creates sample barangay
- Creates admin and resident users
- Creates sample benefits
- Creates sample announcements
- Creates sample document types
- Creates sample marketplace items

#### `check_database.py`
Check current database status and record counts.
```bash
python scripts/database/check_database.py
```
**What it does:**
- Shows counts of all database tables
- Displays user statistics (admins vs residents)
- Reports system data status
- Quick database health check

### **👨‍💼 Admin Scripts** (`scripts/admin/`)

#### `setup_email.py`
Interactive script to configure email settings for any provider.
```bash
python scripts/admin/setup_email.py
```
**What it does:**
- Supports Gmail, Outlook, Yahoo, Custom SMTP
- Guides through email provider setup
- Tests email configuration
- Updates .env file with settings

#### `clear_user_data.py`
Safely clears all user data while preserving location data.
```bash
python scripts/admin/clear_user_data.py
```
**What it does:**
- Removes all user accounts and profiles
- Clears marketplace items and requests
- Removes document requests and applications
- Preserves location data and system configurations
- Offers backup creation before clearing

## 🎯 Common Workflows

### **Development Setup**
```bash
# 1. Complete setup
python scripts/setup/setup.py

# 2. Configure email
python scripts/admin/setup_email.py

# 3. Create admin account (optional - use sample account or create your own)
python scripts/admin/setup_admin.py

# 4. Start development
python scripts/servers/run_all.py
```

### **Admin Management**
```bash
# Create admin account with interactive setup
python scripts/admin/setup_admin.py

# Configure email settings
python scripts/admin/setup_email.py

# Clear user data only
python scripts/admin/clear_user_data.py
```

### **Database Management**
```bash
# Check database status
python scripts/database/check_database.py

# Reset database with sample data
python scripts/database/reset_database.py

# Clear user data only
python scripts/admin/clear_user_data.py
```

### **Server Management**
```bash
# Start both servers
python scripts/servers/run_all.py

# Start backend only
python scripts/servers/run_backend.py

# Start frontend only
python scripts/servers/run_frontend.py
```

## 🔐 Sample Accounts

After running setup or reset scripts, you'll have these test accounts:

- **Admin**: `userAdmin` / `admin123!`
- **Resident**: `userResident` / `resident123!`

## 👤 Admin Account Setup

The `setup_admin.py` script provides an interactive way to create admin accounts:

### **Features**
- **Interactive Location Selection**: Choose province → municipality → barangay
- **Account Validation**: Checks for unique username/email
- **Password Security**: Enforces strong password requirements
- **Auto-Approval**: Admin accounts are automatically approved and email-verified
- **Existing Admin Display**: Shows current admin accounts before creating new ones

### **Password Requirements**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one digit
- Special characters recommended

### **Usage**
```bash
python scripts/admin/setup_admin.py
```

The script will guide you through:
1. Viewing existing admin accounts
2. Selecting location (province → municipality → barangay)
3. Entering account details (username, email, name, phone)
4. Setting a secure password
5. Confirming account creation

## 📊 Sample Data

The scripts create the following sample data:

- **1 Sample Barangay**: "Sample Barangay" in Masinloc, Zambales
- **2 Sample Users**: Admin and Resident accounts
- **4 Sample Benefits**: Senior Citizen, PWD, Solo Parent, Student Aid
- **3 Sample Announcements**: Assembly, Clean-up, Health Program
- **4 Sample Document Types**: Certificate, Clearance, Indigency, Business Permit
- **4 Sample Marketplace Items**: Ladder, Power Drill, Tent, Generator

## 🛠️ Troubleshooting

### Common Issues

1. **"Backend directory not found"**
   - Make sure you're running scripts from the project root directory

2. **"Virtual environment not found"**
   - Run `python scripts/setup/setup.py` first

3. **"Node modules not found"**
   - Run `python scripts/setup/setup.py` first

4. **"Python not found"**
   - Install Python 3.8+ from https://python.org

5. **"Node.js not found"**
   - Install Node.js 18+ from https://nodejs.org

## 📝 Notes

- All scripts should be run from the project root directory
- Scripts automatically handle Windows and Linux/Mac differences
- Database files are created in `backend/instance/`
- Uploads are stored in `backend/uploads/`
- Scripts include error handling and helpful messages
- Email configuration is required for user registration