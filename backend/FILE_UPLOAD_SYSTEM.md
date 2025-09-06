# File Upload System Documentation

## Overview

The BarangayLink file upload system has been completed with comprehensive functionality for handling user registration files, item images, and document generation. The system provides secure file storage, automatic migration, and proper cleanup mechanisms.

## File Storage Structure

```
backend/uploads/
├── temp/                    # Temporary files (7-day auto-cleanup)
│   ├── valid_id_*.jpg
│   ├── selfie_*.jpg
│   └── profile_*.jpg
├── residents/              # Permanent user files
│   └── {user_id}/         # Individual user directories
│       ├── user_{user_id}_valid_id_*.jpg
│       ├── user_{user_id}_selfie_*.jpg
│       └── user_{user_id}_profile_*.jpg
├── items/                 # Item images
│   └── {item_id}/         # Individual item directories
│       ├── item_{item_id}_*.jpg
│       └── item_{item_id}_*.png
└── documents/             # Generated PDF documents
    └── document_{id}_*.pdf
```

## File Upload Types

### 1. User Registration Files

**Files:** Valid ID, Selfie with ID, Profile Picture
**Storage:** Temporary → Permanent (on approval)
**Validation:** PNG, JPG, JPEG, PDF (max 5MB)

**Process:**
1. Files uploaded during registration → `uploads/temp/`
2. Filenames stored in database (User table)
3. On admin approval → Files moved to `uploads/residents/{user_id}/`
4. Database paths updated automatically

### 2. Item Images

**Files:** Multiple images per item
**Storage:** Direct to permanent storage
**Validation:** PNG, JPG, JPEG (max 5MB)

**Process:**
1. Files uploaded directly to `uploads/items/{item_id}/`
2. URLs stored as JSON array in Item.image_urls
3. Supports multiple images per item
4. Individual image deletion supported

### 3. Generated Documents

**Files:** PDF certificates, permits, etc.
**Storage:** Direct to permanent storage
**Generation:** Dynamic PDF creation with QR codes

**Process:**
1. PDFs generated using ReportLab
2. Saved to `uploads/documents/`
3. URLs stored in DocumentRequest.document_url

## API Endpoints

### User File Management

#### Get User Files
```
GET /api/auth/profile/files
Authorization: Bearer {token}
```
Returns all files uploaded by the current user.

#### Migrate User Files
```
POST /api/auth/profile/files/migrate
Authorization: Bearer {token}
```
Manually migrate temporary files to permanent storage (for approved users).

### Item Image Management

#### Upload Item Images
```
POST /api/marketplace/items/{item_id}/images
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body: images[] (multiple files)
```

#### Delete All Item Images
```
DELETE /api/marketplace/items/{item_id}/images
Authorization: Bearer {token}
```

#### Delete Single Item Image
```
DELETE /api/marketplace/items/{item_id}/images/{image_index}
Authorization: Bearer {token}
```

## Security Features

### File Validation
- **Extension Whitelist:** PNG, JPG, JPEG, PDF only
- **Size Limit:** 5MB maximum per file
- **Secure Filenames:** Uses `secure_filename()` to prevent path traversal
- **Unique Naming:** Timestamp + UUID prevents conflicts

### Access Control
- **User Isolation:** Each user has their own directory
- **Ownership Verification:** Users can only manage their own files
- **Admin Override:** Admins can manage files for their barangay

### Cleanup System
- **Temporary Files:** Auto-deleted after 7 days
- **User Files:** Deleted when account is removed
- **Item Images:** Deleted when item is removed

## File Migration Process

### Automatic Migration (Admin Approval)
When an admin approves a resident:
1. System scans `uploads/temp/` for recent files
2. Moves files to `uploads/residents/{user_id}/`
3. Updates database paths automatically
4. Logs migration activity

### Manual Migration (User-Initiated)
Approved users can manually migrate their files:
1. User calls `/api/auth/profile/files/migrate`
2. System moves remaining temp files
3. Updates database paths
4. Returns migration results

## Database Storage

### User Table
```sql
valid_id_path VARCHAR(255)        -- Filename only
selfie_with_id_path VARCHAR(255)   -- Filename only  
profile_picture_url VARCHAR(255)   -- Filename only
```

### Item Table
```sql
image_urls TEXT                   -- JSON array of file paths
```

### DocumentRequest Table
```sql
document_url VARCHAR(255)         -- Full path to PDF
```

## File Serving

### URL Structure
```
/uploads/{file_path}
```

### Examples
- `/uploads/residents/123/user_123_profile.jpg`
- `/uploads/items/456/item_456_image1.jpg`
- `/uploads/documents/document_789.pdf`

### Serving Configuration
Files are served through Flask's `send_from_directory()` with proper security headers.

## Error Handling

### Common Error Responses
- **400:** Invalid file type/size
- **403:** Access denied (not owner/admin)
- **404:** File/user not found
- **500:** File system errors

### Error Recovery
- Failed uploads are cleaned up automatically
- Database rollback on file operation failures
- Detailed error logging for debugging

## Performance Considerations

### File Organization
- Files organized by user/item ID for efficient access
- Separate directories prevent conflicts
- Unique filenames prevent overwrites

### Cleanup Automation
- Background cleanup of expired temp files
- User directory cleanup on account deletion
- Item image cleanup on item deletion

## Future Enhancements

### Potential Improvements
1. **CDN Integration:** Move to cloud storage (AWS S3, etc.)
2. **Image Processing:** Automatic resizing/optimization
3. **Virus Scanning:** File security scanning
4. **Backup System:** Automated file backups
5. **Compression:** Automatic file compression

### Monitoring
- File upload success/failure rates
- Storage usage tracking
- Cleanup operation logs
- Performance metrics

## Usage Examples

### Frontend Integration

#### Upload Item Images
```javascript
const formData = new FormData();
files.forEach(file => formData.append('images', file));

const response = await fetch(`/api/marketplace/items/${itemId}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### Get User Files
```javascript
const response = await fetch('/api/auth/profile/files', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { files } = await response.json();
```

### Backend Usage

#### Save Item Image
```python
from utils.file_handler import save_item_image

file_path = save_item_image(uploaded_file, item_id)
```

#### Migrate User Files
```python
from utils.file_handler import migrate_user_files_to_permanent

migrated_files = migrate_user_files_to_permanent(user_id)
```

## Troubleshooting

### Common Issues

1. **File Not Found:** Check file path and permissions
2. **Upload Failed:** Verify file size and type
3. **Migration Failed:** Check temp directory and user permissions
4. **Access Denied:** Verify user ownership or admin rights

### Debug Commands

```python
# Check file info
from utils.file_handler import get_file_info
file_info = get_file_info("residents/123/profile.jpg")

# List user files
from utils.file_handler import get_user_files
files = get_user_files(user_id)

# Cleanup temp files
from utils.file_handler import cleanup_expired_temp_files
deleted_count = cleanup_expired_temp_files()
```

This comprehensive file upload system provides secure, scalable, and maintainable file management for the BarangayLink platform.
