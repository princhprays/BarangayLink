from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models.document_type import DocumentType
from models.document_request import DocumentRequest
from models.user import User
from models.barangay import Barangay
from models.activity_log import ActivityLog
from database import db
import qrcode
import io
import base64
from datetime import datetime
import json
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import uuid
from utils.file_handler import cleanup_expired_documents, cleanup_expired_documents_by_type
from utils.email_service import email_service

documents_bp = Blueprint('documents', __name__)

# Helper function to generate QR code
def generate_qr_code(data):
    """Generate QR code for document verification"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

# Helper function to generate PDF document
def generate_document_pdf(document_request):
    """Generate modern PDF document with professional styling"""
    # Create a buffer to store the PDF
    buffer = io.BytesIO()
    
    # Create the PDF document with custom margins
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    styles = getSampleStyleSheet()
    
    # Modern color scheme
    primary_color = colors.HexColor('#1e40af')  # Blue-800
    secondary_color = colors.HexColor('#64748b')  # Slate-500
    accent_color = colors.HexColor('#059669')  # Emerald-600
    light_gray = colors.HexColor('#f8fafc')  # Slate-50
    dark_gray = colors.HexColor('#334155')  # Slate-700
    
    # Custom modern styles
    title_style = ParagraphStyle(
        'ModernTitle',
        parent=styles['Heading1'],
        fontSize=24,
        fontName='Helvetica-Bold',
        textColor=primary_color,
        spaceAfter=20,
        alignment=TA_CENTER,
        leading=28
    )
    
    subtitle_style = ParagraphStyle(
        'ModernSubtitle',
        parent=styles['Heading2'],
        fontSize=14,
        fontName='Helvetica',
        textColor=secondary_color,
        spaceAfter=15,
        alignment=TA_CENTER,
        leading=18
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        fontName='Helvetica-Bold',
        textColor=dark_gray,
        spaceAfter=12,
        spaceBefore=20,
        leading=18
    )
    
    normal_style = ParagraphStyle(
        'ModernNormal',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica',
        textColor=dark_gray,
        spaceAfter=8,
        leading=14
    )
    
    small_style = ParagraphStyle(
        'ModernSmall',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica',
        textColor=secondary_color,
        spaceAfter=4,
        leading=12
    )
    
    # Build the PDF content
    story = []
    
    # Modern Header with Barangay Info
    story.append(Spacer(1, 20))
    
    # Barangay Name (if available)
    barangay_name = "BARANGAY OFFICE"
    if hasattr(document_request, 'barangay') and document_request.barangay:
        barangay_name = document_request.barangay.name.upper()
    
    story.append(Paragraph(barangay_name, title_style))
    story.append(Paragraph("OFFICIAL DOCUMENT", subtitle_style))
    story.append(Spacer(1, 30))
    
    # Document Type with modern styling
    doc_type_box = Table([
        [Paragraph(f"<b>{document_request.document_type.name.upper()}</b>", 
                  ParagraphStyle('DocType', parent=styles['Heading1'], 
                               fontSize=18, fontName='Helvetica-Bold',
                               textColor=colors.white, alignment=TA_CENTER))]
    ], colWidths=[6*inch])
    
    doc_type_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), primary_color),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 18),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('ROUNDEDCORNERS', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(doc_type_box)
    story.append(Spacer(1, 25))
    
    # Document Information Section
    story.append(Paragraph("DOCUMENT INFORMATION", section_header_style))
    
    # Create modern table for document details
    data = [
        ['Document ID:', f"#{str(document_request.id).zfill(6)}"],
        ['Date Issued:', document_request.processed_at.strftime('%B %d, %Y') if document_request.processed_at else 'Pending'],
        ['Valid Until:', document_request.expires_at.strftime('%B %d, %Y') if document_request.expires_at else 'N/A'],
        ['Requester Name:', document_request.requester.get_full_name()],
        ['Purpose:', document_request.purpose or 'Not specified'],
        ['Quantity:', str(document_request.quantity)],
        ['Status:', f"<b>{document_request.status.title()}</b>"],
    ]
    
    # Modern table styling
    table = Table(data, colWidths=[2.2*inch, 3.8*inch])
    table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (0, -1), light_gray),
        ('TEXTCOLOR', (0, 0), (0, -1), dark_gray),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, -1), 10),
        
        # Data row styling
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (1, 0), (1, -1), 10),
        ('TEXTCOLOR', (1, 0), (1, -1), dark_gray),
        
        # Alignment and spacing
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        
        # Borders
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('LINEBELOW', (0, 0), (-1, 0), 1, primary_color),
    ]))
    
    story.append(table)
    story.append(Spacer(1, 25))
    
    # QR Code section with modern styling
    if document_request.qr_code_data:
        # QR Code header
        qr_header = Table([
            [Paragraph("DOCUMENT VERIFICATION", 
                      ParagraphStyle('QRHeader', parent=styles['Heading2'],
                                   fontSize=12, fontName='Helvetica-Bold',
                                   textColor=colors.white, alignment=TA_CENTER))]
        ], colWidths=[6*inch])
        
        qr_header.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), accent_color),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('ROUNDEDCORNERS', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(qr_header)
        story.append(Spacer(1, 15))
        
        # QR Code description
        story.append(Paragraph(
            "Scan the QR code below to verify the authenticity and validity of this document.", 
            normal_style
        ))
        story.append(Spacer(1, 15))
        
        # Add QR code image
        try:
            import base64
            from reportlab.lib.utils import ImageReader
            
            # Decode base64 image
            qr_image_data = base64.b64decode(document_request.qr_code)
            qr_buffer = io.BytesIO(qr_image_data)
            
            # Create image object with modern styling
            from reportlab.platypus import Image
            qr_img = Image(qr_buffer, width=120, height=120)
            
            # Center the QR code
            qr_table = Table([[qr_img]], colWidths=[6*inch])
            qr_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            
            story.append(qr_table)
            
        except Exception as e:
            # Fallback: show error message
            story.append(Paragraph(
                f"<i>QR Code generation failed: {str(e)}</i>", 
                small_style
            ))
    
    # Modern Footer
    story.append(Spacer(1, 40))
    
    # Footer line
    footer_line = Table([['']], colWidths=[6*inch])
    footer_line.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 1, primary_color),
    ]))
    story.append(footer_line)
    story.append(Spacer(1, 15))
    
    # Footer content
    footer_data = [
        [Paragraph("Generated by <b>BarangayLink</b>", small_style)],
        [Paragraph(f"Document generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", small_style)],
        [Paragraph("This is an official document issued by the Barangay Office", small_style)]
    ]
    
    for footer_item in footer_data:
        story.append(footer_item)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer

@documents_bp.route('/types', methods=['GET'])
def get_document_types():
    """Get all available document types"""
    try:
        document_types = DocumentType.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'data': [doc_type.to_dict() for doc_type in document_types]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/<int:type_id>', methods=['GET'])
def get_document_type(type_id):
    """Get specific document type details"""
    try:
        doc_type = DocumentType.query.get_or_404(type_id)
        return jsonify({
            'success': True,
            'data': doc_type.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types', methods=['POST'])
@jwt_required()
def create_document_type():
    """Create new document type (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'success': False, 'message': 'Document type name is required'}), 400
        
        # Create new document type
        doc_type = DocumentType(
            name=data['name'],
            description=data.get('description', ''),
            requirements=json.dumps(data.get('requirements', [])),
            processing_days=data.get('processing_days', 3),
            fee=data.get('fee', 0.0),
            validity_days=data.get('validity_days', 30),
            auto_delete_expired=data.get('auto_delete_expired', True)
        )
        
        db.session.add(doc_type)
        db.session.commit()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='create_document_type',
            entity_type='document_type',
            entity_id=doc_type.id,
            description=f"Created document type: {doc_type.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document type created successfully',
            'data': doc_type.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/<int:type_id>', methods=['PUT'])
