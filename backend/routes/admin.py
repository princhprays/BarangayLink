from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.user import User
from models.resident_profile import ResidentProfile
from models.activity_log import ActivityLog
from models.document_request import DocumentRequest
from models.sos_request import SOSRequest
from models.relocation_request import RelocationRequest
from models.item_request import ItemRequest
from utils.file_handler import move_temp_to_permanent, delete_user_files, migrate_user_files_to_permanent, update_user_file_paths
from utils.email_service import email_service
from datetime import datetime, timedelta, timezone
import os
import re

admin_bp = Blueprint('admin', __name__)

def determine_priority(request_type, request_data=None, document_type_name=None, purpose=None, emergency_type=None, created_at=None):
    """
    Determine request priority based on various factors
    Returns: 'low', 'medium', 'high', 'urgent'
    """
    priority_score = 0
    
    # Base priority by request type
    if request_type == 'sos':
        priority_score += 50  # SOS requests are always high priority
        if emergency_type:
            emergency_high_priority = ['medical', 'fire', 'police', 'accident', 'crime']
            if any(keyword in emergency_type.lower() for keyword in emergency_high_priority):
                priority_score += 30
    elif request_type == 'document':
        priority_score += 20  # Base score for documents
        
        # Document type priority
        if document_type_name:
            high_priority_docs = ['medical', 'emergency', 'death', 'funeral', 'hospital', 'accident']
            medium_priority_docs = ['employment', 'business', 'scholarship', 'education']
            low_priority_docs = ['indigency', 'clearance', 'certificate', 'residency']
            
            doc_name_lower = document_type_name.lower()
            if any(keyword in doc_name_lower for keyword in high_priority_docs):
                priority_score += 30
            elif any(keyword in doc_name_lower for keyword in medium_priority_docs):
                priority_score += 15
            elif any(keyword in doc_name_lower for keyword in low_priority_docs):
                priority_score += 5
        
        # Purpose-based priority
        if purpose:
            purpose_lower = purpose.lower()
            urgent_keywords = ['emergency', 'urgent', 'asap', 'immediately', 'hospital', 'medical', 'death', 'funeral', 'accident']
            high_keywords = ['employment', 'job', 'work', 'business', 'scholarship', 'education', 'deadline']
            medium_keywords = ['government', 'official', 'requirement', 'application']
            
            if any(keyword in purpose_lower for keyword in urgent_keywords):
                priority_score += 40
            elif any(keyword in purpose_lower for keyword in high_keywords):
                priority_score += 25
            elif any(keyword in purpose_lower for keyword in medium_keywords):
                priority_score += 10
    
    elif request_type == 'relocation':
        priority_score += 15  # Relocation requests are usually medium priority
    
    elif request_type == 'item':
        priority_score += 10  # Item requests are usually low-medium priority
    
    # Time-based priority (older requests get higher priority)
    if created_at:
        try:
            if isinstance(created_at, str):
                created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                created_date = created_at
            
            days_old = (datetime.now() - created_date.replace(tzinfo=None)).days
            if days_old >= 7:
                priority_score += 20  # Very old requests
            elif days_old >= 3:
                priority_score += 10  # Old requests
            elif days_old >= 1:
                priority_score += 5   # Slightly old requests
        except:
            pass  # If date parsing fails, continue without time bonus
    
    # Convert score to priority level
    if priority_score >= 80:
        return 'urgent'
    elif priority_score >= 60:
        return 'high'
    elif priority_score >= 30:
        return 'medium'
    else:
        return 'low'

