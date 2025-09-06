from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity, 
    get_jwt,
    create_refresh_token,
    jwt_required
)
from database import db
from models.user import User
from models.location import Location
from models.resident_profile import ResidentProfile
from models.activity_log import ActivityLog
from models.jwt_blacklist import JWTBlacklist
from utils.file_handler import validate_file, save_temp_file, delete_temp_file, get_user_files, migrate_user_files_to_permanent, update_user_file_paths
from utils.email_service import email_service
from datetime import datetime, timedelta, timezone
import uuid
import os

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new resident with email verification and file uploads"""
    try:
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            files = {}
        else:
            data = request.form.to_dict()
            files = request.files.to_dict()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone_number', 'province_id', 'municipality_id', 'barangay_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate password confirmation
        if data['password'] != data['confirm_password']:
            return jsonify({'error': 'Passwords do not match'}), 400
        
        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already taken'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Validate location hierarchy
        province = Location.query.get(data['province_id'])
        municipality = Location.query.get(data['municipality_id'])
        barangay = Location.query.get(data['barangay_id'])
        
        if not province or province.geographic_level != 'Prov':
            return jsonify({'error': 'Invalid province'}), 400
        if not municipality or municipality.geographic_level not in ['City', 'Mun']:
            return jsonify({'error': 'Invalid municipality/city'}), 400
        if not barangay or barangay.geographic_level != 'Bgy':
            return jsonify({'error': 'Invalid barangay'}), 400
        
        # Validate file uploads
        valid_id_file = files.get('valid_id')
        selfie_file = files.get('selfie_with_id')
        profile_pic_file = files.get('profile_picture')
        
        if not valid_id_file:
            return jsonify({'error': 'Valid ID is required'}), 400
        if not selfie_file:
            return jsonify({'error': 'Selfie with ID is required'}), 400
        
        # Validate files
        valid_id_valid, valid_id_msg = validate_file(valid_id_file)
        if not valid_id_valid:
            return jsonify({'error': f'Valid ID: {valid_id_msg}'}), 400
        
        selfie_valid, selfie_msg = validate_file(selfie_file)
        if not selfie_valid:
            return jsonify({'error': f'Selfie with ID: {selfie_msg}'}), 400
        
        if profile_pic_file:
            profile_valid, profile_msg = validate_file(profile_pic_file)
            if not profile_valid:
                return jsonify({'error': f'Profile picture: {profile_msg}'}), 400
        
        # Save files to temporary storage
        valid_id_filename, valid_id_path = save_temp_file(valid_id_file, 'valid_id')
        selfie_filename, selfie_path = save_temp_file(selfie_file, 'selfie')
        
        profile_pic_filename = None
        if profile_pic_file:
            profile_pic_filename, profile_pic_path = save_temp_file(profile_pic_file, 'profile')
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            middle_name=data.get('middle_name'),
            phone_number=data['phone_number'],
            province_id=data['province_id'],
            municipality_id=data['municipality_id'],
            barangay_id=data['barangay_id'],
            complete_address=data.get('complete_address'),
            valid_id_path=valid_id_filename,
            selfie_with_id_path=selfie_filename,
            profile_picture_url=profile_pic_filename,
            role='resident',
            status='pending',
            email_verified=False
        )
        user.set_password(data['password'])
        user.set_phone_number(data['phone_number'])
        
        # Generate email verification token
        verification_token = user.generate_email_verification_token()
        
        db.session.add(user)
        db.session.flush()  # Get the user ID before committing
        
        # Create resident profile
        profile = ResidentProfile(
            user_id=user.id,
            barangay_id=user.barangay_id,
            birth_date=data.get('birth_date'),
            gender=data.get('gender'),
            civil_status=data.get('civil_status'),
            occupation=data.get('occupation'),
            employer=data.get('employer'),
            house_number=data.get('house_number'),
            street=data.get('street'),
            purok=data.get('purok'),
            sitio=data.get('sitio'),
            spouse_name=data.get('spouse_name'),
            father_name=data.get('father_name'),
            mother_name=data.get('mother_name'),
            emergency_contact_name=data.get('emergency_contact_name'),
            emergency_contact_phone=data.get('emergency_contact_phone'),
            emergency_contact_relationship=data.get('emergency_contact_relationship'),
            tin_number=data.get('tin_number'),
            sss_number=data.get('sss_number'),
            philhealth_number=data.get('philhealth_number'),
            voter_id=data.get('voter_id')
        )
        db.session.add(profile)
        db.session.commit()
        
        # Send verification email
        email_sent = email_service.send_verification_email(
            user.email, 
            user.get_full_name(), 
            verification_token
        )
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user.id,
            action='user_registered',
            entity_type='user',
            entity_id=user.id,
            description=f'User {user.email} registered with complete profile',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Registration successful. Please check your email to verify your account before admin approval.',
            'user': user.to_dict(),
            'email_sent': email_sent
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # Clean up uploaded files on error
        try:
            if 'valid_id_filename' in locals():
                delete_temp_file(valid_id_filename)
            if 'selfie_filename' in locals():
                delete_temp_file(selfie_filename)
            if 'profile_pic_filename' in locals() and profile_pic_filename:
                delete_temp_file(profile_pic_filename)
        except:
            pass
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    """Verify email address with token"""
    try:
        print(f"🔍 Verification attempt for token: {token}")
        user = User.query.filter_by(email_verification_token=token).first()
        
        if not user:
            print(f"❌ No user found with token: {token}")
            # Check if there's a user with this email that's already verified
            # This helps provide better error messages for old verification links
            return jsonify({'error': 'Invalid verification token. If you have already verified your email, please try logging in instead.'}), 400
        
        if user.email_verified:
            print(f"✅ User {user.email} already verified")
            return jsonify({'message': 'Email already verified. You can now log in to your account.'}), 200
        
        if user.email_verification_expires and user.email_verification_expires < datetime.now(timezone.utc).replace(tzinfo=None):
            print(f"⏰ Token expired for user {user.email}")
            return jsonify({'error': 'Verification token has expired. Please request a new verification email.'}), 400
        
        # Verify the token
        print(f"🔐 Attempting verification for user {user.email}")
        if user.verify_email_token(token):
            db.session.commit()
            print(f"✅ Successfully verified user {user.email}")
            
            # Log activity
            activity = ActivityLog(
                barangay_id=user.barangay_id,
                user_id=user.id,
                action='email_verified',
                entity_type='user',
                entity_id=user.id,
                description=f'User {user.email} verified their email address',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(activity)
            db.session.commit()
            
            return jsonify({
                'message': 'Email verified successfully! Your account is now pending admin approval. You will receive an email notification once your account is approved.',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid verification token'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend email verification"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.email_verified:
            return jsonify({
                'message': 'Email already verified. You can now log in to your account.',
                'email_verified': True
            }), 200
        
        # Generate new verification token
        verification_token = user.generate_email_verification_token()
        db.session.commit()
        
        # Send verification email
        email_sent = email_service.send_verification_email(
            user.email, 
            user.get_full_name(), 
            verification_token
        )
        
        return jsonify({
            'message': 'Verification email sent successfully',
            'email_sent': email_sent
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email or username"""
    try:
        data = request.get_json()
        
        # Check if user provided email or username
        email_or_username = data.get('email') or data.get('username')
        password = data.get('password')
        
        if not email_or_username or not password:
            return jsonify({'error': 'Email/username and password required'}), 400
        
        # Try to find user by email first, then by username
        user = User.query.filter_by(email=email_or_username).first()
        if not user:
            user = User.query.filter_by(username=email_or_username).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        if not user.email_verified:
            return jsonify({'error': 'Please verify your email address before logging in'}), 401
        
        if user.status == 'rejected':
            return jsonify({'error': 'Account was rejected. Please re-register.'}), 401
        
        if user.status == 'pending':
            return jsonify({
                'error': 'Account pending admin approval',
                'message': 'Your account is pending admin approval. You will receive an email notification once your account is approved and you can log in.',
                'status': 'pending_approval'
            }), 401
        
        # Update last login
        user.last_login = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
        
        # Create access token with additional claims
        additional_claims = {
            'role': user.role,
            'status': user.status,
            'barangay_id': user.barangay_id
        }
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims=additional_claims
        )
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user.id,
            action='user_login',
            entity_type='user',
            entity_id=user.id,
            description=f'User {user.email} logged in successfully',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict(),
            'barangay': user.barangay.to_dict() if user.barangay else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict(),
            'barangay': user.barangay.to_dict() if user.barangay else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and blacklist token"""
    try:
        user_id = int(get_jwt_identity())
        jti = get_jwt()['jti']  # JWT ID
        user = User.query.get(user_id)
        
        # Add token to blacklist
        JWTBlacklist.add_to_blacklist(
            jti=jti,
            token_type='access',
            user_id=user_id,
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=1)
        )
        
        if user:
            # Log activity
            activity = ActivityLog(
                barangay_id=user.barangay_id,
                user_id=user.id,
                action='user_logout',
                entity_type='user',
                entity_id=user.id,
                description=f'User {user.email} logged out successfully',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(activity)
            db.session.commit()
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/re-register', methods=['POST'])
def re_register():
    """Re-register a rejected user with updated information"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name', 'barangay_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user exists and is rejected
        user = User.query.filter_by(email=data['email']).first()
        if not user:
            return jsonify({'error': 'No account found with this email'}), 404
        
        if user.status != 'rejected':
            return jsonify({'error': 'Account is not rejected'}), 400
        
        # Check if barangay exists
        barangay = Barangay.query.get(data['barangay_id'])
        if not barangay:
            return jsonify({'error': 'Invalid barangay'}), 400
        
        # Update user information
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.middle_name = data.get('middle_name')
        user.phone_number = data.get('phone_number')
        user.barangay_id = data['barangay_id']
        user.status = 'pending'  # Reset to pending
        user.set_password(data['password'])
        user.set_phone_number(data.get('phone_number', user.phone_number))
        user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Update or create profile
        profile = ResidentProfile.query.filter_by(user_id=user.id).first()
        if profile:
            # Update existing profile
            profile.barangay_id = data['barangay_id']
            profile.birth_date = data.get('birth_date')
            profile.gender = data.get('gender')
            profile.civil_status = data.get('civil_status')
            profile.occupation = data.get('occupation')
            profile.employer = data.get('employer')
            profile.house_number = data.get('house_number')
            profile.street = data.get('street')
            profile.purok = data.get('purok')
            profile.sitio = data.get('sitio')
            profile.spouse_name = data.get('spouse_name')
            profile.father_name = data.get('father_name')
            profile.mother_name = data.get('mother_name')
            profile.emergency_contact_name = data.get('emergency_contact_name')
            profile.emergency_contact_phone = data.get('emergency_contact_phone')
            profile.emergency_contact_relationship = data.get('emergency_contact_relationship')
            profile.tin_number = data.get('tin_number')
            profile.sss_number = data.get('sss_number')
            profile.philhealth_number = data.get('philhealth_number')
            profile.voter_id = data.get('voter_id')
            profile.is_verified = False
            profile.verification_notes = None
            profile.verified_by = None
            profile.verified_at = None
        else:
            # Create new profile
            profile = ResidentProfile(
                user_id=user.id,
                barangay_id=data['barangay_id'],
                birth_date=data.get('birth_date'),
                gender=data.get('gender'),
                civil_status=data.get('civil_status'),
                occupation=data.get('occupation'),
                employer=data.get('employer'),
                house_number=data.get('house_number'),
                street=data.get('street'),
                purok=data.get('purok'),
                sitio=data.get('sitio'),
                spouse_name=data.get('spouse_name'),
                father_name=data.get('father_name'),
                mother_name=data.get('mother_name'),
                emergency_contact_name=data.get('emergency_contact_name'),
                emergency_contact_phone=data.get('emergency_contact_phone'),
                emergency_contact_relationship=data.get('emergency_contact_relationship'),
                tin_number=data.get('tin_number'),
                sss_number=data.get('sss_number'),
                philhealth_number=data.get('philhealth_number'),
                voter_id=data.get('voter_id')
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user.id,
            action='user_re_registered',
            entity_type='user',
            entity_id=user.id,
            description=f'User {user.email} re-registered after rejection',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Re-registration successful. Please wait for admin approval.',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile/files', methods=['GET'])
