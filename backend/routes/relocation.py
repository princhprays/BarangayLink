from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.relocation_request import RelocationRequest
from models.user import User
from models.barangay import Barangay
from models.activity_log import ActivityLog
from database import db
from datetime import datetime, timezone

relocation_bp = Blueprint('relocation', __name__)

@relocation_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_relocation_request():
    """Create new relocation request (resident only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'resident':
            return jsonify({'success': False, 'message': 'Resident access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['to_barangay_id', 'new_address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        # Get user and barangay info
        user = User.query.get(claims.get('user_id'))
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Validate destination barangay
        to_barangay = Barangay.query.get(data['to_barangay_id'])
        if not to_barangay:
            return jsonify({'success': False, 'message': 'Invalid destination barangay'}), 400
        
        # Check if user is already in the destination barangay
        if user.barangay_id == data['to_barangay_id']:
            return jsonify({'success': False, 'message': 'You are already in this barangay'}), 400
        
        # Create relocation request
        relocation_request = RelocationRequest(
            requester_id=user.id,
            from_barangay_id=user.barangay_id,
            to_barangay_id=data['to_barangay_id'],
            new_address=data['new_address'],
            reason=data.get('reason', '')
        )
        
        db.session.add(relocation_request)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user.id,
            action='create_relocation_request',
            entity_type='relocation_request',
            entity_id=relocation_request.id,
            details=f"Created relocation request from {user.barangay.name} to {to_barangay.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Relocation request created successfully',
            'data': relocation_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_relocation_requests():
    """Get relocation requests based on user role"""
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        
        # Get requests based on user role
        if claims.get('role') == 'admin':
            # Admin sees all requests in their barangay
            user = User.query.get(int(user_id))
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            requests = RelocationRequest.query.filter(
                (RelocationRequest.from_barangay_id == user.barangay_id) |
                (RelocationRequest.to_barangay_id == user.barangay_id)
            ).order_by(RelocationRequest.created_at.desc()).all()
        else:
            # Resident sees only their requests
            requests = RelocationRequest.query.filter_by(requester_id=int(user_id)).order_by(RelocationRequest.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_relocation_request(request_id):
    """Get specific relocation request details"""
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        
        relocation_request = RelocationRequest.query.get_or_404(request_id)
        
        # Check access permissions
        if claims.get('role') == 'resident' and relocation_request.requester_id != int(user_id):
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'data': relocation_request.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_relocation_request(request_id):
    """Approve relocation request (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        relocation_request = RelocationRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        # Get admin user and barangay
        admin_user = User.query.get(int(get_jwt_identity()))
        if not admin_user:
            return jsonify({'success': False, 'message': 'Admin user not found'}), 404
        
        # Determine which approval to update
        if admin_user.barangay_id == relocation_request.from_barangay_id:
            # Admin is from the source barangay
            relocation_request.from_barangay_approved = True
            relocation_request.from_barangay_approved_by = admin_user.id
            relocation_request.from_barangay_approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
            relocation_request.from_barangay_notes = data.get('notes', '')
        elif admin_user.barangay_id == relocation_request.to_barangay_id:
            # Admin is from the destination barangay
            relocation_request.to_barangay_approved = True
            relocation_request.to_barangay_approved_by = admin_user.id
            relocation_request.to_barangay_approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
            relocation_request.to_barangay_notes = data.get('notes', '')
        else:
            return jsonify({'success': False, 'message': 'You can only approve requests involving your barangay'}), 403
        
        # Check if both barangays have approved
        if relocation_request.from_barangay_approved and relocation_request.to_barangay_approved:
            relocation_request.status = 'approved'
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=admin_user.id,
            action='approve_relocation_request',
            entity_type='relocation_request',
            entity_id=relocation_request.id,
            details=f"Approved relocation request from {relocation_request.from_barangay.name} to {relocation_request.to_barangay.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Relocation request approved successfully',
            'data': relocation_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_relocation_request(request_id):
    """Reject relocation request (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        relocation_request = RelocationRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        if not data.get('notes'):
            return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400
        
        # Get admin user and barangay
        admin_user = User.query.get(int(get_jwt_identity()))
        if not admin_user:
            return jsonify({'success': False, 'message': 'Admin user not found'}), 404
        
        # Determine which rejection to update
        if admin_user.barangay_id == relocation_request.from_barangay_id:
            # Admin is from the source barangay
            relocation_request.from_barangay_approved = False
            relocation_request.from_barangay_notes = data['notes']
        elif admin_user.barangay_id == relocation_request.to_barangay_id:
            # Admin is from the destination barangay
            relocation_request.to_barangay_approved = False
            relocation_request.to_barangay_notes = data['notes']
        else:
            return jsonify({'success': False, 'message': 'You can only reject requests involving your barangay'}), 403
        
        # Mark as rejected
        relocation_request.status = 'rejected'
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=admin_user.id,
            action='reject_relocation_request',
            entity_type='relocation_request',
            entity_id=relocation_request.id,
            details=f"Rejected relocation request from {relocation_request.from_barangay.name} to {relocation_request.to_barangay.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Relocation request rejected successfully',
            'data': relocation_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests/<int:request_id>/complete', methods=['POST'])
@jwt_required()
def complete_relocation_request(request_id):
    """Complete relocation request and transfer user (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        relocation_request = RelocationRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        if relocation_request.status != 'approved':
            return jsonify({'success': False, 'message': 'Request must be approved by both barangays first'}), 400
        
        # Get admin user and barangay
        admin_user = User.query.get(int(get_jwt_identity()))
        if not admin_user:
            return jsonify({'success': False, 'message': 'Admin user not found'}), 404
        
        # Only destination barangay admin can complete the transfer
        if admin_user.barangay_id != relocation_request.to_barangay_id:
            return jsonify({'success': False, 'message': 'Only destination barangay admin can complete the transfer'}), 403
        
        # Transfer user to new barangay
        user = User.query.get(relocation_request.requester_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        user.barangay_id = relocation_request.to_barangay_id
        
        # Update relocation request
        relocation_request.status = 'completed'
        relocation_request.transfer_date = datetime.now(timezone.utc).replace(tzinfo=None)
        relocation_request.transfer_notes = data.get('notes', '')
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=admin_user.id,
            action='complete_relocation_request',
            entity_type='relocation_request',
            entity_id=relocation_request.id,
            details=f"Completed relocation request: {user.get_full_name()} transferred to {relocation_request.to_barangay.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Relocation request completed successfully',
            'data': relocation_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@relocation_bp.route('/requests/<int:request_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_relocation_request(request_id):
    """Cancel relocation request (resident only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'resident':
            return jsonify({'success': False, 'message': 'Resident access required'}), 403
        
        relocation_request = RelocationRequest.query.get_or_404(request_id)
        
        # Check if user owns this request
        if relocation_request.requester_id != int(get_jwt_identity()):
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Only allow cancellation if request is pending
        if relocation_request.status != 'pending':
            return jsonify({'success': False, 'message': 'Only pending relocation requests can be cancelled'}), 400
        
        # Update request status
        relocation_request.status = 'cancelled'
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=int(get_jwt_identity()),
            action='cancel_relocation_request',
            entity_type='relocation_request',
            entity_id=relocation_request.id,
            details=f"Cancelled relocation request from {relocation_request.from_barangay.name} to {relocation_request.to_barangay.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Relocation request cancelled successfully',
            'data': relocation_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
