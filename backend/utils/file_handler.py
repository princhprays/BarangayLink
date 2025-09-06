"""
File handling utilities for secure file uploads
"""

import os
import uuid
import shutil
from datetime import datetime, timedelta, timezone
from werkzeug.utils import secure_filename
from flask import current_app
import mimetypes

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    """Get file type based on extension"""
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['png', 'jpg', 'jpeg']:
        return 'image'
    elif ext in ['pdf', 'doc', 'docx']:
        return 'document'
    return 'unknown'

def validate_file(file):
    """Validate uploaded file"""
    if not file or not file.filename:
        return False, "No file provided"
    
    if not allowed_file(file.filename):
        return False, f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
    
    return True, "Valid file"

def generate_unique_filename(original_filename, prefix=""):
    """Generate unique filename with prefix"""
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if prefix:
        filename = f"{prefix}_{timestamp}_{unique_id}.{ext}"
    else:
        filename = f"{timestamp}_{unique_id}.{ext}"
    
    return secure_filename(filename)

def generate_descriptive_filename(original_filename, file_type, user_id, entity_id=None, purpose=None):
    """Generate descriptive filename with clear purpose and context"""
    ext = original_filename.rsplit('.', 1)[1].lower()
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create descriptive prefix based on file type and context
    prefix_parts = [file_type, str(user_id)]
    if entity_id:
        prefix_parts.append(str(entity_id))
    if purpose:
        prefix_parts.append(purpose)
    
    prefix = "_".join(prefix_parts)
    filename = f"{prefix}_{timestamp}_{unique_id}.{ext}"
    
    return secure_filename(filename)

def get_file_storage_path(user_id, file_type, entity_type=None, entity_id=None):
    """Get organized storage path for file based on type and context"""
    base_path = os.path.join(current_app.root_path, 'uploads', 'residents', str(user_id))
    
    if file_type in ['valid_id', 'selfie', 'profile']:
        return os.path.join(base_path, 'registration')
    elif file_type == 'requirement' and entity_type == 'document_request':
        return os.path.join(base_path, 'documents', str(entity_id))
    elif file_type == 'item_image':
        return os.path.join(base_path, 'items', str(entity_id))
    elif file_type == 'document':
        return os.path.join(base_path, 'documents', str(entity_id))
    else:
        return os.path.join(base_path, 'misc')

def save_temp_file(file, file_type="document"):
    """Save file to temporary directory"""
    try:
        # Create temp directory if it doesn't exist
        temp_dir = os.path.join(current_app.root_path, 'uploads', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename, file_type)
        file_path = os.path.join(temp_dir, filename)
        
        # Save file
        file.save(file_path)
        
        return filename, file_path
        
    except Exception as e:
        raise Exception(f"Failed to save file: {str(e)}")

def save_organized_file(file, user_id, file_type, entity_type=None, entity_id=None, purpose=None, description=None):
    """Save file with organized structure and database tracking"""
    try:
        from models.uploaded_file import UploadedFile
        from database import db
        
        # Validate file
        is_valid, error_msg = validate_file(file)
        if not is_valid:
            raise Exception(f"File validation failed: {error_msg}")
        
        # Get storage path
        storage_dir = get_file_storage_path(user_id, file_type, entity_type, entity_id)
        os.makedirs(storage_dir, exist_ok=True)
        
        # Generate descriptive filename
        filename = generate_descriptive_filename(
            file.filename, file_type, user_id, entity_id, purpose
        )
        file_path = os.path.join(storage_dir, filename)
        
        # Save file
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
        
        # Create relative path for database storage
        relative_path = f"residents/{user_id}/{os.path.relpath(file_path, os.path.join(current_app.root_path, 'uploads', 'residents', str(user_id)))}"
        
        # Create database record
        uploaded_file = UploadedFile(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            file_type=file_type,
            original_filename=file.filename,
            stored_filename=filename,
            file_path=relative_path,
            file_size=file_size,
            mime_type=mime_type,
            upload_purpose=purpose,
            description=description
        )
        
        db.session.add(uploaded_file)
        db.session.commit()
        
        return uploaded_file
        
    except Exception as e:
        # Clean up file if database save fails
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise Exception(f"Failed to save organized file: {str(e)}")

