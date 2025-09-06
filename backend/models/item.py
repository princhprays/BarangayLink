from database import db
from datetime import datetime, timezone

class Item(db.Model):
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Item Details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False)  # 'tools', 'electronics', 'furniture', 'books', 'sports', 'other'
    condition = db.Column(db.String(20), nullable=False)  # 'excellent', 'good', 'fair', 'poor'
    value_estimate = db.Column(db.Float, nullable=True)  # Estimated value in PHP
    
    # Availability
    is_available = db.Column(db.Boolean, default=True)
    max_loan_days = db.Column(db.Integer, default=7)  # Maximum loan period in days
    
    # Images
    image_urls = db.Column(db.Text, nullable=True)  # JSON array of image URLs
    
    # Status and Approval
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    rejection_reason = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_items')
    requests = db.relationship('ItemRequest', backref='item', lazy=True)
    transactions = db.relationship('Transaction', backref='item', lazy=True)
    
    def __repr__(self):
        return f'<Item {self.title}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'owner_id': self.owner_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'condition': self.condition,
            'value_estimate': self.value_estimate,
            'is_available': self.is_available,
            'max_loan_days': self.max_loan_days,
            'image_urls': self.image_urls,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'owner_name': self.owner.get_full_name() if self.owner else None
        }
