from database import db
from datetime import datetime, timezone

class Announcement(db.Model):
    __tablename__ = 'announcements'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)  # community, health, utility, education, business, sports, etc.
    priority = db.Column(db.String(20), default='medium', nullable=False)  # low, medium, high
    location = db.Column(db.String(200), nullable=True)
    event_date = db.Column(db.DateTime, nullable=True)
    event_time = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_pinned = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    barangay = db.relationship('Barangay', back_populates='announcements')
    author = db.relationship('User', back_populates='announcements')
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'author_id': self.author_id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'priority': self.priority,
            'location': self.location,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'event_time': self.event_time,
            'is_active': self.is_active,
            'is_pinned': self.is_pinned,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'author_name': self.author.get_full_name() if self.author else None
        }