def admin_required(f):
    """Decorator to require admin role"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard():
    """Get admin dashboard data"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Get barangay-specific statistics
        barangay_id = user.barangay_id
        
        # Count pending residents
        pending_residents = User.query.filter_by(
            barangay_id=barangay_id,
            status='pending',
            role='resident'
        ).count()
        
        # Count total residents
        total_residents = User.query.filter_by(
            barangay_id=barangay_id,
            role='resident'
        ).count()
        
        # Count approved residents
        approved_residents = User.query.filter_by(
            barangay_id=barangay_id,
            status='approved',
            role='resident'
        ).count()
        
        return jsonify({
            'barangay_id': barangay_id,
            'pending_residents': pending_residents,
            'total_residents': total_residents,
            'approved_residents': approved_residents
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/residents/pending', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_residents():
    """Get pending resident registrations with pagination and filtering"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        sort_by = request.args.get('sort_by', 'created_at', type=str)
        sort_order = request.args.get('sort_order', 'desc', type=str)
        
        # Build query - only show email verified users
        query = User.query.filter_by(
            barangay_id=user.barangay_id,
            status='pending',
            role='resident',
            email_verified=True
        )
        
        # Apply search filter
        if search:
            query = query.filter(
                db.or_(
                    User.first_name.ilike(f'%{search}%'),
                    User.last_name.ilike(f'%{search}%'),
                    User.email.ilike(f'%{search}%')
                )
            )
        
        # Apply sorting
        if hasattr(User, sort_by):
            if sort_order == 'desc':
                query = query.order_by(getattr(User, sort_by).desc())
            else:
                query = query.order_by(getattr(User, sort_by).asc())
        
        # Paginate results
        pagination = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        residents_data = []
        for resident in pagination.items:
            profile = ResidentProfile.query.filter_by(user_id=resident.id).first()
            resident_data = resident.to_dict()
            resident_data['profile'] = profile.to_dict() if profile else None
            residents_data.append(resident_data)
        
        return jsonify({
            'residents': residents_data,
            'pagination': {
                'page': pagination.page,
                'pages': pagination.pages,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/residents/<int:resident_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_resident_details(resident_id):
    """Get detailed resident information for verification"""
    try:
        admin_id = int(get_jwt_identity())
        admin = User.query.get(admin_id)
        
        resident = User.query.get(resident_id)
        if not resident:
            return jsonify({'error': 'Resident not found'}), 404
        
        if resident.barangay_id != admin.barangay_id:
            return jsonify({'error': 'Access denied'}), 403
        
        if resident.role != 'resident':
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Get resident profile
        profile = ResidentProfile.query.filter_by(user_id=resident_id).first()
        
        # Get activity logs for this resident
        activities = ActivityLog.query.filter_by(
            barangay_id=admin.barangay_id,
            user_id=resident_id
        ).order_by(ActivityLog.created_at.desc()).limit(10).all()
        
        return jsonify({
            'resident': resident.to_dict(),
            'profile': profile.to_dict() if profile else None,
            'activities': [activity.to_dict() for activity in activities]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/residents/<int:resident_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def approve_resident(resident_id):
    """Approve a resident registration"""
    try:
        admin_id = int(get_jwt_identity())
        admin = User.query.get(admin_id)
        
        resident = User.query.get(resident_id)
        if not resident:
            return jsonify({'error': 'Resident not found'}), 404
        
        if resident.barangay_id != admin.barangay_id:
            return jsonify({'error': 'Access denied'}), 403
        
        if resident.role != 'resident':
            return jsonify({'error': 'Invalid user type'}), 400
        
        # Migrate files from temp to permanent storage
        try:
            migrated_files = migrate_user_files_to_permanent(resident_id)
            
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
            
            # Update the resident's file paths
            if file_mappings:
                update_user_file_paths(resident_id, file_mappings)
                
        except Exception as e:
            return jsonify({'error': f'Failed to migrate files: {str(e)}'}), 500
        
        # Update resident status
        resident.status = 'approved'
        resident.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Update profile verification
        profile = ResidentProfile.query.filter_by(user_id=resident_id).first()
        if profile:
            profile.is_verified = True
            profile.verified_by = admin_id
            profile.verified_at = datetime.now(timezone.utc).replace(tzinfo=None)
            profile.verification_notes = 'Approved by admin'
        
        db.session.commit()
        
        # Send approval email
        email_service.send_approval_email(
            resident.email,
            resident.get_full_name(),
            approved=True
        )
        
        # Log activity
        activity = ActivityLog(
            barangay_id=admin.barangay_id,
            user_id=admin_id,
            action='resident_approved',
            entity_type='user',
            entity_id=resident_id,
            description=f'Resident {resident.email} approved by admin',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'Resident approved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/residents/<int:resident_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def reject_resident(resident_id):
    """Reject a resident registration"""
    try:
        admin_id = int(get_jwt_identity())
        admin = User.query.get(admin_id)
        
        resident = User.query.get(resident_id)
        if not resident:
            return jsonify({'error': 'Resident not found'}), 404
        
        if resident.barangay_id != admin.barangay_id:
            return jsonify({'error': 'Access denied'}), 403
        
        if resident.role != 'resident':
            return jsonify({'error': 'Invalid user type'}), 400
        
        data = request.get_json()
        rejection_reason = data.get('reason', 'No reason provided')
        rejection_category = data.get('category', 'other')  # 'incomplete_info', 'invalid_documents', 'duplicate', 'other'
        
        # Update resident status and rejection reason
        resident.status = 'rejected'
        resident.rejection_reason = f"[{rejection_category}] {rejection_reason}"
        resident.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Update profile verification
        profile = ResidentProfile.query.filter_by(user_id=resident_id).first()
        if profile:
            profile.verification_notes = f"[{rejection_category}] {rejection_reason}"
            profile.verified_by = admin_id
            profile.verified_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Send rejection email
        email_service.send_approval_email(
            resident.email,
            resident.get_full_name(),
            approved=False,
            rejection_reason=rejection_reason
        )
        
        # Log activity
        activity = ActivityLog(
            barangay_id=admin.barangay_id,
            user_id=admin_id,
            action='resident_rejected',
            entity_type='user',
            entity_id=resident_id,
            description=f'Resident {resident.email} rejected by admin: {rejection_reason}',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'Resident rejected successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/requests', methods=['GET'])
@jwt_required()
@admin_required
def get_all_requests():
    """Get all types of requests for admin management"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        barangay_id = user.barangay_id
        
        # Get query parameters
        request_type = request.args.get('type', 'all')
        status = request.args.get('status', 'all')
        priority = request.args.get('priority', 'all')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        all_requests = []
        
        # Get document requests
        if request_type in ['all', 'document']:
            # Since DocumentRequest.barangay_id references barangays.id but User.barangay_id references locations.id,
            # we need to get all document requests (there's only one barangay)
            doc_requests = DocumentRequest.query
            if status != 'all':
                doc_requests = doc_requests.filter_by(status=status)
            
            for req in doc_requests.order_by(DocumentRequest.created_at.desc()).all():
                requester = User.query.get(req.requester_id)
                doc_type_name = 'Unknown'
                try:
                    if req.document_type:
                        doc_type_name = req.document_type.name
                except Exception:
                    doc_type_name = 'Unknown'
                
                # Determine priority based on document type, purpose, and age
                priority = determine_priority(
                    request_type='document',
                    document_type_name=doc_type_name,
                    purpose=req.purpose,
                    created_at=req.created_at
                )
                
                all_requests.append({
                    'id': req.id,
                    'type': 'document',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'status': req.status,
                    'created_at': req.created_at.isoformat(),
                    'processed_at': req.processed_at.isoformat() if req.processed_at else None,
                    'priority': priority,
                    'description': f"Document request: {doc_type_name}",
                    'purpose': req.purpose or 'No purpose specified',
                    'quantity': req.quantity,
                    'delivery_method': req.delivery_method,
                    'delivery_address': req.delivery_address,
                    'delivery_notes': req.delivery_notes,
                    'document_type_name': doc_type_name,
                    'requester_email': requester.email if requester else 'Unknown',
                    'requester_phone': requester.phone_number or requester.contact_number or 'No phone number'
                })
        
        # Get SOS requests
        if request_type in ['all', 'sos']:
            # Since SOSRequest.barangay_id references barangays.id but User.barangay_id references locations.id,
            # we need to get all SOS requests (there's only one barangay)
            sos_requests = SOSRequest.query
            if status != 'all':
                sos_requests = sos_requests.filter_by(status=status)
            
            for req in sos_requests.order_by(SOSRequest.created_at.desc()).all():
                requester = User.query.get(req.requester_id)
                
                # Determine priority based on emergency type and age
                priority = determine_priority(
                    request_type='sos',
                    emergency_type=req.emergency_type,
                    created_at=req.created_at
                )
                
                all_requests.append({
                    'id': req.id,
                    'type': 'sos',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'status': req.status,
                    'created_at': req.created_at.isoformat(),
                    'processed_at': req.responded_at.isoformat() if req.responded_at else None,
                    'priority': priority,
                    'description': f"SOS Request: {req.emergency_type} - {req.description}"
                })
        
        # Get relocation requests
        if request_type in ['all', 'relocation']:
            # Since RelocationRequest.barangay_id references barangays.id but User.barangay_id references locations.id,
            # we need to get all relocation requests (there's only one barangay)
            relocation_requests = RelocationRequest.query
            if status != 'all':
                relocation_requests = relocation_requests.filter_by(status=status)
            
            for req in relocation_requests.order_by(RelocationRequest.created_at.desc()).all():
                requester = User.query.get(req.requester_id)
                from_barangay_name = 'Unknown'
                to_barangay_name = 'Unknown'
                try:
                    if req.from_barangay:
                        from_barangay_name = req.from_barangay.name
                    if req.to_barangay:
                        to_barangay_name = req.to_barangay.name
                except Exception:
                    pass
                
                # Determine priority based on age
                priority = determine_priority(
                    request_type='relocation',
                    created_at=req.created_at
                )
                
                all_requests.append({
                    'id': req.id,
                    'type': 'relocation',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'status': req.status,
                    'created_at': req.created_at.isoformat(),
                    'processed_at': req.processed_at.isoformat() if req.processed_at else None,
                    'priority': priority,
                    'description': f"Relocation Request: {from_barangay_name} to {to_barangay_name}"
                })
        
        # Get item requests
        if request_type in ['all', 'item']:
            item_requests = ItemRequest.query.join(User, ItemRequest.requester_id == User.id).filter(User.barangay_id == barangay_id)
            if status != 'all':
                item_requests = item_requests.filter_by(status=status)
            
            for req in item_requests.order_by(ItemRequest.created_at.desc()).all():
                requester = User.query.get(req.requester_id)
                item_title = 'Unknown Item'
                try:
                    if req.item:
                        item_title = req.item.title
                except Exception:
                    item_title = 'Unknown Item'
                
                # Determine priority based on age
                priority = determine_priority(
                    request_type='item',
                    created_at=req.created_at
                )
                
                all_requests.append({
                    'id': req.id,
                    'type': 'item',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'status': req.status,
                    'created_at': req.created_at.isoformat(),
                    'processed_at': req.processed_at.isoformat() if req.processed_at else None,
                    'priority': priority,
                    'description': f"Item Request: {item_title}"
                })
        
        # Debug logging before filtering
        print(f"Before priority filtering - Total requests: {len(all_requests)}")
        print(f"Priority filter: {priority}")
        print(f"Request priorities: {[req['priority'] for req in all_requests]}")
        
        # Filter by priority if specified
        if priority != 'all':
            original_count = len(all_requests)
            all_requests = [req for req in all_requests if req['priority'] == priority]
            print(f"After priority filtering - Filtered from {original_count} to {len(all_requests)} requests")
        
        # Sort all requests by priority (urgent first), then by created_at desc
        priority_order = {'urgent': 0, 'high': 1, 'medium': 2, 'low': 3}
        all_requests.sort(key=lambda x: (priority_order.get(x['priority'], 4), x['created_at']), reverse=False)
        
        # Simple pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated_requests = all_requests[start:end]
        
        # Debug logging
        print(f"Admin requests endpoint - Found {len(all_requests)} total requests")
        print(f"Request types: {[req['type'] for req in all_requests]}")
        print(f"Request priorities: {[req['priority'] for req in all_requests]}")
        print(f"Priority filter applied: {priority}")
        
        return jsonify({
            'success': True,
            'data': paginated_requests,
            'total': len(all_requests),
            'page': page,
            'per_page': per_page,
            'pages': (len(all_requests) + per_page - 1) // per_page,
            'debug_info': {
                'priority_filter': priority,
                'all_priorities': list(set([req['priority'] for req in all_requests])),
                'total_before_filter': len(all_requests)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/requests/<int:request_id>/details', methods=['GET'])
@jwt_required()
@admin_required
def get_request_details(request_id):
    """Get detailed information about a specific request"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        # Try to find the request in different tables
        request_data = None
        request_type = None
        
        # Check document requests
        doc_request = DocumentRequest.query.get(request_id)
        if doc_request:
            requester = User.query.get(doc_request.requester_id)
            doc_type_name = 'Unknown'
            try:
                if doc_request.document_type:
                    doc_type_name = doc_request.document_type.name
            except Exception:
                doc_type_name = 'Unknown'
            
            request_data = {
                'id': doc_request.id,
                'type': 'document',
                'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                'requester_email': requester.email if requester else 'Unknown',
                'requester_phone': requester.phone_number or requester.contact_number or 'No phone number',
                'status': doc_request.status,
                'created_at': doc_request.created_at.isoformat(),
                'processed_at': doc_request.processed_at.isoformat() if doc_request.processed_at else None,
                'purpose': doc_request.purpose or 'No purpose specified',
                'quantity': doc_request.quantity,
                'delivery_method': doc_request.delivery_method,
                'delivery_address': doc_request.delivery_address,
                'delivery_notes': doc_request.delivery_notes,
                'document_type_name': doc_type_name,
                'processing_notes': doc_request.processing_notes,
                'rejection_reason': doc_request.rejection_reason
            }
            request_type = 'document'
        
        # Check SOS requests
        if not request_data:
            sos_request = SOSRequest.query.get(request_id)
            if sos_request:
                requester = User.query.get(sos_request.requester_id)
                request_data = {
                    'id': sos_request.id,
                    'type': 'sos',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'requester_email': requester.email if requester else 'Unknown',
                    'requester_phone': requester.phone_number or requester.contact_number or 'No phone number',
                    'status': sos_request.status,
                    'created_at': sos_request.created_at.isoformat(),
                    'processed_at': sos_request.responded_at.isoformat() if sos_request.responded_at else None,
                    'emergency_type': sos_request.emergency_type,
                    'description': sos_request.description,
                    'location': sos_request.location,
                    'contact_number': sos_request.contact_number
                }
                request_type = 'sos'
        
        # Check relocation requests
        if not request_data:
            relocation_request = RelocationRequest.query.get(request_id)
            if relocation_request:
                requester = User.query.get(relocation_request.requester_id)
                from_barangay_name = 'Unknown'
                to_barangay_name = 'Unknown'
                try:
                    if relocation_request.from_barangay:
                        from_barangay_name = relocation_request.from_barangay.name
                    if relocation_request.to_barangay:
                        to_barangay_name = relocation_request.to_barangay.name
                except Exception:
                    pass
                
                request_data = {
                    'id': relocation_request.id,
                    'type': 'relocation',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'requester_email': requester.email if requester else 'Unknown',
                    'requester_phone': requester.phone_number or requester.contact_number or 'No phone number',
                    'status': relocation_request.status,
                    'created_at': relocation_request.created_at.isoformat(),
                    'processed_at': relocation_request.processed_at.isoformat() if relocation_request.processed_at else None,
                    'from_barangay': from_barangay_name,
                    'to_barangay': to_barangay_name,
                    'reason': relocation_request.reason,
                    'notes': relocation_request.notes
                }
                request_type = 'relocation'
        
        # Check item requests
        if not request_data:
            item_request = ItemRequest.query.get(request_id)
            if item_request:
                requester = User.query.get(item_request.requester_id)
                item_title = 'Unknown Item'
                try:
                    if item_request.item:
                        item_title = item_request.item.title
                except Exception:
                    item_title = 'Unknown Item'
                
                request_data = {
                    'id': item_request.id,
                    'type': 'item',
                    'requester_name': f"{requester.first_name} {requester.last_name}" if requester else 'Unknown',
                    'requester_email': requester.email if requester else 'Unknown',
                    'requester_phone': requester.phone_number or requester.contact_number or 'No phone number',
                    'status': item_request.status,
                    'created_at': item_request.created_at.isoformat(),
                    'processed_at': item_request.processed_at.isoformat() if item_request.processed_at else None,
                    'item_title': item_title,
                    'message': item_request.message,
                    'quantity': item_request.quantity
                }
                request_type = 'item'
        
        if not request_data:
            return jsonify({'success': False, 'error': 'Request not found'}), 404
        
        # Get uploaded files for document requests
        uploaded_files = []
        if request_type == 'document':
            from utils.file_handler import get_user_files
            uploaded_files = get_user_files(doc_request.requester_id)
        
        return jsonify({
            'success': True,
            'data': request_data,
            'uploaded_files': uploaded_files
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_all_users():
    """Get all users for admin management"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        barangay_id = user.barangay_id
        
        # Get query parameters
        role = request.args.get('role', 'all')
        status = request.args.get('status', 'all')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Build query - get all users in the same barangay (location)
        query = User.query.filter_by(barangay_id=barangay_id)
        
        if role != 'all':
            query = query.filter_by(role=role)
        
        if status != 'all':
            query = query.filter_by(status=status)
        
        # Paginate results
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        users_data = []
        for user in pagination.items:
            profile = ResidentProfile.query.filter_by(user_id=user.id).first()
            user_data = user.to_dict()
            user_data['profile'] = profile.to_dict() if profile else None
            
            # Add location relationship data for address construction
            user_data['province'] = {'name': user.province.name} if user.province else None
            user_data['municipality'] = {'name': user.municipality.name} if user.municipality else None
            user_data['barangay'] = {'name': user.barangay.name} if user.barangay else None
            
            users_data.append(user_data)
        
        return jsonify({
            'success': True,
            'data': users_data,
            'total': pagination.total,
            'page': pagination.page,
            'per_page': pagination.per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
