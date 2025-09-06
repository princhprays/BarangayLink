from database import db
from datetime import datetime, timezone

class Benefit(db.Model):
    __tablename__ = 'benefits'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)  # health, education, financial, social, etc.
    eligibility_criteria = db.Column(db.Text, nullable=False)
    required_documents = db.Column(db.Text, nullable=True)
    application_process = db.Column(db.Text, nullable=True)
    contact_person = db.Column(db.String(200), nullable=True)
    contact_number = db.Column(db.String(20), nullable=True)
    contact_email = db.Column(db.String(100), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    barangay = db.relationship('Barangay', back_populates='benefits')
    applications = db.relationship('BenefitApplication', back_populates='benefit', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'eligibility_criteria': self.eligibility_criteria,
            'required_documents': self.required_documents,
            'application_process': self.application_process,
            'contact_person': self.contact_person,
            'contact_number': self.contact_number,
            'contact_email': self.contact_email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
