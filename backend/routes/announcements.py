from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.announcement import Announcement
from models.user import User
from models.activity_log import ActivityLog
from datetime import datetime
import json

announcements_bp = Blueprint('announcements', __name__)

@announcements_bp.route('/', methods=['GET'])
def get_announcements():
    """Get all active announcements (public)"""
    try:
        category = request.args.get('category')
        priority = request.args.get('priority')
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Announcement.query.filter_by(is_active=True)
        
        if category:
            query = query.filter_by(category=category)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        if search:
            query = query.filter(
                db.or_(
                    Announcement.title.contains(search),
                    Announcement.content.contains(search)
                )
            )
        
        # Order by pinned first, then by priority, then by created_at
        query = query.order_by(
            Announcement.is_pinned.desc(),
            Announcement.priority.desc(),
            Announcement.created_at.desc()
        )
        
        announcements = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'announcements': [announcement.to_dict() for announcement in announcements.items],
            'total': announcements.total,
            'pages': announcements.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/<int:announcement_id>', methods=['GET'])
def get_announcement(announcement_id):
    """Get a specific announcement"""
    try:
        announcement = Announcement.query.get(announcement_id)
        if not announcement or not announcement.is_active:
            return jsonify({'error': 'Announcement not found'}), 404
        
        return jsonify(announcement.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/categories', methods=['GET'])
def get_announcement_categories():
    """Get all announcement categories"""
    try:
        categories = db.session.query(Announcement.category).filter_by(is_active=True).distinct().all()
        return jsonify([cat[0] for cat in categories]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/', methods=['POST'])
@jwt_required()
def create_announcement():
    """Create a new announcement (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Get the correct barangay_id from the Barangay table
        # Since User.barangay_id references locations.id, we need to find the corresponding Barangay record
        from models.barangay import Barangay
        barangay = Barangay.query.first()  # Assuming there's only one barangay in the system
        
        if not barangay:
            return jsonify({'error': 'No barangay configuration found'}), 404
        
        announcement = Announcement(
            barangay_id=barangay.id,  # Use the actual Barangay ID
            author_id=user_id,
            title=data['title'],
            content=data['content'],
            category=data['category'],
            priority=data.get('priority', 'medium'),
            location=data.get('location', ''),
            event_date=datetime.fromisoformat(data['event_date']) if data.get('event_date') else None,
            event_time=data.get('event_time', ''),
            is_pinned=data.get('is_pinned', False)
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=barangay.id,  # Use the correct Barangay ID
            action='announcement_created',
            details=f'Created announcement: {announcement.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement created successfully',
            'announcement': announcement.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/<int:announcement_id>', methods=['PUT'])
@jwt_required()
def update_announcement(announcement_id):
    """Update an announcement (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get the correct barangay_id from the Barangay table
        from models.barangay import Barangay
        barangay = Barangay.query.first()
        
        if not barangay:
            return jsonify({'error': 'No barangay configuration found'}), 404
        
        announcement = Announcement.query.get(announcement_id)
        if not announcement or announcement.barangay_id != barangay.id:
            return jsonify({'error': 'Announcement not found'}), 404
        
        data = request.get_json()
        
        announcement.title = data.get('title', announcement.title)
        announcement.content = data.get('content', announcement.content)
        announcement.category = data.get('category', announcement.category)
        announcement.priority = data.get('priority', announcement.priority)
        announcement.location = data.get('location', announcement.location)
        announcement.event_date = datetime.fromisoformat(data['event_date']) if data.get('event_date') else announcement.event_date
        announcement.event_time = data.get('event_time', announcement.event_time)
        announcement.is_pinned = data.get('is_pinned', announcement.is_pinned)
        announcement.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=barangay.id,  # Use the correct Barangay ID
            action='announcement_updated',
            details=f'Updated announcement: {announcement.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Announcement updated successfully',
            'announcement': announcement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
def delete_announcement(announcement_id):
    """Delete an announcement (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get the correct barangay_id from the Barangay table
        from models.barangay import Barangay
        barangay = Barangay.query.first()
        
        if not barangay:
            return jsonify({'error': 'No barangay configuration found'}), 404
        
        announcement = Announcement.query.get(announcement_id)
        if not announcement or announcement.barangay_id != barangay.id:
            return jsonify({'error': 'Announcement not found'}), 404
        
        # Soft delete by setting is_active to False
        announcement.is_active = False
        announcement.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=barangay.id,  # Use the correct Barangay ID
            action='announcement_deleted',
            details=f'Deleted announcement: {announcement.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'Announcement deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/<int:announcement_id>/pin', methods=['POST'])
@jwt_required()
def pin_announcement(announcement_id):
    """Pin/unpin an announcement (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get the correct barangay_id from the Barangay table
        from models.barangay import Barangay
        barangay = Barangay.query.first()
        
        if not barangay:
            return jsonify({'error': 'No barangay configuration found'}), 404
        
        announcement = Announcement.query.get(announcement_id)
        if not announcement or announcement.barangay_id != barangay.id:
            return jsonify({'error': 'Announcement not found'}), 404
        
        announcement.is_pinned = not announcement.is_pinned
        announcement.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        action = 'pinned' if announcement.is_pinned else 'unpinned'
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=barangay.id,  # Use the correct Barangay ID
            action=f'announcement_{action}',
            details=f'{action.capitalize()} announcement: {announcement.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': f'Announcement {action} successfully',
            'announcement': announcement.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@announcements_bp.route('/admin/announcements', methods=['GET'])
@jwt_required()
def get_all_announcements():
    """Get all announcements for admin management"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get the correct barangay_id from the Barangay table
        from models.barangay import Barangay
        barangay = Barangay.query.first()
        
        if not barangay:
            return jsonify({'error': 'No barangay configuration found'}), 404
        
        category = request.args.get('category')
        priority = request.args.get('priority')
        status = request.args.get('status')  # active, inactive, all
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Announcement.query.filter_by(barangay_id=barangay.id)
        
        if status == 'active':
            query = query.filter_by(is_active=True)
        elif status == 'inactive':
            query = query.filter_by(is_active=False)
        
        if category:
            query = query.filter_by(category=category)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        if search:
            query = query.filter(
                db.or_(
                    Announcement.title.contains(search),
                    Announcement.content.contains(search)
                )
            )
        
        # Order by pinned first, then by created_at desc
        query = query.order_by(
            Announcement.is_pinned.desc(),
            Announcement.created_at.desc()
        )
        
        announcements = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'announcements': [announcement.to_dict() for announcement in announcements.items],
            'total': announcements.total,
            'pages': announcements.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
