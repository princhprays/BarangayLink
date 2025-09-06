#!/usr/bin/env python3
"""
Email Setup Script for BarangayLink

This script helps you configure email settings for the BarangayLink application.
It supports multiple email providers including Gmail, Outlook, Yahoo, and custom SMTP servers.
"""

import os
import sys
from pathlib import Path

def get_email_provider_config():
    """Get email provider configuration from user"""
    print("📧 BarangayLink Email Configuration Setup")
    print("=" * 50)
    print()
    
    # Email provider selection
    print("Select your email provider:")
    print("1. Gmail")
    print("2. Outlook/Hotmail")
    print("3. Yahoo")
    print("4. Custom SMTP Server")
    print("5. Skip email setup (development mode)")
    
    while True:
        choice = input("\nEnter your choice (1-5): ").strip()
        if choice in ['1', '2', '3', '4', '5']:
            break
        print("Please enter a valid choice (1-5)")
    
    if choice == '5':
        print("\n✅ Email setup skipped. The application will run in development mode.")
        print("   Verification emails will be printed to the console instead of being sent.")
        return None
    
    # Provider-specific configurations
    configs = {
        '1': {  # Gmail
            'server': 'smtp.gmail.com',
            'port': '587',
            'instructions': [
                "For Gmail, you need to use an App Password, not your regular password.",
                "1. Enable 2-Factor Authentication on your Google account",
                "2. Go to Google Account settings > Security > App passwords",
                "3. Generate an app password for 'Mail'",
                "4. Use that app password below (not your regular password)"
            ]
        },
        '2': {  # Outlook/Hotmail
            'server': 'smtp-mail.outlook.com',
            'port': '587',
            'instructions': [
                "For Outlook/Hotmail, use your regular email and password.",
                "Make sure you have enabled 'Less secure app access' or use App Passwords."
            ]
        },
        '3': {  # Yahoo
            'server': 'smtp.mail.yahoo.com',
            'port': '587',
            'instructions': [
                "For Yahoo, you need to use an App Password.",
                "1. Go to Yahoo Account Security",
                "2. Generate an app password",
                "3. Use that app password below"
            ]
        },
        '4': {  # Custom
            'server': '',
            'port': '587',
            'instructions': [
                "Enter your custom SMTP server details below."
            ]
        }
    }
    
    config = configs[choice]
    
    # Display instructions
    print(f"\n📋 Setup Instructions:")
    for instruction in config['instructions']:
        print(f"   • {instruction}")
    
    print()
    
    # Get email credentials
    if choice == '4':  # Custom SMTP
        server = input("SMTP Server (e.g., smtp.yourdomain.com): ").strip()
        port = input("SMTP Port (default: 587): ").strip() or '587'
    else:
        server = config['server']
        port = config['port']
    
    email = input("Email address: ").strip()
    password = input("Password/App Password: ").strip()
    
    if not email or not password:
        print("❌ Email and password are required!")
        return None
    
    return {
        'SMTP_SERVER': server,
        'SMTP_PORT': port,
        'SMTP_USERNAME': email,
        'SMTP_PASSWORD': password,
        'FROM_EMAIL': email
    }

def create_env_file(config):
    """Create or update .env file with email configuration"""
    backend_dir = Path(__file__).parent.parent.parent / "backend"
    env_path = backend_dir / '.env'
    
    # Read existing .env file if it exists
    existing_content = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    existing_content[key] = value
    
    # Update with email configuration
    if config:
        existing_content.update(config)
    
    # Write back to .env file
    with open(env_path, 'w') as f:
        f.write("# Flask Configuration\n")
        f.write("FLASK_ENV=development\n")
        f.write("SECRET_KEY=your-secret-key-here-change-this-in-production\n")
        f.write("JWT_SECRET_KEY=your-jwt-secret-key-here-change-this-in-production\n")
        f.write("\n")
        f.write("# Database Configuration\n")
        f.write("DATABASE_URL=sqlite:///barangaylink.db\n")
        f.write("\n")
        
        if config:
            f.write("# Email Configuration\n")
            for key, value in config.items():
                f.write(f"{key}={value}\n")
            f.write("\n")
        else:
            f.write("# Email Configuration (not configured)\n")
            f.write("# Uncomment and configure these to enable email sending\n")
            f.write("# SMTP_SERVER=smtp.gmail.com\n")
            f.write("# SMTP_PORT=587\n")
            f.write("# SMTP_USERNAME=your-email@gmail.com\n")
            f.write("# SMTP_PASSWORD=your-app-password\n")
            f.write("# FROM_EMAIL=your-email@gmail.com\n")
            f.write("\n")
        
        f.write("# Frontend URL (for email links)\n")
        f.write("FRONTEND_URL=http://localhost:3000\n")
        f.write("\n")
        f.write("# File Upload Configuration\n")
        f.write("UPLOAD_FOLDER=uploads\n")
        f.write("MAX_CONTENT_LENGTH=16777216  # 16MB max file size\n")

def test_email_config(config):
    """Test email configuration"""
    if not config:
        return True
    
    print("\n🧪 Testing email configuration...")
    
    try:
        import smtplib
        from email.mime.text import MIMEText
        
        # Create test message
        msg = MIMEText("This is a test email from BarangayLink setup.")
        msg['Subject'] = "BarangayLink Email Test"
        msg['From'] = config['FROM_EMAIL']
        msg['To'] = config['SMTP_USERNAME']
        
        # Test SMTP connection
        server = smtplib.SMTP(config['SMTP_SERVER'], int(config['SMTP_PORT']))
        server.starttls()
        server.login(config['SMTP_USERNAME'], config['SMTP_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        print("✅ Email configuration test successful!")
        print(f"   Test email sent to {config['SMTP_USERNAME']}")
        return True
        
    except Exception as e:
        print(f"❌ Email configuration test failed: {str(e)}")
        print("   Please check your credentials and try again.")
        return False

def main():
    """Main setup function"""
    print("Welcome to BarangayLink Email Setup!")
    print()
    
    # Get email configuration
    config = get_email_provider_config()
    
    if config:
        # Test configuration
        if test_email_config(config):
            # Create .env file
            create_env_file(config)
            print(f"\n✅ Email configuration saved to .env file!")
            print("   You can now register users and they will receive verification emails.")
        else:
            print(f"\n❌ Email configuration test failed.")
            print("   Please run this script again with correct credentials.")
            return 1
    else:
        # Create .env file without email config
        create_env_file(config)
        print(f"\n✅ Configuration saved to .env file!")
        print("   Email sending is disabled. Run this script again to configure email.")
    
    print("\n📝 Next steps:")
    print("   1. Start the backend server: python scripts/servers/run_backend.py")
    print("   2. Start the frontend server: python scripts/servers/run_frontend.py")
    print("   3. Register a new user to test email verification")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
