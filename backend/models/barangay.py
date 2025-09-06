from database import db
from datetime import datetime, timezone

class Barangay(db.Model):
    __tablename__ = 'barangays'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    barangay_captain = db.Column(db.String(100), nullable=True)
    contact_number = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # Note: User relationships now use Location table instead of Barangay
    resident_profiles = db.relationship('ResidentProfile', backref='barangay', lazy=True, foreign_keys='ResidentProfile.barangay_id')
    items = db.relationship('Item', backref='barangay', lazy=True, foreign_keys='Item.barangay_id')
    item_requests = db.relationship('ItemRequest', backref='barangay', lazy=True, foreign_keys='ItemRequest.barangay_id')
    transactions = db.relationship('Transaction', backref='barangay', lazy=True, foreign_keys='Transaction.barangay_id')
    document_requests = db.relationship('DocumentRequest', backref='barangay', lazy=True, foreign_keys='DocumentRequest.barangay_id')
    announcements = db.relationship('Announcement', back_populates='barangay', lazy=True, foreign_keys='Announcement.barangay_id')
    benefits = db.relationship('Benefit', back_populates='barangay', lazy=True, foreign_keys='Benefit.barangay_id')
    benefit_applications = db.relationship('BenefitApplication', back_populates='barangay', lazy=True, foreign_keys='BenefitApplication.barangay_id')
    sos_requests = db.relationship('SOSRequest', backref='barangay', lazy=True, foreign_keys='SOSRequest.barangay_id')
    community_alerts = db.relationship('CommunityAlert', backref='barangay', lazy=True, foreign_keys='CommunityAlert.barangay_id')
    relocation_requests_from = db.relationship('RelocationRequest', foreign_keys='RelocationRequest.from_barangay_id', backref='from_barangay', lazy=True)
    relocation_requests_to = db.relationship('RelocationRequest', foreign_keys='RelocationRequest.to_barangay_id', backref='to_barangay', lazy=True)
    activity_logs = db.relationship('ActivityLog', backref='barangay', lazy=True, foreign_keys='ActivityLog.barangay_id')
    
    def __repr__(self):
        return f'<Barangay {self.name}, {self.city}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'city': self.city,
            'province': self.province,
            'region': self.region,
            'zip_code': self.zip_code,
            'barangay_captain': self.barangay_captain,
            'contact_number': self.contact_number,
            'email': self.email,
            'address': self.address,
            'logo_url': self.logo_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
