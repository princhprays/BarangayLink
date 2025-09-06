from database import db
from datetime import datetime, timezone

class BenefitApplication(db.Model):
    __tablename__ = 'benefit_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    benefit_id = db.Column(db.Integer, db.ForeignKey('benefits.id'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, approved, rejected, completed
    application_data = db.Column(db.Text, nullable=True)  # JSON string with form data
    documents = db.Column(db.Text, nullable=True)  # JSON string with document URLs
    notes = db.Column(db.Text, nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    barangay = db.relationship('Barangay', back_populates='benefit_applications')
    benefit = db.relationship('Benefit', back_populates='applications')
    applicant = db.relationship('User', foreign_keys=[applicant_id], backref='benefit_applications')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_benefit_applications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'benefit_id': self.benefit_id,
            'applicant_id': self.applicant_id,
            'status': self.status,
            'application_data': self.application_data,
            'documents': self.documents,
            'notes': self.notes,
            'rejection_reason': self.rejection_reason,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'applicant_name': self.applicant.get_full_name() if self.applicant else None,
            'benefit_title': self.benefit.title if self.benefit else None,
            'approver_name': self.approver.get_full_name() if self.approver else None
        }