def move_temp_to_permanent(temp_filename, user_id, file_type="document"):
    """Move file from temp to permanent user directory"""
    try:
        temp_path = os.path.join(current_app.root_path, 'uploads', 'temp', temp_filename)
        
        if not os.path.exists(temp_path):
            raise Exception("Temporary file not found")
        
        # Create user directory
        user_dir = os.path.join(current_app.root_path, 'uploads', 'residents', str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        
        # Generate new filename for permanent storage
        permanent_filename = generate_unique_filename(temp_filename, f"user_{user_id}")
        permanent_path = os.path.join(user_dir, permanent_filename)
        
        # Move file
        shutil.move(temp_path, permanent_path)
        
        # Return relative path for database storage
        return f"residents/{user_id}/{permanent_filename}"
        
    except Exception as e:
        raise Exception(f"Failed to move file to permanent storage: {str(e)}")

def delete_temp_file(filename):
    """Delete temporary file"""
    try:
        temp_path = os.path.join(current_app.root_path, 'uploads', 'temp', filename)
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return True
    except Exception as e:
        print(f"Failed to delete temp file {filename}: {str(e)}")
        return False

def delete_user_files(user_id):
    """Delete all files for a user"""
    try:
        user_dir = os.path.join(current_app.root_path, 'uploads', 'residents', str(user_id))
        if os.path.exists(user_dir):
            shutil.rmtree(user_dir)
        return True
    except Exception as e:
        print(f"Failed to delete user files for user {user_id}: {str(e)}")
        return False

def cleanup_expired_temp_files():
    """Clean up temporary files older than 7 days"""
    try:
        temp_dir = os.path.join(current_app.root_path, 'uploads', 'temp')
        if not os.path.exists(temp_dir):
            return
        
        cutoff_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
        deleted_count = 0
        
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                if file_mtime < cutoff_time:
                    os.remove(file_path)
                    deleted_count += 1
        
        return deleted_count
        
    except Exception as e:
        print(f"Failed to cleanup temp files: {str(e)}")
        return 0

def get_file_url(file_path):
    """Get URL for serving file"""
    if not file_path:
        return None
    
    # For now, return a simple path. In production, you might want to use a CDN
    return f"/uploads/{file_path}"

def get_file_info(file_path):
    """Get file information"""
    if not file_path:
        return None
    
    full_path = os.path.join(current_app.root_path, 'uploads', file_path)
    
    if not os.path.exists(full_path):
        return None
    
    stat = os.stat(full_path)
    
    return {
        'filename': os.path.basename(file_path),
        'size': stat.st_size,
        'created': datetime.fromtimestamp(stat.st_ctime),
        'modified': datetime.fromtimestamp(stat.st_mtime),
        'url': get_file_url(file_path)
    }

def migrate_user_files_to_permanent(user_id):
    """Move all temporary files for a user to permanent storage"""
    try:
        temp_dir = os.path.join(current_app.root_path, 'uploads', 'temp')
        if not os.path.exists(temp_dir):
            return []
        
        migrated_files = []
        
        # Find all temp files for this user (files with user_id in name or created recently)
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                # Check if this file belongs to the user (by checking creation time and pattern)
                file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                # If file was created in last 24 hours, assume it's for this user
                if file_mtime > datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24):
                    try:
                        permanent_path = move_temp_to_permanent(filename, user_id, "user_file")
                        migrated_files.append(permanent_path)
                    except Exception as e:
                        print(f"Failed to migrate file {filename}: {str(e)}")
        
        return migrated_files
        
    except Exception as e:
        print(f"Failed to migrate files for user {user_id}: {str(e)}")
        return []

def save_item_image(file, item_id):
    """Save item image to permanent storage"""
    try:
        # Create item directory
        item_dir = os.path.join(current_app.root_path, 'uploads', 'items', str(item_id))
        os.makedirs(item_dir, exist_ok=True)
        
        # Generate unique filename
        filename = generate_unique_filename(file.filename, f"item_{item_id}")
        file_path = os.path.join(item_dir, filename)
        
        # Save file
        file.save(file_path)
        
        # Return relative path for database storage
        return f"items/{item_id}/{filename}"
        
    except Exception as e:
        raise Exception(f"Failed to save item image: {str(e)}")

