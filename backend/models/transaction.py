from database import db
from datetime import datetime, timezone

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    item_request_id = db.Column(db.Integer, db.ForeignKey('item_requests.id'), nullable=True)
    item_owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Transaction Details
    start_date = db.Column(db.Date, nullable=False)
    expected_return_date = db.Column(db.Date, nullable=False)
    actual_return_date = db.Column(db.Date, nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='active')  # 'active', 'returned', 'overdue', 'disputed'
    
    # Handover Information
    handover_notes = db.Column(db.Text, nullable=True)
    handover_photos = db.Column(db.Text, nullable=True)  # JSON array of photo URLs
    handover_witness = db.Column(db.String(100), nullable=True)
    handover_date = db.Column(db.DateTime, nullable=True)
    
    # Return Information
    return_notes = db.Column(db.Text, nullable=True)
    return_photos = db.Column(db.Text, nullable=True)  # JSON array of photo URLs
    return_condition = db.Column(db.String(20), nullable=True)  # 'excellent', 'good', 'fair', 'poor', 'damaged'
    return_witness = db.Column(db.String(100), nullable=True)
    return_date = db.Column(db.DateTime, nullable=True)
    
    # Dispute Information
    dispute_reason = db.Column(db.Text, nullable=True)
    dispute_resolution = db.Column(db.Text, nullable=True)
    dispute_resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    dispute_resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dispute_resolver = db.relationship('User', foreign_keys=[dispute_resolved_by], backref='resolved_disputes')
    
    def __repr__(self):
        return f'<Transaction {self.id} for Item {self.item_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'item_id': self.item_id,
            'item_request_id': self.item_request_id,
            'item_owner_id': self.item_owner_id,
            'requester_id': self.requester_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'expected_return_date': self.expected_return_date.isoformat() if self.expected_return_date else None,
            'actual_return_date': self.actual_return_date.isoformat() if self.actual_return_date else None,
            'status': self.status,
            'handover_notes': self.handover_notes,
            'handover_photos': self.handover_photos,
            'handover_witness': self.handover_witness,
            'handover_date': self.handover_date.isoformat() if self.handover_date else None,
            'return_notes': self.return_notes,
            'return_photos': self.return_photos,
            'return_condition': self.return_condition,
            'return_witness': self.return_witness,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'dispute_reason': self.dispute_reason,
            'dispute_resolution': self.dispute_resolution,
            'dispute_resolved_by': self.dispute_resolved_by,
            'dispute_resolved_at': self.dispute_resolved_at.isoformat() if self.dispute_resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'item_owner_name': self.item_owner.get_full_name() if self.item_owner else None,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'item_title': self.item.title if self.item else None
        }
    
    def is_overdue(self):
        """Check if transaction is overdue"""
        if self.status == 'returned':
            return False
        return datetime.now().date() > self.expected_return_date
