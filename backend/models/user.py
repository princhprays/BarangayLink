from database import db
from datetime import datetime, timedelta, timezone
import bcrypt
import uuid

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    contact_number = db.Column(db.String(20), nullable=True)  # Alias for phone_number (frontend compatibility)
    role = db.Column(db.String(20), nullable=False, default='resident')  # 'resident' or 'admin'
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'approved', 'rejected'
    rejection_reason = db.Column(db.Text, nullable=True)
    email_verified = db.Column(db.Boolean, default=False)
    email_verification_token = db.Column(db.String(255), nullable=True)
    email_verification_expires = db.Column(db.DateTime, nullable=True)
    
    # Location fields (using PSGC integration)
    province_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    municipality_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=True)
    complete_address = db.Column(db.Text, nullable=True)
    
    # File upload fields (temporary until approval)
    valid_id_path = db.Column(db.String(255), nullable=True)
    selfie_with_id_path = db.Column(db.String(255), nullable=True)
    profile_picture_url = db.Column(db.String(255), nullable=True)
    
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    province = db.relationship('Location', foreign_keys=[province_id], backref='province_users')
    municipality = db.relationship('Location', foreign_keys=[municipality_id], backref='municipality_users')
    barangay = db.relationship('Location', foreign_keys=[barangay_id], backref='barangay_users')
    
    resident_profile = db.relationship('ResidentProfile', backref='user', uselist=False, lazy=True, foreign_keys='ResidentProfile.user_id')
    items = db.relationship('Item', backref='owner', lazy=True, foreign_keys='Item.owner_id')
    item_requests = db.relationship('ItemRequest', backref='item_requester', lazy=True, foreign_keys='ItemRequest.requester_id')
    transactions_as_owner = db.relationship('Transaction', foreign_keys='Transaction.item_owner_id', backref='item_owner', lazy=True)
    transactions_as_requester = db.relationship('Transaction', foreign_keys='Transaction.requester_id', backref='transaction_requester', lazy=True)
    document_requests = db.relationship('DocumentRequest', lazy=True, foreign_keys='DocumentRequest.requester_id')
    sos_requests = db.relationship('SOSRequest', backref='sos_requester', lazy=True, foreign_keys='SOSRequest.requester_id')
    relocation_requests = db.relationship('RelocationRequest', backref='relocation_requester', lazy=True, foreign_keys='RelocationRequest.requester_id')
    announcements = db.relationship('Announcement', back_populates='author', lazy=True, foreign_keys='Announcement.author_id')
    uploaded_files = db.relationship('UploadedFile', lazy=True, foreign_keys='UploadedFile.user_id')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def set_phone_number(self, phone_number):
        """Set phone number and sync with contact_number for frontend compatibility"""
        self.phone_number = phone_number
        self.contact_number = phone_number  # Keep both fields in sync
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def generate_email_verification_token(self):
        """Generate email verification token"""
        self.email_verification_token = str(uuid.uuid4())
        self.email_verification_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=24)
        return self.email_verification_token
    
    def verify_email_token(self, token):
        """Verify email verification token"""
        if (self.email_verification_token == token and 
            self.email_verification_expires and 
            self.email_verification_expires > datetime.now(timezone.utc).replace(tzinfo=None)):
            self.email_verified = True
            self.email_verification_token = None
            self.email_verification_expires = None
            return True
        return False
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'middle_name': self.middle_name,
            'phone_number': self.phone_number,
            'contact_number': self.contact_number,
            'role': self.role,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'email_verified': self.email_verified,
            'province_id': self.province_id,
            'municipality_id': self.municipality_id,
            'barangay_id': self.barangay_id,
            'complete_address': self.complete_address,
            'valid_id_path': self.valid_id_path,
            'selfie_with_id_path': self.selfie_with_id_path,
            'profile_picture_url': self.profile_picture_url,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_full_name(self):
        """Get user's full name"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"
    
    def get_location_string(self):
        """Get formatted location string"""
        location_parts = []
        if self.barangay:
            location_parts.append(self.barangay.name)
        if self.municipality:
            location_parts.append(self.municipality.name)
        if self.province:
            location_parts.append(self.province.name)
        return ', '.join(location_parts)
