from database import db
from datetime import datetime, timezone

class DocumentType(db.Model):
    __tablename__ = 'document_types'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    requirements = db.Column(db.Text, nullable=True)  # JSON array of requirements
    processing_days = db.Column(db.Integer, default=3)  # Processing time in days
    fee = db.Column(db.Float, default=0.0)  # Fee in PHP
    validity_days = db.Column(db.Integer, default=30)  # Document validity period in days
    auto_delete_expired = db.Column(db.Boolean, default=True)  # Auto-delete expired documents
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document_requests = db.relationship('DocumentRequest', lazy=True)
    
    def __repr__(self):
        return f'<DocumentType {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'requirements': self.requirements,
            'processing_days': self.processing_days,
            'fee': self.fee,
            'validity_days': self.validity_days,
            'auto_delete_expired': self.auto_delete_expired,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
