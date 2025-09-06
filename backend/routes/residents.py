from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.user import User
from models.resident_profile import ResidentProfile
from models.activity_log import ActivityLog

residents_bp = Blueprint('residents', __name__)

@residents_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_resident_profile():
    """Get current resident's profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'resident':
            return jsonify({'error': 'Access denied'}), 403
        
        profile = ResidentProfile.query.filter_by(user_id=user_id).first()
        
        return jsonify({
            'user': user.to_dict(),
            'profile': profile.to_dict() if profile else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@residents_bp.route('/profile', methods=['POST'])
@jwt_required()
def create_resident_profile():
    """Create or update resident profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'resident':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Check if profile already exists
        profile = ResidentProfile.query.filter_by(user_id=user_id).first()
        
        if profile:
            # Update existing profile
            for key, value in data.items():
                if hasattr(profile, key) and key not in ['id', 'user_id', 'barangay_id', 'created_at']:
                    setattr(profile, key, value)
        else:
            # Create new profile
            profile = ResidentProfile(
                user_id=user_id,
                barangay_id=user.barangay_id,
                **{k: v for k, v in data.items() if k not in ['id', 'user_id', 'barangay_id']}
            )
            db.session.add(profile)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user_id,
            action='profile_updated',
            entity_type='resident_profile',
            entity_id=profile.id,
            description=f'Resident profile updated',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
