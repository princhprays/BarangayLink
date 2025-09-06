from flask import Blueprint, request, jsonify
from database import db
from models.barangay import Barangay
from models.activity_log import ActivityLog

barangay_bp = Blueprint('barangay', __name__)

@barangay_bp.route('/', methods=['GET'])
def get_barangays():
    """Get all active barangays"""
    try:
        barangays = Barangay.query.filter_by(is_active=True).all()
        return jsonify({
            'barangays': [barangay.to_dict() for barangay in barangays]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@barangay_bp.route('/<int:barangay_id>', methods=['GET'])
def get_barangay(barangay_id):
    """Get specific barangay details"""
    try:
        barangay = Barangay.query.get(barangay_id)
        if not barangay:
            return jsonify({'error': 'Barangay not found'}), 404
        
        return jsonify({'barangay': barangay.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@barangay_bp.route('/register', methods=['POST'])
def register_barangay():
    """Register a new barangay (for initial setup)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'city', 'province', 'region', 'zip_code']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if barangay already exists
        existing = Barangay.query.filter_by(
            name=data['name'],
            city=data['city'],
            province=data['province']
        ).first()
        
        if existing:
            return jsonify({'error': 'Barangay already registered'}), 400
        
        # Create new barangay
        barangay = Barangay(
            name=data['name'],
            city=data['city'],
            province=data['province'],
            region=data['region'],
            zip_code=data['zip_code'],
            barangay_captain=data.get('barangay_captain'),
            contact_number=data.get('contact_number'),
            email=data.get('email'),
            address=data.get('address'),
            logo_url=data.get('logo_url')
        )
        
        db.session.add(barangay)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            barangay_id=barangay.id,
            action='barangay_registered',
            entity_type='barangay',
            entity_id=barangay.id,
            description=f'Barangay {barangay.name} registered',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Barangay registered successfully',
            'barangay': barangay.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
