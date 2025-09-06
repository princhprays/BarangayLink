from database import db
from datetime import datetime, timezone

class ItemRequest(db.Model):
    __tablename__ = 'item_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Request Details
    purpose = db.Column(db.Text, nullable=True)
    requested_loan_days = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected', 'cancelled', 'completed'
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Approval
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    
    # Messages
    owner_message = db.Column(db.Text, nullable=True)
    requester_message = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], overlaps="item_requester,item_requests")
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_item_requests')
    transactions = db.relationship('Transaction', backref='item_request', lazy=True)
    
    def __repr__(self):
        return f'<ItemRequest {self.id} for Item {self.item_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'barangay_id': self.barangay_id,
            'item_id': self.item_id,
            'requester_id': self.requester_id,
            'purpose': self.purpose,
            'requested_loan_days': self.requested_loan_days,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'owner_message': self.owner_message,
            'requester_message': self.requester_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'item_title': self.item.title if self.item else None
        }
