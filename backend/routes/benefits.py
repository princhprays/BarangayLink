from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models.benefit import Benefit
from models.benefit_application import BenefitApplication
from models.user import User
from models.activity_log import ActivityLog
from datetime import datetime, timezone
import json

benefits_bp = Blueprint('benefits', __name__)

@benefits_bp.route('/', methods=['GET'])
def get_benefits():
    """Get all active benefits (public)"""
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Benefit.query.filter_by(is_active=True)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                db.or_(
                    Benefit.title.contains(search),
                    Benefit.description.contains(search)
                )
            )
        
        benefits = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'benefits': [benefit.to_dict() for benefit in benefits.items],
            'total': benefits.total,
            'pages': benefits.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/<int:benefit_id>', methods=['GET'])
def get_benefit(benefit_id):
    """Get a specific benefit"""
    try:
        benefit = Benefit.query.get(benefit_id)
        if not benefit or not benefit.is_active:
            return jsonify({'error': 'Benefit not found'}), 404
        
        return jsonify(benefit.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/categories', methods=['GET'])
def get_benefit_categories():
    """Get all benefit categories"""
    try:
        categories = db.session.query(Benefit.category).filter_by(is_active=True).distinct().all()
        return jsonify([cat[0] for cat in categories]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/admin/benefits', methods=['GET'])
@jwt_required()
def get_admin_benefits():
    """Get all benefits for admin management (including inactive)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        category = request.args.get('category')
        search = request.args.get('search')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = Benefit.query.filter_by(barangay_id=user.barangay_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                db.or_(
                    Benefit.title.contains(search),
                    Benefit.description.contains(search)
                )
            )
        
        # Order by created_at desc
        query = query.order_by(Benefit.created_at.desc())
        
        benefits = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'benefits': [benefit.to_dict() for benefit in benefits.items],
            'total': benefits.total,
            'pages': benefits.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/', methods=['POST'])
@jwt_required()
def create_benefit():
    """Create a new benefit (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        benefit = Benefit(
            barangay_id=user.barangay_id,
            title=data['title'],
            description=data['description'],
            category=data['category'],
            eligibility_criteria=data['eligibility_criteria'],
            required_documents=data.get('required_documents', ''),
            application_process=data.get('application_process', ''),
            contact_person=data.get('contact_person', ''),
            contact_number=data.get('contact_number', ''),
            contact_email=data.get('contact_email', '')
        )
        
        db.session.add(benefit)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_created',
            details=f'Created benefit: {benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Benefit created successfully',
            'benefit': benefit.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/<int:benefit_id>', methods=['PUT'])
@jwt_required()
def update_benefit(benefit_id):
    """Update a benefit (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        benefit = Benefit.query.get(benefit_id)
        if not benefit or benefit.barangay_id != user.barangay_id:
            return jsonify({'error': 'Benefit not found'}), 404
        
        data = request.get_json()
        
        benefit.title = data.get('title', benefit.title)
        benefit.description = data.get('description', benefit.description)
        benefit.category = data.get('category', benefit.category)
        benefit.eligibility_criteria = data.get('eligibility_criteria', benefit.eligibility_criteria)
        benefit.required_documents = data.get('required_documents', benefit.required_documents)
        benefit.application_process = data.get('application_process', benefit.application_process)
        benefit.contact_person = data.get('contact_person', benefit.contact_person)
        benefit.contact_number = data.get('contact_number', benefit.contact_number)
        benefit.contact_email = data.get('contact_email', benefit.contact_email)
        benefit.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_updated',
            details=f'Updated benefit: {benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Benefit updated successfully',
            'benefit': benefit.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/<int:benefit_id>', methods=['DELETE'])
@jwt_required()
def delete_benefit(benefit_id):
    """Delete a benefit (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        benefit = Benefit.query.get(benefit_id)
        if not benefit or benefit.barangay_id != user.barangay_id:
            return jsonify({'error': 'Benefit not found'}), 404
        
        # Soft delete by setting is_active to False
        benefit.is_active = False
        benefit.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_deleted',
            details=f'Deleted benefit: {benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({'message': 'Benefit deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/applications', methods=['POST'])
@jwt_required()
def create_benefit_application():
    """Create a new benefit application (resident only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        
        data = request.get_json()
        benefit_id = data['benefit_id']
        
        benefit = Benefit.query.get(benefit_id)
        if not benefit or not benefit.is_active:
            return jsonify({'error': 'Benefit not found'}), 404
        
        # Check if user already has a pending application for this benefit
        existing_application = BenefitApplication.query.filter_by(
            benefit_id=benefit_id,
            applicant_id=user_id,
            status='pending'
        ).first()
        
        if existing_application:
            return jsonify({'error': 'You already have a pending application for this benefit'}), 400
        
        application = BenefitApplication(
            barangay_id=user.barangay_id,
            benefit_id=benefit_id,
            applicant_id=user_id,
            application_data=json.dumps(data.get('application_data', {})),
            documents=json.dumps(data.get('documents', [])),
            notes=data.get('notes', '')
        )
        
        db.session.add(application)
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_application_created',
            details=f'Applied for benefit: {benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application': application.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Get current user's benefit applications"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = BenefitApplication.query.filter_by(applicant_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        applications = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'applications': [app.to_dict() for app in applications.items],
            'total': applications.total,
            'pages': applications.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/admin/applications', methods=['GET'])
@jwt_required()
def get_all_applications():
    """Get all benefit applications (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        status = request.args.get('status')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = BenefitApplication.query.filter_by(barangay_id=user.barangay_id)
        
        if status:
            query = query.filter_by(status=status)
        
        applications = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'applications': [app.to_dict() for app in applications.items],
            'total': applications.total,
            'pages': applications.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/admin/applications/<int:application_id>/approve', methods=['POST'])
@jwt_required()
def approve_application(application_id):
    """Approve a benefit application (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        application = BenefitApplication.query.get(application_id)
        if not application or application.barangay_id != user.barangay_id:
            return jsonify({'error': 'Application not found'}), 404
        
        if application.status != 'pending':
            return jsonify({'error': 'Only pending applications can be approved'}), 400
        
        data = request.get_json()
        
        application.status = 'approved'
        application.approved_by = user_id
        application.approved_at = datetime.now(timezone.utc).replace(tzinfo=None)
        application.notes = data.get('notes', application.notes)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_application_approved',
            details=f'Approved application for: {application.benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Application approved successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/admin/applications/<int:application_id>/reject', methods=['POST'])
@jwt_required()
def reject_application(application_id):
    """Reject a benefit application (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        application = BenefitApplication.query.get(application_id)
        if not application or application.barangay_id != user.barangay_id:
            return jsonify({'error': 'Application not found'}), 404
        
        if application.status != 'pending':
            return jsonify({'error': 'Only pending applications can be rejected'}), 400
        
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', '')
        
        if not rejection_reason:
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        application.status = 'rejected'
        application.rejection_reason = rejection_reason
        application.notes = data.get('notes', application.notes)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_application_rejected',
            details=f'Rejected application for: {application.benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Application rejected successfully',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@benefits_bp.route('/admin/applications/<int:application_id>/complete', methods=['POST'])
@jwt_required()
def complete_application(application_id):
    """Mark a benefit application as completed (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        application = BenefitApplication.query.get(application_id)
        if not application or application.barangay_id != user.barangay_id:
            return jsonify({'error': 'Application not found'}), 404
        
        if application.status != 'approved':
            return jsonify({'error': 'Only approved applications can be completed'}), 400
        
        application.status = 'completed'
        application.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        application.notes = request.get_json().get('notes', application.notes)
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            user_id=user_id,
            barangay_id=user.barangay_id,
            action='benefit_application_completed',
            details=f'Completed application for: {application.benefit.title}',
            ip_address=request.remote_addr
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'message': 'Application marked as completed',
            'application': application.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
