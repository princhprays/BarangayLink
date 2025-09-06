from database import db
from datetime import datetime, timezone

class DocumentRequest(db.Model):
    __tablename__ = 'document_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    document_type_id = db.Column(db.Integer, db.ForeignKey('document_types.id'), nullable=False)
    
    # Request Details
    purpose = db.Column(db.Text, nullable=True)
    quantity = db.Column(db.Integer, default=1)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected', 'processing', 'ready', 'completed'
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Processing
    processing_notes = db.Column(db.Text, nullable=True)
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    processed_at = db.Column(db.DateTime, nullable=True)
    
    # Document Generation
    document_url = db.Column(db.String(255), nullable=True)
    qr_code = db.Column(db.String(255), nullable=True)  # QR code for verification
    qr_code_data = db.Column(db.Text, nullable=True)  # Data encoded in QR code
    
    # Requirement Files
    requirement_files = db.Column(db.Text, nullable=True)  # JSON array of uploaded file IDs
    
    # Document Expiration
    expires_at = db.Column(db.DateTime, nullable=True)  # Document expiration date
    is_expired = db.Column(db.Boolean, default=False)  # Manual expiration flag
    
    # Delivery
    delivery_method = db.Column(db.String(20), default='pickup')  # 'pickup', 'email', 'mail'
    delivery_address = db.Column(db.Text, nullable=True)
    delivery_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], overlaps="document_requests")
    processor = db.relationship('User', foreign_keys=[processed_by], backref='processed_documents')
    document_type = db.relationship('DocumentType', foreign_keys=[document_type_id], overlaps="document_requests")
    # Note: barangay relationship is defined in Barangay model with backref
    
    def __repr__(self):
        return f'<DocumentRequest {self.id} for {self.document_type.name}>'
    
    def is_document_expired(self):
        """Check if document is expired"""
        if self.is_expired:
            return True
        if self.expires_at and self.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
            return True
        return False
    
    def get_days_until_expiry(self):
        """Get number of days until document expires"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.now(timezone.utc).replace(tzinfo=None)
        return delta.days if delta.days > 0 else 0
    
    def get_requirement_files(self):
        """Get requirement files for this document request"""
        import json
        from models.uploaded_file import UploadedFile
        
        if not self.requirement_files:
            return []
        
        try:
            file_ids = json.loads(self.requirement_files)
            if not file_ids:
                return []
            files = UploadedFile.query.filter(
                UploadedFile.id.in_(file_ids),
                UploadedFile.is_active == True
            ).all()
            return [file.to_dict() for file in files]
        except Exception as e:
            print(f"Failed to get requirement files for request {self.id}: {str(e)}")
            return []
    
    def add_requirement_file(self, file_id):
        """Add a requirement file to this document request"""
        import json
        
        try:
            if not self.requirement_files:
                file_ids = []
            else:
                file_ids = json.loads(self.requirement_files)
            
            if file_id not in file_ids:
                file_ids.append(file_id)
                self.requirement_files = json.dumps(file_ids)
                return True
            return False
        except Exception as e:
            print(f"Failed to add requirement file {file_id} to request {self.id}: {str(e)}")
            return False
    
    def remove_requirement_file(self, file_id):
        """Remove a requirement file from this document request"""
        import json
        
        try:
            if not self.requirement_files:
                return False
            
            file_ids = json.loads(self.requirement_files)
            if file_id in file_ids:
                file_ids.remove(file_id)
                self.requirement_files = json.dumps(file_ids) if file_ids else None
                return True
            return False
        except Exception as e:
            print(f"Failed to remove requirement file {file_id} from request {self.id}: {str(e)}")
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'requester_id': self.requester_id,
            'document_type_id': self.document_type_id,
            'purpose': self.purpose,
            'quantity': self.quantity,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'processing_notes': self.processing_notes,
            'processed_by': self.processed_by,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'document_url': self.document_url,
            'qr_code': self.qr_code,
            'qr_code_data': self.qr_code_data,
            'requirement_files': self.get_requirement_files(),
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_expired': self.is_expired,
            'delivery_method': self.delivery_method,
            'delivery_address': self.delivery_address,
            'delivery_notes': self.delivery_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'document_type_name': self.document_type.name if self.document_type else None
        }