def delete_item_images(item_id):
    """Delete all images for an item"""
    try:
        item_dir = os.path.join(current_app.root_path, 'uploads', 'items', str(item_id))
        if os.path.exists(item_dir):
            shutil.rmtree(item_dir)
        return True
    except Exception as e:
        print(f"Failed to delete item images for item {item_id}: {str(e)}")
        return False

def get_user_files(user_id):
    """Get all files for a user"""
    try:
        user_dir = os.path.join(current_app.root_path, 'uploads', 'residents', str(user_id))
        if not os.path.exists(user_dir):
            return []
        
        files = []
        for filename in os.listdir(user_dir):
            file_path = os.path.join(user_dir, filename)
            if os.path.isfile(file_path):
                file_info = get_file_info(f"residents/{user_id}/{filename}")
                if file_info:
                    files.append(file_info)
        
        return files
        
    except Exception as e:
        print(f"Failed to get files for user {user_id}: {str(e)}")
        return []

def update_user_file_paths(user_id, file_mappings):
    """Update user's file paths in database after migration"""
    try:
        from models.user import User
        from database import db
        
        user = User.query.get(user_id)
        if not user:
            return False
        
        # Update file paths based on mappings
        if 'valid_id' in file_mappings:
            user.valid_id_path = file_mappings['valid_id']
        if 'selfie_with_id' in file_mappings:
            user.selfie_with_id_path = file_mappings['selfie_with_id']
        if 'profile_picture' in file_mappings:
            user.profile_picture_url = file_mappings['profile_picture']
        
        db.session.commit()
        return True
        
    except Exception as e:
        print(f"Failed to update user file paths: {str(e)}")
        return False

def cleanup_expired_documents():
    """Clean up expired documents and their files"""
    try:
        from models.document_request import DocumentRequest
        from models.document_type import DocumentType
        from database import db
        from datetime import datetime
        
        # Find expired documents that should be auto-deleted
        expired_docs = DocumentRequest.query.join(DocumentType).filter(
            DocumentRequest.expires_at < datetime.now(timezone.utc).replace(tzinfo=None),
            DocumentRequest.is_expired == False,
            DocumentType.auto_delete_expired == True,
            DocumentRequest.status == 'ready'
        ).all()
        
        deleted_count = 0
        deleted_files = []
        
        for doc in expired_docs:
            try:
                # Delete PDF file if it exists
                if doc.document_url:
                    file_path = os.path.join(current_app.root_path, 'uploads', doc.document_url.lstrip('/'))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        deleted_files.append(doc.document_url)
                
                # Mark document as expired
                doc.is_expired = True
                doc.status = 'expired'
                
                deleted_count += 1
                
            except Exception as e:
                print(f"Failed to cleanup document {doc.id}: {str(e)}")
        
        if deleted_count > 0:
            db.session.commit()
        
        return {
            'deleted_count': deleted_count,
            'deleted_files': deleted_files
        }
        
    except Exception as e:
        print(f"Failed to cleanup expired documents: {str(e)}")
        return {'deleted_count': 0, 'deleted_files': []}

def cleanup_expired_documents_by_type(document_type_id):
    """Clean up expired documents for a specific document type"""
    try:
        from models.document_request import DocumentRequest
        from models.document_type import DocumentType
        from database import db
        from datetime import datetime
        
        # Find expired documents for specific type
        expired_docs = DocumentRequest.query.filter(
            DocumentRequest.document_type_id == document_type_id,
            DocumentRequest.expires_at < datetime.now(timezone.utc).replace(tzinfo=None),
            DocumentRequest.is_expired == False,
            DocumentRequest.status == 'ready'
        ).all()
        
        deleted_count = 0
        deleted_files = []
        
        for doc in expired_docs:
            try:
                # Delete PDF file if it exists
                if doc.document_url:
                    file_path = os.path.join(current_app.root_path, 'uploads', doc.document_url.lstrip('/'))
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        deleted_files.append(doc.document_url)
                
                # Mark document as expired
                doc.is_expired = True
                doc.status = 'expired'
                
                deleted_count += 1
                
            except Exception as e:
                print(f"Failed to cleanup document {doc.id}: {str(e)}")
        
        if deleted_count > 0:
            db.session.commit()
        
        return {
            'deleted_count': deleted_count,
            'deleted_files': deleted_files
        }
        
    except Exception as e:
        print(f"Failed to cleanup expired documents for type {document_type_id}: {str(e)}")
        return {'deleted_count': 0, 'deleted_files': []}