@jwt_required()
def get_user_files_endpoint():
    """Get all files uploaded by the current user"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user files
        files = get_user_files(user_id)
        
        return jsonify({
            'files': files,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile including profile picture"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            files = {}
        else:
            data = request.form.to_dict()
            files = request.files.to_dict()
        
        # Update basic fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'phone_number' in data:
            user.set_phone_number(data['phone_number'])
        if 'email' in data:
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email']).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = data['email']
        
        # Handle profile picture upload
        profile_pic_file = files.get('profile_picture')
        if profile_pic_file:
            # Validate file
            valid, msg = validate_file(profile_pic_file)
            if not valid:
                return jsonify({'error': f'Profile picture: {msg}'}), 400
            
            # Save profile picture to permanent storage
            filename, file_path = save_temp_file(profile_pic_file, 'profile')
            
            # Move to permanent storage
            permanent_path = move_temp_to_permanent(file_path, f'users/{user_id}')
            if permanent_path:
                user.profile_picture_url = os.path.basename(permanent_path)
            else:
                return jsonify({'error': 'Failed to save profile picture'}), 500
        
        # Update timestamp
        user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Commit changes
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            action='profile_updated',
            details=f'Updated profile information',
            barangay_id=user.barangay_id
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/profile/files/migrate', methods=['POST'])
@jwt_required()
def migrate_user_files():
    """Migrate user's temporary files to permanent storage"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.status != 'approved':
            return jsonify({'error': 'Only approved users can migrate files'}), 403
        
        # Migrate files
        migrated_files = migrate_user_files_to_permanent(user_id)
        
        if not migrated_files:
            return jsonify({'message': 'No files to migrate'}), 200
        
        # Update user file paths in database
        file_mappings = {}
        for file_path in migrated_files:
            filename = os.path.basename(file_path)
            if 'valid_id' in filename:
                file_mappings['valid_id'] = filename
            elif 'selfie' in filename:
                file_mappings['selfie_with_id'] = filename
            elif 'profile' in filename:
                file_mappings['profile_picture'] = filename
        
        update_user_file_paths(user_id, file_mappings)
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user_id,
            action='files_migrated',
            entity_type='user',
            entity_id=user_id,
            description=f'User {user.email} migrated {len(migrated_files)} files to permanent storage',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully migrated {len(migrated_files)} files',
            'migrated_files': migrated_files,
            'file_mappings': file_mappings
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
