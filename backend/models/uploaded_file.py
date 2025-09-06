from database import db
from datetime import datetime, timezone

class UploadedFile(db.Model):
    __tablename__ = 'uploaded_files'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # 'document_request', 'item', 'registration', 'announcement'
    entity_id = db.Column(db.Integer, nullable=True)  # ID of the related entity
    file_type = db.Column(db.String(50), nullable=False)  # 'valid_id', 'selfie', 'profile', 'requirement', 'item_image', 'document'
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    upload_purpose = db.Column(db.String(100), nullable=True)  # 'registration', 'document_requirement', 'item_listing', 'announcement'
    description = db.Column(db.Text, nullable=True)  # Optional description of the file
    is_active = db.Column(db.Boolean, default=True)  # For soft deletion
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], overlaps="uploaded_files")
    
    def __repr__(self):
        return f'<UploadedFile {self.id}: {self.original_filename}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'file_type': self.file_type,
            'original_filename': self.original_filename,
            'stored_filename': self.stored_filename,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'upload_purpose': self.upload_purpose,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'file_url': f"/uploads/{self.file_path}",
            'file_size_mb': round(self.file_size / (1024 * 1024), 2),
            'file_extension': self.original_filename.rsplit('.', 1)[1].lower() if '.' in self.original_filename else 'unknown'
        }
    
    def get_file_info(self):
        """Get detailed file information"""
        import os
        from flask import current_app
        
        full_path = os.path.join(current_app.root_path, 'uploads', self.file_path)
        
        if not os.path.exists(full_path):
            return None
        
        stat = os.stat(full_path)
        
        return {
            'exists': True,
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'url': f"/uploads/{self.file_path}"
        }
    
    def soft_delete(self):
        """Soft delete the file (mark as inactive)"""
        self.is_active = False
        self.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.session.commit()
    
    def hard_delete(self):
        """Permanently delete the file and database record"""
        import os
        from flask import current_app
        
        # Delete physical file
        full_path = os.path.join(current_app.root_path, 'uploads', self.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Failed to delete file {full_path}: {str(e)}")
        
        # Delete database record
        db.session.delete(self)
        db.session.commit()
