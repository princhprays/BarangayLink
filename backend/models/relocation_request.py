from database import db
from datetime import datetime, timezone

class RelocationRequest(db.Model):
    __tablename__ = 'relocation_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    from_barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    to_barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=False)
    
    # Relocation Details
    new_address = db.Column(db.Text, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected', 'completed', 'cancelled'
    
    # Approval Process
    from_barangay_approved = db.Column(db.Boolean, default=False)
    from_barangay_approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    from_barangay_approved_at = db.Column(db.DateTime, nullable=True)
    from_barangay_notes = db.Column(db.Text, nullable=True)
    
    to_barangay_approved = db.Column(db.Boolean, default=False)
    to_barangay_approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    to_barangay_approved_at = db.Column(db.DateTime, nullable=True)
    to_barangay_notes = db.Column(db.Text, nullable=True)
    
    # Transfer Details
    transfer_date = db.Column(db.DateTime, nullable=True)
    transfer_notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    requester = db.relationship('User', foreign_keys=[requester_id], overlaps="relocation_requester,relocation_requests")
    from_barangay_approver = db.relationship('User', foreign_keys=[from_barangay_approved_by], backref='approved_from_relocations')
    to_barangay_approver = db.relationship('User', foreign_keys=[to_barangay_approved_by], backref='approved_to_relocations')
    
    def __repr__(self):
        return f'<RelocationRequest {self.id} from {self.from_barangay_id} to {self.to_barangay_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'requester_id': self.requester_id,
            'from_barangay_id': self.from_barangay_id,
            'to_barangay_id': self.to_barangay_id,
            'new_address': self.new_address,
            'reason': self.reason,
            'status': self.status,
            'from_barangay_approved': self.from_barangay_approved,
            'from_barangay_approved_by': self.from_barangay_approved_by,
            'from_barangay_approved_at': self.from_barangay_approved_at.isoformat() if self.from_barangay_approved_at else None,
            'from_barangay_notes': self.from_barangay_notes,
            'to_barangay_approved': self.to_barangay_approved,
            'to_barangay_approved_by': self.to_barangay_approved_by,
            'to_barangay_approved_at': self.to_barangay_approved_at.isoformat() if self.to_barangay_approved_at else None,
            'to_barangay_notes': self.to_barangay_notes,
            'transfer_date': self.transfer_date.isoformat() if self.transfer_date else None,
            'transfer_notes': self.transfer_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'requester_name': self.requester.get_full_name() if self.requester else None,
            'from_barangay_name': self.from_barangay.name if self.from_barangay else None,
            'to_barangay_name': self.to_barangay.name if self.to_barangay else None
        }
