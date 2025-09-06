from database import db
from datetime import datetime, timezone

class CommunityAlert(db.Model):
    __tablename__ = 'community_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Alert Details
    alert_type = db.Column(db.String(50), nullable=False)  # 'weather', 'disaster', 'security', 'health', 'infrastructure', 'other'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'critical'
    
    # Location
    affected_areas = db.Column(db.Text, nullable=True)  # JSON array of affected areas
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_public = db.Column(db.Boolean, default=True)  # Visible to public
    
    # Instructions
    instructions = db.Column(db.Text, nullable=True)
    contact_info = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    creator = db.relationship('User', backref='created_alerts')
    
    def __repr__(self):
        return f'<CommunityAlert {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'created_by': self.created_by,
            'alert_type': self.alert_type,
            'title': self.title,
            'message': self.message,
            'severity': self.severity,
            'affected_areas': self.affected_areas,
            'is_active': self.is_active,
            'is_public': self.is_public,
            'instructions': self.instructions,
            'contact_info': self.contact_info,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'creator_name': self.creator.get_full_name() if self.creator else None
        }
