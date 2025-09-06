from database import db
from datetime import datetime, timezone

class SOSRequest(db.Model):
    __tablename__ = 'sos_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # SOS Details
    emergency_type = db.Column(db.String(50), nullable=False)  # 'medical', 'fire', 'security', 'natural_disaster', 'other'
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='active')  # 'active', 'responded', 'resolved', 'cancelled'
    
    # Response
    responder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    response_notes = db.Column(db.Text, nullable=True)
    response_time = db.Column(db.DateTime, nullable=True)
    resolution_notes = db.Column(db.Text, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Contact Information
    contact_phone = db.Column(db.String(20), nullable=True)
    emergency_contact = db.Column(db.String(100), nullable=True)
    emergency_contact_phone = db.Column(db.String(20), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], overlaps="sos_requester,sos_requests")
    responder = db.relationship('User', foreign_keys=[responder_id], backref='responded_sos')
    
    def __repr__(self):
        return f'<SOSRequest {self.id} - {self.emergency_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'requester_id': self.requester_id,
            'emergency_type': self.emergency_type,
            'description': self.description,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'responder_id': self.responder_id,
            'response_notes': self.response_notes,
            'response_time': self.response_time.isoformat() if self.response_time else None,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'contact_phone': self.contact_phone,
            'emergency_contact': self.emergency_contact,
            'emergency_contact_phone': self.emergency_contact_phone,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'responder_name': self.responder.get_full_name() if self.responder else None
        }
