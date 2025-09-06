from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.sos_request import SOSRequest
from models.user import User
from models.activity_log import ActivityLog
from database import db
from datetime import datetime, timezone

sos_bp = Blueprint('sos', __name__)

@sos_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_sos_request():
    """Create new SOS request (resident only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'resident':
            return jsonify({'success': False, 'message': 'Resident access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['emergency_type', 'description', 'location']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Get user and barangay info
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Create SOS request
        sos_request = SOSRequest(
            barangay_id=user.barangay_id,
            requester_id=user.id,
            emergency_type=data['emergency_type'],
            description=data['description'],
            location=data['location'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            contact_phone=data.get('contact_phone'),
            emergency_contact=data.get('emergency_contact'),
            emergency_contact_phone=data.get('emergency_contact_phone')
        )
        
        db.session.add(sos_request)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user.id,
            action='create_sos_request',
            entity_type='sos_request',
            entity_id=sos_request.id,
            details=f"Created SOS request: {sos_request.emergency_type}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'SOS request created successfully',
            'data': sos_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@sos_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_sos_requests():
    """Get SOS requests based on user role"""
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        
        # Get requests based on user role
        if claims.get('role') == 'admin':
            # Admin sees all requests in their barangay
            user = User.query.get(int(user_id))
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            requests = SOSRequest.query.filter_by(barangay_id=user.barangay_id).order_by(SOSRequest.created_at.desc()).all()
        else:
            # Resident sees only their requests
            requests = SOSRequest.query.filter_by(requester_id=int(user_id)).order_by(SOSRequest.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@sos_bp.route('/requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_sos_request(request_id):
    """Get specific SOS request details"""
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        
        sos_request = SOSRequest.query.get_or_404(request_id)
        
        # Check access permissions
        if claims.get('role') == 'resident' and sos_request.requester_id != int(user_id):
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'data': sos_request.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@sos_bp.route('/requests/<int:request_id>/respond', methods=['POST'])
@jwt_required()
def respond_to_sos(request_id):
    """Respond to SOS request (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        sos_request = SOSRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        if not data.get('response_notes'):
            return jsonify({'success': False, 'message': 'Response notes are required'}), 400
        
        # Update request status
        sos_request.status = 'responded'
        sos_request.responder_id = int(get_jwt_identity())
        sos_request.response_time = datetime.now(timezone.utc).replace(tzinfo=None)
        sos_request.response_notes = data['response_notes']
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=int(get_jwt_identity()),
            action='respond_to_sos',
            entity_type='sos_request',
            entity_id=sos_request.id,
            details=f"Responded to SOS request: {sos_request.emergency_type}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'SOS request responded successfully',
            'data': sos_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@sos_bp.route('/requests/<int:request_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_sos_request(request_id):
    """Resolve SOS request (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        sos_request = SOSRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        if not data.get('resolution_notes'):
            return jsonify({'success': False, 'message': 'Resolution notes are required'}), 400
        
        # Update request status
        sos_request.status = 'resolved'
        sos_request.resolved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        sos_request.resolution_notes = data['resolution_notes']
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=int(get_jwt_identity()),
            action='resolve_sos_request',
            entity_type='sos_request',
            entity_id=sos_request.id,
            details=f"Resolved SOS request: {sos_request.emergency_type}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'SOS request resolved successfully',
            'data': sos_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@sos_bp.route('/requests/<int:request_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_sos_request(request_id):
    """Cancel SOS request (resident only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'resident':
            return jsonify({'success': False, 'message': 'Resident access required'}), 403
        
        sos_request = SOSRequest.query.get_or_404(request_id)
        
        # Check if user owns this request
        if sos_request.requester_id != int(get_jwt_identity()):
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Only allow cancellation if request is active
        if sos_request.status != 'active':
            return jsonify({'success': False, 'message': 'Only active SOS requests can be cancelled'}), 400
        
        # Update request status
        sos_request.status = 'cancelled'
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=int(get_jwt_identity()),
            action='cancel_sos_request',
            entity_type='sos_request',
            entity_id=sos_request.id,
            details=f"Cancelled SOS request: {sos_request.emergency_type}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'SOS request cancelled successfully',
            'data': sos_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
