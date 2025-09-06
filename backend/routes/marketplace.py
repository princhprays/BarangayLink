from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.user import User
from models.item import Item
from models.item_request import ItemRequest
from models.activity_log import ActivityLog
from utils.file_handler import validate_file, save_item_image, delete_item_images
from datetime import datetime, timezone, date
import json

marketplace_bp = Blueprint('marketplace', __name__)

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

@marketplace_bp.route('/items', methods=['GET'])
def get_items():
    """Get all approved items for marketplace browsing"""
    try:
        # Get query parameters
        barangay_id = request.args.get('barangay_id', type=int)
        category = request.args.get('category')
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        
        # Build query
        query = Item.query.filter_by(status='approved', is_available=True)
        
        if barangay_id:
            query = query.filter_by(barangay_id=barangay_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                (Item.title.contains(search)) | 
                (Item.description.contains(search))
            )
        
        # Pagination
        items = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'total': items.total,
            'pages': items.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/categories', methods=['GET'])
def get_categories():
    """Get available item categories"""
    try:
        categories = db.session.query(Item.category).filter_by(status='approved').distinct().all()
        return jsonify({
            'categories': [cat[0] for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items', methods=['POST'])
@jwt_required()
def create_item():
    """Create a new item for sharing"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        if user.status != 'approved':
            return jsonify({'error': 'Account must be approved to share items'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'category', 'condition']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Create new item
        item = Item(
            barangay_id=user.barangay_id,
            owner_id=user_id,
            title=data['title'],
            description=data.get('description'),
            category=data['category'],
            condition=data['condition'],
            value_estimate=data.get('value_estimate'),
            max_loan_days=data.get('max_loan_days', 7),
            image_urls=json.dumps(data.get('image_urls', [])) if data.get('image_urls') else None
        )
        
        db.session.add(item)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_created',
            details=f'Created item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Item created successfully',
            'item': item.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get specific item details"""
    try:
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        return jsonify({'item': item.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    """Update item details (owner only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id != user_id:
            return jsonify({'error': 'You can only update your own items'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            item.title = data['title']
        if 'description' in data:
            item.description = data['description']
        if 'category' in data:
            item.category = data['category']
        if 'condition' in data:
            item.condition = data['condition']
        if 'value_estimate' in data:
            item.value_estimate = data['value_estimate']
        if 'max_loan_days' in data:
            item.max_loan_days = data['max_loan_days']
        if 'is_available' in data:
            item.is_available = data['is_available']
        if 'image_urls' in data:
            item.image_urls = json.dumps(data['image_urls']) if data['image_urls'] else None
        
        item.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_updated',
            details=f'Updated item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Item updated successfully',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    """Delete item (owner only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id != user_id:
            return jsonify({'error': 'You can only delete your own items'}), 403
        
        # Check if item has active requests
        active_requests = ItemRequest.query.filter_by(
            item_id=item_id,
            status='approved'
        ).count()
        
        if active_requests > 0:
            return jsonify({'error': 'Cannot delete item with active requests'}), 400
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_deleted',
            details=f'Deleted item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/my-items', methods=['GET'])
@jwt_required()
def get_my_items():
    """Get current user's items"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        items = Item.query.filter_by(owner_id=user_id).order_by(Item.created_at.desc()).all()
        
        return jsonify({
            'items': [item.to_dict() for item in items]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>/request', methods=['POST'])
@jwt_required()
def request_item(item_id):
    """Request to borrow an item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        if user.status != 'approved':
            return jsonify({'error': 'Account must be approved to request items'}), 403
        
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id == user_id:
            return jsonify({'error': 'Cannot request your own item'}), 400
        
        if not item.is_available or item.status != 'approved':
            return jsonify({'error': 'Item is not available for request'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('requested_loan_days'):
            return jsonify({'error': 'Loan duration is required'}), 400
        
        if data['requested_loan_days'] > item.max_loan_days:
            return jsonify({'error': f'Maximum loan period is {item.max_loan_days} days'}), 400
        
        # Check for existing pending request
        existing_request = ItemRequest.query.filter_by(
            item_id=item_id,
            requester_id=user_id,
            status='pending'
        ).first()
        
        if existing_request:
            return jsonify({'error': 'You already have a pending request for this item'}), 400
        
        # Create request
        request_obj = ItemRequest(
            barangay_id=user.barangay_id,
            item_id=item_id,
            requester_id=user_id,
            purpose=data.get('purpose'),
            requested_loan_days=data['requested_loan_days'],
            requester_message=data.get('requester_message')
        )
        
        db.session.add(request_obj)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_requested',
            details=f'Requested item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Item request submitted successfully',
            'request': request_obj.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_my_requests():
    """Get current user's item requests"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        requests = ItemRequest.query.filter_by(requester_id=user_id).order_by(ItemRequest.created_at.desc()).all()
        
        return jsonify({
            'requests': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_request(request_id):
    """Approve an item request (item owner only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        request_obj = ItemRequest.query.get(request_id)
        
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        if request_obj.item.owner_id != user_id:
            return jsonify({'error': 'You can only approve requests for your own items'}), 403
        
        if request_obj.status != 'pending':
            return jsonify({'error': 'Request is not pending'}), 400
        
        data = request.get_json()
        
        # Update request
        request_obj.status = 'approved'
        request_obj.approved_by = user_id
        request_obj.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        request_obj.owner_message = data.get('owner_message')
        
        # Set dates
        if data.get('start_date'):
            request_obj.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        if data.get('end_date'):
            request_obj.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
        
        # Make item unavailable
        request_obj.item.is_available = False
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='request_approved',
            details=f'Approved request for item: {request_obj.item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Request approved successfully',
            'request': request_obj.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_request(request_id):
    """Reject an item request (item owner only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        request_obj = ItemRequest.query.get(request_id)
        
        if not request_obj:
            return jsonify({'error': 'Request not found'}), 404
        
        if request_obj.item.owner_id != user_id:
            return jsonify({'error': 'You can only reject requests for your own items'}), 403
        
        if request_obj.status != 'pending':
            return jsonify({'error': 'Request is not pending'}), 400
        
        data = request.get_json()
        
        if not data.get('rejection_reason'):
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        # Update request
        request_obj.status = 'rejected'
        request_obj.rejection_reason = data['rejection_reason']
        request_obj.owner_message = data.get('owner_message')
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='request_rejected',
            details=f'Rejected request for item: {request_obj.item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Request rejected successfully',
            'request': request_obj.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/admin/pending-items', methods=['GET'])
@jwt_required()
@admin_required
def get_pending_items():
    """Get pending items for admin approval"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        barangay_id = user.barangay_id
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search')
        
        # Build query
        query = Item.query.filter_by(barangay_id=barangay_id, status='pending')
        
        if search:
            query = query.filter(
                (Item.title.contains(search)) | 
                (Item.description.contains(search))
            )
        
        # Pagination
        items = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'total': items.total,
            'pages': items.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/admin/items/<int:item_id>/approve', methods=['POST'])
@jwt_required()
@admin_required
def admin_approve_item(item_id):
    """Admin approve item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.barangay_id != user.barangay_id:
            return jsonify({'error': 'Item not in your barangay'}), 403
        
        if item.status != 'pending':
            return jsonify({'error': 'Item is not pending'}), 400
        
        # Approve item
        item.status = 'approved'
        item.approved_by = user_id
        item.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_approved',
            details=f'Approved item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Item approved successfully',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/admin/items/<int:item_id>/reject', methods=['POST'])
@jwt_required()
@admin_required
def admin_reject_item(item_id):
    """Admin reject item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        item = Item.query.get(item_id)
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.barangay_id != user.barangay_id:
            return jsonify({'error': 'Item not in your barangay'}), 403
        
        if item.status != 'pending':
            return jsonify({'error': 'Item is not pending'}), 400
        
        data = request.get_json()
        
        if not data.get('rejection_reason'):
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        # Reject item
        item.status = 'rejected'
        item.rejection_reason = data['rejection_reason']
        item.approved_by = user_id
        item.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_rejected',
            details=f'Rejected item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Item rejected successfully',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/requests/<int:request_id>', methods=['DELETE'])
@jwt_required()
def cancel_item_request(request_id):
    """Cancel an item request (requester only)"""
    current_user_id = get_jwt_identity()
    
    try:
        request = ItemRequest.query.filter_by(id=request_id, barangay_id=current_user.barangay_id).first()
        if not request:
            return {'message': 'Request not found'}, 404
        
        # Check if current user is the requester
        if request.requester_id != current_user_id:
            return {'message': 'Only the requester can cancel requests'}, 403
        
        if request.status not in ['pending']:
            return {'message': 'Only pending requests can be cancelled'}, 400
        
        request.status = 'cancelled'
        request.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        return {'message': 'Request cancelled successfully'}, 200
        
    except Exception as e:
        db.session.rollback()
        return {'message': f'Error cancelling request: {str(e)}'}, 500

@marketplace_bp.route('/items/<int:item_id>/images', methods=['POST'])
@jwt_required()
def upload_item_images(item_id):
    """Upload images for an item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id != user_id:
            return jsonify({'error': 'You can only upload images for your own items'}), 403
        
        # Get uploaded files
        files = request.files.getlist('images')
        if not files or len(files) == 0:
            return jsonify({'error': 'No images provided'}), 400
        
        # Validate files
        uploaded_urls = []
        for file in files:
            if file.filename == '':
                continue
                
            # Validate file
            valid, msg = validate_file(file)
            if not valid:
                return jsonify({'error': f'Invalid file {file.filename}: {msg}'}), 400
            
            # Save file
            try:
                file_path = save_item_image(file, item_id)
                uploaded_urls.append(file_path)
            except Exception as e:
                return jsonify({'error': f'Failed to save {file.filename}: {str(e)}'}), 500
        
        # Update item with new image URLs
        current_urls = json.loads(item.image_urls) if item.image_urls else []
        current_urls.extend(uploaded_urls)
        item.image_urls = json.dumps(current_urls)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_images_uploaded',
            details=f'Uploaded {len(uploaded_urls)} images for item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully uploaded {len(uploaded_urls)} images',
            'uploaded_urls': uploaded_urls,
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>/images', methods=['DELETE'])
@jwt_required()
def delete_item_images_endpoint(item_id):
    """Delete all images for an item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id != user_id:
            return jsonify({'error': 'You can only delete images for your own items'}), 403
        
        # Delete files from filesystem
        delete_item_images(item_id)
        
        # Clear image URLs from database
        item.image_urls = None
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_images_deleted',
            details=f'Deleted all images for item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'All images deleted successfully',
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@marketplace_bp.route('/items/<int:item_id>/images/<int:image_index>', methods=['DELETE'])
@jwt_required()
def delete_single_item_image(item_id, image_index):
    """Delete a specific image from an item"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        item = Item.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item.owner_id != user_id:
            return jsonify({'error': 'You can only delete images for your own items'}), 403
        
        # Get current image URLs
        current_urls = json.loads(item.image_urls) if item.image_urls else []
        
        if image_index < 0 or image_index >= len(current_urls):
            return jsonify({'error': 'Invalid image index'}), 400
        
        # Remove the image URL
        removed_url = current_urls.pop(image_index)
        
        # Update item
        item.image_urls = json.dumps(current_urls) if current_urls else None
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='item_image_deleted',
            details=f'Deleted image {image_index} for item: {item.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Image deleted successfully',
            'removed_url': removed_url,
            'item': item.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