def get_user_files_by_type(user_id, file_type=None, entity_type=None):
    """Get files for a user, optionally filtered by type"""
    try:
        from models.uploaded_file import UploadedFile
        
        query = UploadedFile.query.filter(
            UploadedFile.user_id == user_id,
            UploadedFile.is_active == True
        )
        
        if file_type:
            query = query.filter(UploadedFile.file_type == file_type)
        if entity_type:
            query = query.filter(UploadedFile.entity_type == entity_type)
        
        files = query.order_by(UploadedFile.created_at.desc()).all()
        return [file.to_dict() for file in files]
        
    except Exception as e:
        print(f"Failed to get files for user {user_id}: {str(e)}")
        return []

def get_entity_files(entity_type, entity_id):
    """Get all files for a specific entity (document request, item, etc.)"""
    try:
        from models.uploaded_file import UploadedFile
        
        files = UploadedFile.query.filter(
            UploadedFile.entity_type == entity_type,
            UploadedFile.entity_id == entity_id,
            UploadedFile.is_active == True
        ).order_by(UploadedFile.created_at.desc()).all()
        
        return [file.to_dict() for file in files]
        
    except Exception as e:
        print(f"Failed to get files for {entity_type} {entity_id}: {str(e)}")
        return []

def delete_file_by_id(file_id, user_id=None):
    """Delete a file by ID, optionally checking user ownership"""
    try:
        from models.uploaded_file import UploadedFile
        from database import db
        
        query = UploadedFile.query.filter(UploadedFile.id == file_id)
        if user_id:
            query = query.filter(UploadedFile.user_id == user_id)
        
        uploaded_file = query.first()
        if not uploaded_file:
            return False, "File not found or access denied"
        
        # Delete physical file
        full_path = os.path.join(current_app.root_path, 'uploads', uploaded_file.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except Exception as e:
                print(f"Failed to delete physical file {full_path}: {str(e)}")
        
        # Delete database record
        db.session.delete(uploaded_file)
        db.session.commit()
        
        return True, "File deleted successfully"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Failed to delete file: {str(e)}"

def migrate_existing_files_to_new_structure():
    """Migrate existing files to new organized structure"""
    try:
        from models.uploaded_file import UploadedFile
        from models.user import User
        from database import db
        
        migrated_count = 0
        
        # Get all users with files
        users = User.query.filter(
            User.valid_id_path.isnot(None) | 
            User.selfie_with_id_path.isnot(None) | 
            User.profile_picture_url.isnot(None)
        ).all()
        
        for user in users:
            # Migrate valid_id
            if user.valid_id_path:
                try:
                    old_path = os.path.join(current_app.root_path, 'uploads', 'residents', str(user.id), user.valid_id_path)
                    if os.path.exists(old_path):
                        # Create new organized file record
                        file_size = os.path.getsize(old_path)
                        mime_type = mimetypes.guess_type(old_path)[0] or 'application/octet-stream'
                        
                        uploaded_file = UploadedFile(
                            user_id=user.id,
                            entity_type='registration',
                            entity_id=None,
                            file_type='valid_id',
                            original_filename=user.valid_id_path,
                            stored_filename=user.valid_id_path,
                            file_path=f"residents/{user.id}/{user.valid_id_path}",
                            file_size=file_size,
                            mime_type=mime_type,
                            upload_purpose='registration'
                        )
                        db.session.add(uploaded_file)
                        migrated_count += 1
                except Exception as e:
                    print(f"Failed to migrate valid_id for user {user.id}: {str(e)}")
            
            # Similar migration for selfie and profile files...
        
        db.session.commit()
        return migrated_count
        
    except Exception as e:
        db.session.rollback()
        print(f"Failed to migrate files: {str(e)}")
        return 0