@jwt_required()
def update_document_type(type_id):
    """Update document type (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_type = DocumentType.query.get_or_404(type_id)
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            doc_type.name = data['name']
        if 'description' in data:
            doc_type.description = data['description']
        if 'requirements' in data:
            doc_type.requirements = json.dumps(data['requirements'])
        if 'processing_days' in data:
            doc_type.processing_days = data['processing_days']
        if 'fee' in data:
            doc_type.fee = data['fee']
        if 'is_active' in data:
            doc_type.is_active = data['is_active']
        
        doc_type.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='update_document_type',
            entity_type='document_type',
            entity_id=doc_type.id,
            description=f"Updated document type: {doc_type.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document type updated successfully',
            'data': doc_type.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/<int:type_id>', methods=['DELETE'])
@jwt_required()
def delete_document_type(type_id):
    """Delete document type (admin only) with improved validation and options"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_type = DocumentType.query.get_or_404(type_id)
        data = request.get_json() or {}
        
        # Get deletion options
        force_delete = data.get('force_delete', False)
        deletion_reason = data.get('deletion_reason', '')
        
        # Check if there are existing requests for this type
        existing_requests = DocumentRequest.query.filter_by(document_type_id=type_id).count()
        pending_requests = DocumentRequest.query.filter_by(
            document_type_id=type_id, 
            status='pending'
        ).count()
        approved_requests = DocumentRequest.query.filter_by(
            document_type_id=type_id, 
            status='approved'
        ).count()
        ready_requests = DocumentRequest.query.filter_by(
            document_type_id=type_id, 
            status='ready'
        ).count()
        
        # If there are existing requests and not forcing deletion
        if existing_requests > 0 and not force_delete:
            return jsonify({
                'success': False, 
                'message': f'Cannot delete document type. There are {existing_requests} existing requests.',
                'details': {
                    'total_requests': existing_requests,
                    'pending_requests': pending_requests,
                    'approved_requests': approved_requests,
                    'ready_requests': ready_requests
                },
                'options': {
                    'force_delete': True,
                    'soft_delete': True
                }
            }), 400
        
        # If forcing deletion, clean up associated files and mark requests as cancelled
        if force_delete and existing_requests > 0:
            # Clean up associated document files
            document_requests = DocumentRequest.query.filter_by(document_type_id=type_id).all()
            deleted_files = []
            
            for req in document_requests:
                # Delete PDF file if it exists
                if req.document_url:
                    try:
                        file_path = os.path.join(current_app.root_path, 'uploads', req.document_url.lstrip('/'))
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            deleted_files.append(req.document_url)
                    except Exception as e:
                        print(f"Failed to delete file {req.document_url}: {str(e)}")
                
                # Mark request as cancelled
                req.status = 'cancelled'
                req.rejection_reason = f"Document type deleted: {deletion_reason}" if deletion_reason else "Document type was deleted by admin"
        
        # Perform deletion
        db.session.delete(doc_type)
        db.session.commit()
        
        # Log activity with more details
        user = User.query.get(int(get_jwt_identity()))
        activity_description = f"Deleted document type: {doc_type.name}"
        if deletion_reason:
            activity_description += f" (Reason: {deletion_reason})"
        if force_delete and existing_requests > 0:
            activity_description += f" (Force deleted with {existing_requests} existing requests)"
        
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='delete_document_type',
            entity_type='document_type',
            entity_id=type_id,
            description=activity_description
        )
        db.session.add(activity)
        db.session.commit()
        
        response_data = {
            'success': True,
            'message': 'Document type deleted successfully'
        }
        
        if force_delete and existing_requests > 0:
            response_data['details'] = {
                'cancelled_requests': existing_requests,
                'deleted_files': len(deleted_files)
            }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/<int:type_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_document_type(type_id):
    """Soft delete (deactivate) document type (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_type = DocumentType.query.get_or_404(type_id)
        data = request.get_json() or {}
        deactivation_reason = data.get('deactivation_reason', '')
        
        # Deactivate the document type
        doc_type.is_active = False
        doc_type.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity_description = f"Deactivated document type: {doc_type.name}"
        if deactivation_reason:
            activity_description += f" (Reason: {deactivation_reason})"
        
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='deactivate_document_type',
            entity_type='document_type',
            entity_id=type_id,
            description=activity_description
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document type deactivated successfully',
            'data': doc_type.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/<int:type_id>/reactivate', methods=['POST'])
@jwt_required()
def reactivate_document_type(type_id):
    """Reactivate document type (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_type = DocumentType.query.get_or_404(type_id)
        
        # Reactivate the document type
        doc_type.is_active = True
        doc_type.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='reactivate_document_type',
            entity_type='document_type',
            entity_id=type_id,
            description=f"Reactivated document type: {doc_type.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document type reactivated successfully',
            'data': doc_type.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/types/bulk-delete', methods=['POST'])
@jwt_required()
def bulk_delete_document_types():
    """Bulk delete multiple document types (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        data = request.get_json()
        type_ids = data.get('type_ids', [])
        force_delete = data.get('force_delete', False)
        deletion_reason = data.get('deletion_reason', '')
        
        if not type_ids:
            return jsonify({'success': False, 'message': 'No document types specified'}), 400
        
        results = []
        user = User.query.get(int(get_jwt_identity()))
        
        for type_id in type_ids:
            try:
                doc_type = DocumentType.query.get(type_id)
                if not doc_type:
                    results.append({
                        'type_id': type_id,
                        'success': False,
                        'message': 'Document type not found'
                    })
                    continue
                
                # Check for existing requests
                existing_requests = DocumentRequest.query.filter_by(document_type_id=type_id).count()
                
                if existing_requests > 0 and not force_delete:
                    results.append({
                        'type_id': type_id,
                        'success': False,
                        'message': f'Cannot delete. Has {existing_requests} existing requests',
                        'existing_requests': existing_requests
                    })
                    continue
                
                # Clean up files if force deleting
                if force_delete and existing_requests > 0:
                    document_requests = DocumentRequest.query.filter_by(document_type_id=type_id).all()
                    for req in document_requests:
                        if req.document_url:
                            try:
                                file_path = os.path.join(current_app.root_path, 'uploads', req.document_url.lstrip('/'))
                                if os.path.exists(file_path):
                                    os.remove(file_path)
                            except Exception as e:
                                print(f"Failed to delete file {req.document_url}: {str(e)}")
                        req.status = 'cancelled'
                        req.rejection_reason = f"Document type deleted: {deletion_reason}" if deletion_reason else "Document type was deleted by admin"
                
                # Delete the document type
                db.session.delete(doc_type)
                
                # Log activity
                activity_description = f"Bulk deleted document type: {doc_type.name}"
                if deletion_reason:
                    activity_description += f" (Reason: {deletion_reason})"
                if force_delete and existing_requests > 0:
                    activity_description += f" (Force deleted with {existing_requests} requests)"
                
                activity = ActivityLog(
                    barangay_id=user.barangay_id,
                    user_id=int(get_jwt_identity()),
                    action='bulk_delete_document_type',
                    entity_type='document_type',
                    entity_id=type_id,
                    description=activity_description
                )
                db.session.add(activity)
                
                results.append({
                    'type_id': type_id,
                    'success': True,
                    'message': 'Deleted successfully',
                    'name': doc_type.name
                })
                
            except Exception as e:
                results.append({
                    'type_id': type_id,
                    'success': False,
                    'message': str(e)
                })
        
        db.session.commit()
        
        successful_deletes = [r for r in results if r['success']]
        failed_deletes = [r for r in results if not r['success']]
        
        return jsonify({
            'success': True,
            'message': f'Bulk deletion completed. {len(successful_deletes)} successful, {len(failed_deletes)} failed.',
            'results': results,
            'summary': {
                'total': len(type_ids),
                'successful': len(successful_deletes),
                'failed': len(failed_deletes)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests', methods=['POST'])
@jwt_required()
def create_document_request():
    """Create new document request (resident only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'resident':
            return jsonify({'success': False, 'message': 'Resident access required'}), 403
        
        # Handle both JSON and form data
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle form data with file uploads
            document_type_id = request.form.get('document_type_id')
            purpose = request.form.get('purpose', '')
            quantity = int(request.form.get('quantity', 1))
            delivery_method = request.form.get('delivery_method', 'pickup')
            delivery_address = request.form.get('delivery_address', '')
            delivery_notes = request.form.get('delivery_notes', '')
            
            # Get uploaded files
            uploaded_files = request.files.getlist('requirement_files')
        else:
            # Handle JSON data (backward compatibility)
            data = request.get_json()
            document_type_id = data.get('document_type_id')
            purpose = data.get('purpose', '')
            quantity = data.get('quantity', 1)
            delivery_method = data.get('delivery_method', 'pickup')
            delivery_address = data.get('delivery_address', '')
            delivery_notes = data.get('delivery_notes', '')
            uploaded_files = []
        
        # Validate required fields
        if not document_type_id:
            return jsonify({'success': False, 'message': 'Document type is required'}), 400
        
        # Get user and barangay info
        user = User.query.get(int(get_jwt_identity()))
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Since DocumentRequest.barangay_id references barangays.id but User.barangay_id references locations.id,
        # we need to use the first barangay record (there's only one)
        barangay = Barangay.query.first()
        if not barangay:
            return jsonify({'success': False, 'message': 'No barangay found'}), 404
        
        # Create document request
        doc_request = DocumentRequest(
            barangay_id=barangay.id,
            requester_id=user.id,
            document_type_id=int(document_type_id),
            purpose=purpose,
            quantity=quantity,
            delivery_method=delivery_method,
            delivery_address=delivery_address,
            delivery_notes=delivery_notes
        )
        
        db.session.add(doc_request)
        db.session.flush()  # Get the ID before committing
        
        # Handle file uploads if any
        uploaded_file_ids = []
        if uploaded_files:
            from utils.file_handler import save_organized_file
            
            for file in uploaded_files:
                if file and file.filename:
                    try:
                        # Save file with organized structure and database tracking
                        uploaded_file = save_organized_file(
                            file=file,
                            user_id=user.id,
                            file_type='requirement',
                            entity_type='document_request',
                            entity_id=doc_request.id,
                            purpose='document_requirement',
                            description=f"Requirement file for {doc_request.document_type.name}"
                        )
                        uploaded_file_ids.append(uploaded_file.id)
                        
                        # Add file to document request
                        doc_request.add_requirement_file(uploaded_file.id)
                        
                    except Exception as e:
                        db.session.rollback()
                        return jsonify({'success': False, 'message': f'Failed to save file {file.filename}: {str(e)}'}), 500
        
        db.session.commit()
        
        # Log activity
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=user.id,
            action='create_document_request',
            entity_type='document_request',
            entity_id=doc_request.id,
            description=f"Requested document: {doc_request.document_type.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        response_data = doc_request.to_dict()
        response_data['uploaded_file_ids'] = uploaded_file_ids
        
        return jsonify({
            'success': True,
            'message': 'Document request created successfully',
            'data': response_data
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>/files', methods=['GET'])
@jwt_required()
def get_document_request_files(request_id):
    """Get all files for a document request"""
    try:
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get document request
        doc_request = DocumentRequest.query.get(request_id)
        if not doc_request:
            return jsonify({'success': False, 'message': 'Document request not found'}), 404
        
        # Check access permissions
        if user.role == 'resident' and doc_request.requester_id != user.id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        elif user.role == 'admin' and doc_request.barangay_id != user.barangay_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Get requirement files
        files = doc_request.get_requirement_files()
        
        return jsonify({
            'success': True,
            'data': files
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>/files/<int:file_id>', methods=['DELETE'])
@jwt_required()
def delete_document_request_file(request_id, file_id):
    """Delete a specific file from document request"""
    try:
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get document request
        doc_request = DocumentRequest.query.get(request_id)
        if not doc_request:
            return jsonify({'success': False, 'message': 'Document request not found'}), 404
        
        # Check access permissions
        if user.role == 'resident' and doc_request.requester_id != user.id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        elif user.role == 'admin' and doc_request.barangay_id != user.barangay_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Check if file belongs to this request
        from models.uploaded_file import UploadedFile
        uploaded_file = UploadedFile.query.filter(
            UploadedFile.id == file_id,
            UploadedFile.entity_type == 'document_request',
            UploadedFile.entity_id == request_id,
            UploadedFile.is_active == True
        ).first()
        
        if not uploaded_file:
            return jsonify({'success': False, 'message': 'File not found or access denied'}), 404
        
        # Remove file from document request
        doc_request.remove_requirement_file(file_id)
        
        # Delete the file
        from utils.file_handler import delete_file_by_id
        success, message = delete_file_by_id(file_id, user_id)
        
        if not success:
            return jsonify({'success': False, 'message': message}), 500
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'File deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/files/<int:file_id>/download', methods=['GET'])
@jwt_required()
def download_file(file_id):
    """Download a specific file"""
    try:
        from flask import send_from_directory
        from models.uploaded_file import UploadedFile
        
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get uploaded file
        uploaded_file = UploadedFile.query.filter(
            UploadedFile.id == file_id,
            UploadedFile.is_active == True
        ).first()
        
        if not uploaded_file:
            return jsonify({'success': False, 'message': 'File not found'}), 404
        
        # Check access permissions
        if user.role == 'resident' and uploaded_file.user_id != user.id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        elif user.role == 'admin' and uploaded_file.user.barangay_id != user.barangay_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        # Get file path
        file_path = os.path.join(current_app.root_path, 'uploads', uploaded_file.file_path)
        
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': 'File not found on disk'}), 404
        
        # Send file
        return send_from_directory(
            os.path.dirname(file_path),
            os.path.basename(file_path),
            as_attachment=True,
            download_name=uploaded_file.original_filename
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/files/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file_info(file_id):
    """Get information about a specific file"""
    try:
        from models.uploaded_file import UploadedFile
        
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get uploaded file
        uploaded_file = UploadedFile.query.filter(
            UploadedFile.id == file_id,
            UploadedFile.is_active == True
        ).first()
        
        if not uploaded_file:
            return jsonify({'success': False, 'message': 'File not found'}), 404
        
        # Check access permissions
        if user.role == 'resident' and uploaded_file.user_id != user.id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        elif user.role == 'admin' and uploaded_file.user.barangay_id != user.barangay_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'data': uploaded_file.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests', methods=['GET'])
@jwt_required()
def get_my_document_requests():
    """Get user's document requests"""
    try:
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        
        # Get requests based on user role
        if claims.get('role') == 'admin':
            # Admin sees all requests in their barangay
            user = User.query.get(user_id)
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Since DocumentRequest.barangay_id references barangays.id but User.barangay_id references locations.id,
            # we need to find the corresponding barangay record
            # For now, let's get all document requests since there's only one barangay
            requests = DocumentRequest.query.all()
        else:
            # Resident sees only their requests
            requests = DocumentRequest.query.filter_by(requester_id=user_id).all()
        
        return jsonify({
            'success': True,
            'data': [req.to_dict() for req in requests]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>', methods=['GET'])
@jwt_required()
def get_document_request(request_id):
    """Get specific document request details"""
    try:
        claims = get_jwt()
        user_id = int(get_jwt_identity())
        
        doc_request = DocumentRequest.query.get_or_404(request_id)
        
        # Check access permissions
        if claims.get('role') == 'resident' and doc_request.requester_id != user_id:
            return jsonify({'success': False, 'message': 'Access denied'}), 403
        
        return jsonify({
            'success': True,
            'data': doc_request.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_document_request(request_id):
    """Approve document request and generate document (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_request = DocumentRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        # Update request status
        doc_request.status = 'approved'
        doc_request.processed_by = int(get_jwt_identity())
        doc_request.processed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        doc_request.processing_notes = data.get('processing_notes', '')
        
        # Generate QR code data
        qr_data = {
            'request_id': doc_request.id,
            'document_type': doc_request.document_type.name,
            'requester': doc_request.requester.get_full_name(),
            'barangay': doc_request.barangay.name,
            'issued_date': datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
            'verification_code': str(uuid.uuid4())
        }
        
        # Generate QR code
        qr_code = generate_qr_code(json.dumps(qr_data))
        
        # Update request with QR code and mark as ready
        doc_request.status = 'ready'
        doc_request.qr_code = qr_code
        doc_request.qr_code_data = json.dumps(qr_data)
        
        # Set expiration date based on document type validity period
        if doc_request.document_type.validity_days:
            from datetime import timedelta
            doc_request.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=doc_request.document_type.validity_days)
        
        # Generate PDF document
        pdf_buffer = generate_document_pdf(doc_request)
        
        # Save PDF to uploads directory
        uploads_dir = os.path.join(current_app.root_path, 'uploads', 'documents')
        os.makedirs(uploads_dir, exist_ok=True)
        
        filename = f"document_{doc_request.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(uploads_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        doc_request.document_url = f"/uploads/documents/{filename}"
        
        db.session.commit()
        
        # Send email if delivery method is email
        email_sent = False
        if doc_request.delivery_method == 'email':
            try:
                email_sent = email_service.send_document_email(
                    user_email=doc_request.requester.email,
                    user_name=doc_request.requester.get_full_name(),
                    document_request=doc_request,
                    document_path=filepath
                )
                if email_sent:
                    print(f"Document email sent successfully to {doc_request.requester.email}")
                else:
                    print(f"Failed to send document email to {doc_request.requester.email}")
            except Exception as email_error:
                print(f"Error sending document email: {str(email_error)}")
                # Don't fail the entire request if email fails
        
        # Log activity
        activity_details = f"Approved and completed document request: {doc_request.document_type.name}"
        if doc_request.delivery_method == 'email':
            activity_details += f" (Email {'sent' if email_sent else 'failed'})"
        
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='approve_document_request',
            entity_type='document_request',
            entity_id=doc_request.id,
            description=activity_details
        )
        db.session.add(activity)
        db.session.commit()
        
        response_message = 'Document request approved and completed successfully'
        if doc_request.delivery_method == 'email':
            response_message += f" and {'email sent' if email_sent else 'email delivery failed'}"
        
        return jsonify({
            'success': True,
            'message': response_message,
            'data': doc_request.to_dict(),
            'email_sent': email_sent if doc_request.delivery_method == 'email' else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_document_request(request_id):
    """Reject document request (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_request = DocumentRequest.query.get_or_404(request_id)
        data = request.get_json()
        
        if not data.get('rejection_reason'):
            return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400
        
        # Update request status
        doc_request.status = 'rejected'
        doc_request.rejection_reason = data['rejection_reason']
        doc_request.processed_by = int(get_jwt_identity())
        doc_request.processed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        db.session.commit()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='reject_document_request',
            entity_type='document_request',
            entity_id=doc_request.id,
            description=f"Rejected document request: {doc_request.document_type.name}"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Document request rejected successfully',
            'data': doc_request.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/requests/<int:request_id>/complete', methods=['POST'])
@jwt_required()
def complete_document_request(request_id):
    """Complete document request and generate QR code (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        doc_request = DocumentRequest.query.get_or_404(request_id)
        
        if doc_request.status != 'approved':
            return jsonify({'success': False, 'message': 'Request must be approved first'}), 400
        
        # Generate QR code data
        qr_data = {
            'request_id': doc_request.id,
            'document_type': doc_request.document_type.name,
            'requester': doc_request.requester.get_full_name(),
            'barangay': doc_request.barangay.name,
            'issued_date': datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
            'verification_code': str(uuid.uuid4())
        }
        
        # Generate QR code
        qr_code = generate_qr_code(json.dumps(qr_data))
        
        # Update request with QR code and mark as ready
        doc_request.status = 'ready'
        doc_request.qr_code = qr_code
        doc_request.qr_code_data = json.dumps(qr_data)
        doc_request.processed_by = int(get_jwt_identity())
        doc_request.processed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Set expiration date based on document type validity period
        if doc_request.document_type.validity_days:
            from datetime import timedelta
            doc_request.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=doc_request.document_type.validity_days)
        
        # Generate PDF document
        pdf_buffer = generate_document_pdf(doc_request)
        
        # Save PDF to uploads directory
        uploads_dir = os.path.join(current_app.root_path, 'uploads', 'documents')
        os.makedirs(uploads_dir, exist_ok=True)
        
        filename = f"document_{doc_request.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(uploads_dir, filename)
        
        with open(filepath, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        doc_request.document_url = f"/uploads/documents/{filename}"
        
        db.session.commit()
        
        # Send email if delivery method is email
        email_sent = False
        if doc_request.delivery_method == 'email':
            try:
                email_sent = email_service.send_document_email(
                    user_email=doc_request.requester.email,
                    user_name=doc_request.requester.get_full_name(),
                    document_request=doc_request,
                    document_path=filepath
                )
                if email_sent:
                    print(f"Document email sent successfully to {doc_request.requester.email}")
                else:
                    print(f"Failed to send document email to {doc_request.requester.email}")
            except Exception as email_error:
                print(f"Error sending document email: {str(email_error)}")
                # Don't fail the entire request if email fails
        
        # Log activity
        activity_details = f"Completed document request: {doc_request.document_type.name}"
        if doc_request.delivery_method == 'email':
            activity_details += f" (Email {'sent' if email_sent else 'failed'})"
        
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='complete_document_request',
            entity_type='document_request',
            entity_id=doc_request.id,
            description=activity_details
        )
        db.session.add(activity)
        db.session.commit()
        
        response_message = 'Document request completed successfully'
        if doc_request.delivery_method == 'email':
            response_message += f" and {'email sent' if email_sent else 'email delivery failed'}"
        
        return jsonify({
            'success': True,
            'message': response_message,
            'data': doc_request.to_dict(),
            'email_sent': email_sent if doc_request.delivery_method == 'email' else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/verify/<string:verification_code>', methods=['GET'])
def verify_document(verification_code):
    """Verify document using QR code data"""
    try:
        # Find document request by verification code
        doc_requests = DocumentRequest.query.filter(
            DocumentRequest.qr_code_data.contains(verification_code)
        ).all()
        
        if not doc_requests:
            return jsonify({
                'success': False,
                'message': 'Document not found or invalid verification code'
            }), 404
        
        doc_request = doc_requests[0]
        
        # Check if document is expired
        if doc_request.is_document_expired():
            return jsonify({
                'success': False,
                'message': 'Document has expired and is no longer valid',
                'data': {
                    'request_id': doc_request.id,
                    'document_type': doc_request.document_type.name,
                    'expires_at': doc_request.expires_at.isoformat() if doc_request.expires_at else None,
                    'is_expired': True
                }
            }), 410  # Gone status code for expired resources
        
        # Parse QR code data
        qr_data = json.loads(doc_request.qr_code_data)
        
        return jsonify({
            'success': True,
            'message': 'Document verified successfully',
            'data': {
                'request_id': doc_request.id,
                'document_type': doc_request.document_type.name,
                'requester': doc_request.requester.get_full_name(),
                'barangay': doc_request.barangay.name,
                'issued_date': qr_data.get('issued_date'),
                'expires_at': doc_request.expires_at.isoformat() if doc_request.expires_at else None,
                'days_until_expiry': doc_request.get_days_until_expiry(),
                'status': doc_request.status,
                'verification_code': verification_code
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/cleanup/expired', methods=['POST'])
@jwt_required()
def cleanup_expired_documents_endpoint():
    """Clean up expired documents (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Run cleanup
        result = cleanup_expired_documents()
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='cleanup_expired_documents',
            entity_type='system',
            entity_id=0,
            description=f"Cleaned up {result['deleted_count']} expired documents"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully cleaned up {result["deleted_count"]} expired documents',
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/cleanup/expired/<int:document_type_id>', methods=['POST'])
@jwt_required()
def cleanup_expired_documents_by_type_endpoint(document_type_id):
    """Clean up expired documents for a specific document type (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Check if document type exists
        doc_type = DocumentType.query.get(document_type_id)
        if not doc_type:
            return jsonify({'success': False, 'message': 'Document type not found'}), 404
        
        # Run cleanup
        result = cleanup_expired_documents_by_type(document_type_id)
        
        # Log activity
        user = User.query.get(int(get_jwt_identity()))
        activity = ActivityLog(
            barangay_id=user.barangay_id,
            user_id=int(get_jwt_identity()),
            action='cleanup_expired_documents_by_type',
            entity_type='document_type',
            entity_id=document_type_id,
            description=f"Cleaned up {result['deleted_count']} expired {doc_type.name} documents"
        )
        db.session.add(activity)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully cleaned up {result["deleted_count"]} expired {doc_type.name} documents',
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@documents_bp.route('/expired', methods=['GET'])
@jwt_required()
def get_expired_documents():
    """Get list of expired documents (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        
        # Get expired documents
        expired_docs = DocumentRequest.query.filter(
            DocumentRequest.expires_at < datetime.now(timezone.utc).replace(tzinfo=None),
            DocumentRequest.is_expired == False,
            DocumentRequest.status == 'ready'
        ).all()
        
        return jsonify({
            'success': True,
            'data': [doc.to_dict() for doc in expired_docs],
            'count': len(expired_docs)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
