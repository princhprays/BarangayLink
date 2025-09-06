"""
Email service for sending verification emails
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from flask import current_app, url_for
import os
import json

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        
        # Check if email configuration is available
        self.email_configured = bool(self.smtp_username and self.smtp_password)
        
        if not self.email_configured:
            print("⚠️  Email service not configured. Set SMTP_USERNAME and SMTP_PASSWORD environment variables.")
            print("   Emails will be printed to console instead of being sent.")
        
    def send_verification_email(self, user_email, user_name, verification_token):
        """Send email verification email"""
        try:
            # Create verification URL
            verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify/{verification_token}"
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Verify Your BarangayLink Account"
            msg['From'] = self.from_email
            msg['To'] = user_email
            
            # Create HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Email Verification</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to BarangayLink!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {user_name},</h2>
                        <p>Thank you for registering with BarangayLink. To complete your registration and verify your email address, please click the button below:</p>
                        
                        <div style="text-align: center;">
                            <a href="{verification_url}" class="button">Verify Email Address</a>
                        </div>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">{verification_url}</p>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This link will expire in 24 hours</li>
                            <li>After verification, your account will be reviewed by an administrator</li>
                            <li>You will receive another email once your account is approved</li>
                        </ul>
                        
                        <p>If you didn't create an account with BarangayLink, please ignore this email.</p>
                        
                        <p>Best regards,<br>The BarangayLink Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text content
            text_content = f"""
            Welcome to BarangayLink!
            
            Hello {user_name},
            
            Thank you for registering with BarangayLink. To complete your registration and verify your email address, please visit the following link:
            
            {verification_url}
            
            Important:
            - This link will expire in 24 hours
            - After verification, your account will be reviewed by an administrator
            - You will receive another email once your account is approved
            
            If you didn't create an account with BarangayLink, please ignore this email.
            
            Best regards,
            The BarangayLink Team
            
            This is an automated message. Please do not reply to this email.
            """
            
            # Attach parts
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Send email
            if self.email_configured:
                try:
                    server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                    server.quit()
                    print(f"✅ Verification email sent successfully to {user_email}")
                    return True
                except smtplib.SMTPAuthenticationError as e:
                    print(f"❌ SMTP Authentication failed: {str(e)}")
                    print("   Please check your SMTP_USERNAME and SMTP_PASSWORD")
                    return False
                except smtplib.SMTPException as e:
                    print(f"❌ SMTP Error: {str(e)}")
                    return False
                except Exception as e:
                    print(f"❌ Email sending failed: {str(e)}")
                    return False
            else:
                # In development, just print the email content
                print(f"=== EMAIL VERIFICATION (CONSOLE MODE) ===")
                print(f"To: {user_email}")
                print(f"Subject: Verify Your BarangayLink Account")
                print(f"Verification URL: {verification_url}")
                print(f"==========================================")
                return True
                
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            return False
    
    def send_approval_email(self, user_email, user_name, approved=True, rejection_reason=None):
        """Send account approval/rejection email"""
        try:
            if approved:
                subject = "Your BarangayLink Account Has Been Approved!"
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Account Approved</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .button {{ display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Account Approved!</h1>
                        </div>
                        <div class="content">
                            <h2>Congratulations {user_name}!</h2>
                            <p>Your BarangayLink account has been approved by an administrator. You can now log in and access all community services.</p>
                            
                            <div style="text-align: center;">
                                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login" class="button">Login to Your Account</a>
                            </div>
                            
                            <p>Welcome to the BarangayLink community!</p>
                            <p>Best regards,<br>The BarangayLink Team</p>
                        </div>
                    </div>
                </body>
                </html>
                """
            else:
                subject = "BarangayLink Account Registration Update"
                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Account Update</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                        .button {{ display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Account Update</h1>
                        </div>
                        <div class="content">
                            <h2>Hello {user_name},</h2>
                            <p>We regret to inform you that your BarangayLink account registration was not approved at this time.</p>
                            
                            <p><strong>Reason:</strong> {rejection_reason or 'Please contact support for more information.'}</p>
                            
                            <p>You may reapply with corrected information by visiting our registration page.</p>
                            
                            <div style="text-align: center;">
                                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/register" class="button">Reapply for Account</a>
                            </div>
                            
                            <p>If you have any questions, please contact our support team.</p>
                            <p>Best regards,<br>The BarangayLink Team</p>
                        </div>
                    </div>
                </body>
                </html>
                """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = user_email
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            if self.email_configured:
                try:
                    server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                    server.quit()
                    print(f"✅ Account update email sent successfully to {user_email}")
                    return True
                except smtplib.SMTPAuthenticationError as e:
                    print(f"❌ SMTP Authentication failed: {str(e)}")
                    print("   Please check your SMTP_USERNAME and SMTP_PASSWORD")
                    return False
                except smtplib.SMTPException as e:
                    print(f"❌ SMTP Error: {str(e)}")
                    return False
                except Exception as e:
                    print(f"❌ Email sending failed: {str(e)}")
                    return False
            else:
                # In development, just print the email content
                print(f"=== ACCOUNT UPDATE EMAIL (CONSOLE MODE) ===")
                print(f"To: {user_email}")
                print(f"Subject: {subject}")
                print(f"Approved: {approved}")
                if not approved:
                    print(f"Reason: {rejection_reason}")
                print(f"==========================================")
                return True
                
        except Exception as e:
            print(f"Failed to send approval email: {str(e)}")
            return False
    
    def send_document_email(self, user_email, user_name, document_request, document_path=None):
        """Send document via email with PDF attachment"""
        try:
            # Parse QR code data for verification info
            qr_data = json.loads(document_request.qr_code_data) if document_request.qr_code_data else {}
            verification_code = qr_data.get('verification_code', 'N/A')
            
            # Create verification URL
            verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-document/{verification_code}"
            
            subject = f"Your {document_request.document_type.name} is Ready - BarangayLink"
            
            # Create HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Document Ready</title>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .document-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }}
                    .verification {{ background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📄 Document Ready!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello {user_name},</h2>
                        <p>Great news! Your requested document has been processed and is ready for download.</p>
                        
                        <div class="document-info">
                            <h3>Document Details:</h3>
                            <p><strong>Document Type:</strong> {document_request.document_type.name}</p>
                            <p><strong>Request ID:</strong> #{document_request.id}</p>
                            <p><strong>Purpose:</strong> {document_request.purpose or 'N/A'}</p>
                            <p><strong>Quantity:</strong> {document_request.quantity}</p>
                            <p><strong>Issued Date:</strong> {document_request.processed_at.strftime('%B %d, %Y at %I:%M %p') if document_request.processed_at else 'N/A'}</p>
                            {f'<p><strong>Expires:</strong> {document_request.expires_at.strftime("%B %d, %Y") if document_request.expires_at else "No expiration"}</p>' if document_request.expires_at else ''}
                        </div>
                        
                        <div class="verification">
                            <h3>🔍 Document Verification</h3>
                            <p>This document includes a QR code for verification. Anyone can verify its authenticity using:</p>
                            <p><strong>Verification Code:</strong> <code>{verification_code}</code></p>
                            <p><strong>Verification URL:</strong> <a href="{verification_url}">{verification_url}</a></p>
                        </div>
                        
                        <p><strong>Important Notes:</strong></p>
                        <ul>
                            <li>The document PDF is attached to this email</li>
                            <li>Keep this email for your records</li>
                            <li>The QR code can be used to verify document authenticity</li>
                            {f'<li>This document expires on {document_request.expires_at.strftime("%B %d, %Y") if document_request.expires_at else "No expiration date"}</li>' if document_request.expires_at else ''}
                        </ul>
                        
                        <p>If you have any questions about this document, please contact the Barangay office.</p>
                        
                        <p>Best regards,<br>The BarangayLink Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text content
            text_content = f"""
            Document Ready - BarangayLink
            
            Hello {user_name},
            
            Great news! Your requested document has been processed and is ready for download.
            
            Document Details:
            - Document Type: {document_request.document_type.name}
            - Request ID: #{document_request.id}
            - Purpose: {document_request.purpose or 'N/A'}
            - Quantity: {document_request.quantity}
            - Issued Date: {document_request.processed_at.strftime('%B %d, %Y at %I:%M %p') if document_request.processed_at else 'N/A'}
            {f'- Expires: {document_request.expires_at.strftime("%B %d, %Y") if document_request.expires_at else "No expiration"}' if document_request.expires_at else ''}
            
            Document Verification:
            This document includes a QR code for verification. Anyone can verify its authenticity using:
            - Verification Code: {verification_code}
            - Verification URL: {verification_url}
            
            Important Notes:
            - The document PDF is attached to this email
            - Keep this email for your records
            - The QR code can be used to verify document authenticity
            {f'- This document expires on {document_request.expires_at.strftime("%B %d, %Y") if document_request.expires_at else "No expiration date"}' if document_request.expires_at else ''}
            
            If you have any questions about this document, please contact the Barangay office.
            
            Best regards,
            The BarangayLink Team
            
            This is an automated message. Please do not reply to this email.
            """
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = user_email
            
            # Attach text and HTML parts
            text_part = MIMEText(text_content, 'plain')
            html_part = MIMEText(html_content, 'html')
            msg.attach(text_part)
            msg.attach(html_part)
            
            # Attach PDF document if path is provided
            if document_path and os.path.exists(document_path):
                with open(document_path, 'rb') as pdf_file:
                    pdf_attachment = MIMEApplication(pdf_file.read(), _subtype='pdf')
                    pdf_attachment.add_header(
                        'Content-Disposition', 
                        'attachment', 
                        filename=f"{document_request.document_type.name.replace(' ', '_')}_{document_request.id}.pdf"
                    )
                    msg.attach(pdf_attachment)
            
            # Send email
            if self.email_configured:
                try:
                    server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
                    server.quit()
                    print(f"✅ Document email sent successfully to {user_email}")
                    return True
                except smtplib.SMTPAuthenticationError as e:
                    print(f"❌ SMTP Authentication failed: {str(e)}")
                    print("   Please check your SMTP_USERNAME and SMTP_PASSWORD")
                    return False
                except smtplib.SMTPException as e:
                    print(f"❌ SMTP Error: {str(e)}")
                    return False
                except Exception as e:
                    print(f"❌ Email sending failed: {str(e)}")
                    return False
            else:
                # In development, just print the email content
                print(f"=== DOCUMENT EMAIL (CONSOLE MODE) ===")
                print(f"To: {user_email}")
                print(f"Subject: {subject}")
                print(f"Document: {document_request.document_type.name}")
                print(f"Request ID: {document_request.id}")
                print(f"Verification Code: {verification_code}")
                print(f"Document Path: {document_path}")
                print(f"=====================================")
                return True
                
        except Exception as e:
            print(f"Failed to send document email: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()
