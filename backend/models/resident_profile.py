from database import db
from datetime import datetime, timezone

class ResidentProfile(db.Model):
    __tablename__ = 'resident_profiles'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    
    # Personal Information
    birth_date = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(10), nullable=True)  # 'male', 'female', 'other'
    civil_status = db.Column(db.String(20), nullable=True)  # 'single', 'married', 'widowed', 'divorced'
    nationality = db.Column(db.String(50), nullable=True)
    religion = db.Column(db.String(50), nullable=True)
    occupation = db.Column(db.String(100), nullable=True)
    employer = db.Column(db.String(100), nullable=True)
    monthly_income = db.Column(db.Float, nullable=True)
    educational_attainment = db.Column(db.String(50), nullable=True)
    
    # Contact Information
    contact_number = db.Column(db.String(20), nullable=True)  # Alias for phone_number
    
    # Address Information
    house_number = db.Column(db.String(20), nullable=True)
    street = db.Column(db.String(100), nullable=True)
    purok = db.Column(db.String(50), nullable=True)
    sitio = db.Column(db.String(50), nullable=True)
    
    # Family Information
    spouse_name = db.Column(db.String(100), nullable=True)
    father_name = db.Column(db.String(100), nullable=True)
    mother_name = db.Column(db.String(100), nullable=True)
    emergency_contact_name = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    emergency_contact_relationship = db.Column(db.String(50), nullable=True)
    
    # Additional Contact Fields (for frontend compatibility)
    emergency_contact = db.Column(db.String(100), nullable=True)  # Alias for emergency_contact_name
    emergency_contact_number = db.Column(db.String(20), nullable=True)  # Alias for emergency_contact_phone
    
    # Government IDs
    tin_number = db.Column(db.String(20), nullable=True)
    sss_number = db.Column(db.String(20), nullable=True)
    philhealth_number = db.Column(db.String(20), nullable=True)
    voter_id = db.Column(db.String(20), nullable=True)
    
    # Status Fields (for frontend compatibility)
    is_voter = db.Column(db.Boolean, default=False)
    is_indigent = db.Column(db.Boolean, default=False)
    is_pwd = db.Column(db.Boolean, default=False)
    is_senior_citizen = db.Column(db.Boolean, default=False)
    
    # Address Field (for frontend compatibility)
    address = db.Column(db.Text, nullable=True)  # Alias for complete_address
    
    # Document URLs
    id_photo_url = db.Column(db.String(255), nullable=True)
    proof_of_address_url = db.Column(db.String(255), nullable=True)
    other_documents_url = db.Column(db.Text, nullable=True)  # JSON array of URLs
    
    # Status and Verification
    is_verified = db.Column(db.Boolean, default=False)
    verification_notes = db.Column(db.Text, nullable=True)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_profiles', overlaps="resident_profile")
    
    def __repr__(self):
        return f'<ResidentProfile {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'barangay_id': self.barangay_id,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'gender': self.gender,
            'civil_status': self.civil_status,
            'nationality': self.nationality,
            'religion': self.religion,
            'occupation': self.occupation,
            'employer': self.employer,
            'monthly_income': self.monthly_income,
            'educational_attainment': self.educational_attainment,
            'contact_number': self.contact_number,
            'house_number': self.house_number,
            'street': self.street,
            'purok': self.purok,
            'sitio': self.sitio,
            'spouse_name': self.spouse_name,
            'father_name': self.father_name,
            'mother_name': self.mother_name,
            'emergency_contact_name': self.emergency_contact_name,
            'emergency_contact_phone': self.emergency_contact_phone,
            'emergency_contact_relationship': self.emergency_contact_relationship,
            'emergency_contact': self.emergency_contact,
            'emergency_contact_number': self.emergency_contact_number,
            'tin_number': self.tin_number,
            'sss_number': self.sss_number,
            'philhealth_number': self.philhealth_number,
            'voter_id': self.voter_id,
            'is_voter': self.is_voter,
            'is_indigent': self.is_indigent,
            'is_pwd': self.is_pwd,
            'is_senior_citizen': self.is_senior_citizen,
            'address': self.address,
            'id_photo_url': self.id_photo_url,
            'proof_of_address_url': self.proof_of_address_url,
            'other_documents_url': self.other_documents_url,
            'is_verified': self.is_verified,
            'verification_notes': self.verification_notes,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_full_address(self):
        """Get formatted full address"""
        address_parts = []
        if self.house_number:
            address_parts.append(self.house_number)
        if self.street:
            address_parts.append(self.street)
        if self.purok:
            address_parts.append(f"Purok {self.purok}")
        if self.sitio:
            address_parts.append(f"Sitio {self.sitio}")
        return ", ".join(address_parts)
