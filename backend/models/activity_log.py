from database import db
from datetime import datetime, timezone

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Null for system actions
    
    # Activity Details
    action = db.Column(db.String(100), nullable=False)  # 'login', 'logout', 'create_item', 'approve_user', etc.
    entity_type = db.Column(db.String(50), nullable=True)  # 'user', 'item', 'request', 'document', etc.
    entity_id = db.Column(db.Integer, nullable=True)  # ID of the affected entity
    
    # Details
    description = db.Column(db.Text, nullable=False)
    old_values = db.Column(db.Text, nullable=True)  # JSON of old values
    new_values = db.Column(db.Text, nullable=True)  # JSON of new values
    
    # Metadata
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    
    # Timestamp
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    user = db.relationship('User', backref='activity_logs')
    
    def __repr__(self):
        return f'<ActivityLog {self.action} by {self.user_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'old_values': self.old_values,
            'new_values': self.new_values,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_name': self.user.get_full_name() if self.user else 'System'
        }
