# BarangayLink Backend

Flask-based REST API for the BarangayLink platform - **PRODUCTION READY**

## 🚀 Quick Start

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Run the application:**
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## 📁 Structure

- `app.py` - Main Flask application with all route blueprints
- `models/` - 13 Database models (SQLAlchemy) with complete relationships
- `routes/` - 13 API route modules with comprehensive endpoints
- `utils/` - Utility functions for email and file handling
- `uploads/` - File storage for documents and images
- `instance/` - SQLite database (6.3MB with 42,003 locations)
- `requirements.txt` - Python dependencies

## 🔧 Configuration

### Environment Variables

- `FLASK_ENV` - Environment (development/production)
- `SECRET_KEY` - Flask secret key
- `JWT_SECRET_KEY` - JWT signing key
- `DATABASE_URL` - Database connection string
- `EMAIL_HOST` - SMTP server for email verification
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password

### Database

- **Development**: SQLite (barangaylink.db - 6.3MB)
- **Production**: PostgreSQL ready
- **Data**: Complete PSGC integration with all Philippine locations


## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new resident with file uploads
- `POST /login` - User login with JWT token
- `GET /profile` - Get user profile and barangay info
- `POST /logout` - User logout with token blacklisting
- `POST /re-register` - Re-register rejected users

### Barangay (`/api/barangay`)
- `GET /` - Get barangay information
- `GET /list` - List all barangays

### Locations (`/api/locations`)
- `GET /provinces` - Get all provinces
- `GET /municipalities/<province_id>` - Get municipalities by province
- `GET /barangays/<municipality_id>` - Get barangays by municipality

### Admin (`/api/admin`)
- `GET /dashboard` - Admin dashboard with real-time statistics
- `GET /residents/pending` - Get pending residents with search/pagination
- `GET /residents/<id>` - Get resident details
- `POST /residents/<id>/approve` - Approve resident
- `POST /residents/<id>/reject` - Reject resident with reason

### Marketplace (`/api/marketplace`)
- `GET /items` - Get all items (public)
- `POST /items` - Create item (resident)
- `GET /items/<id>` - Get item details
- `PUT /items/<id>` - Update item (owner/admin)
- `DELETE /items/<id>` - Delete item (owner/admin)
- `POST /items/<id>/request` - Request item (resident)
- `GET /requests` - Get my requests (resident)
- `DELETE /requests/<id>` - Cancel request (resident)
- `GET /admin/pending-items` - Get pending items (admin)
- `POST /admin/items/<id>/approve` - Approve item (admin)
- `POST /admin/items/<id>/reject` - Reject item (admin)

### Benefits (`/api/benefits`)
- `GET /benefits` - Get all benefits (public)
- `GET /benefits/<id>` - Get benefit details
- `POST /benefits` - Create benefit (admin)
- `PUT /benefits/<id>` - Update benefit (admin)
- `DELETE /benefits/<id>` - Delete benefit (admin)
- `POST /applications` - Create application (resident)
- `GET /applications` - Get my applications (resident)
- `GET /admin/applications` - Get all applications (admin)
- `POST /admin/applications/<id>/approve` - Approve application (admin)
- `POST /admin/applications/<id>/reject` - Reject application (admin)
- `POST /admin/applications/<id>/complete` - Complete application (admin)

### Announcements (`/api/announcements`)
- `GET /announcements` - Get all announcements (public)
- `GET /announcements/<id>` - Get announcement details
- `POST /announcements` - Create announcement (admin)
- `PUT /announcements/<id>` - Update announcement (admin)
- `DELETE /announcements/<id>` - Delete announcement (admin)
- `POST /announcements/<id>/pin` - Pin/unpin announcement (admin)
- `GET /admin/announcements` - Get all announcements (admin)

### Documents (`/api/documents`)
- `GET /types` - Get all document types (public)
- `GET /types/<id>` - Get document type details
- `POST /types` - Create document type (admin)
- `PUT /types/<id>` - Update document type (admin)
- `DELETE /types/<id>` - Delete document type (admin)
- `POST /requests` - Create document request (resident)
- `GET /requests` - Get my requests (resident) / all requests (admin)
- `GET /requests/<id>` - Get request details
- `POST /requests/<id>/approve` - Approve request (admin)
- `POST /requests/<id>/reject` - Reject request (admin)
- `POST /requests/<id>/complete` - Complete request and generate QR/PDF (admin)
- `GET /verify/<code>` - Verify document (public)

### Emergency SOS (`/api/sos`)
- `POST /requests` - Create SOS request (resident)
- `GET /requests` - Get my SOS requests (resident) / all requests (admin)
- `GET /requests/<id>` - Get SOS request details
- `POST /requests/<id>/respond` - Respond to SOS (admin)
- `POST /requests/<id>/resolve` - Resolve SOS request (admin)

### Relocation (`/api/relocation`)
- `POST /requests` - Create relocation request (resident)
- `GET /requests` - Get my relocation requests (resident) / all requests (admin)
- `GET /requests/<id>` - Get relocation request details
- `POST /requests/<id>/approve` - Approve relocation (admin)
- `POST /requests/<id>/reject` - Reject relocation (admin)

### Residents (`/api/residents`)
- `GET /` - Get residents list (admin only)

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## 🗄 Database Models

### Core Models
- `Location` - Complete PSGC hierarchy (42,003 records)
- `Barangay` - Administrative locations with contact info
- `User` - Authentication & basic info with location integration
- `ResidentProfile` - Detailed resident data and verification

### Feature Models
- `Item` - Community marketplace items with approval workflow
- `ItemRequest` - Item borrowing requests with status tracking
- `Transaction` - Active loans/returns with history
- `Benefit` - Community benefits with eligibility criteria
- `BenefitApplication` - Benefit applications with approval workflow
- `DocumentType` - Available certificates with requirements
- `DocumentRequest` - Certificate requests with QR generation
- `Announcement` - Community updates with priority and pinning
- `SOSRequest` - Personal emergencies with response tracking
- `RelocationRequest` - Inter-barangay transfers with approval
- `CommunityAlert` - Barangay-wide emergency notifications
- `ActivityLog` - Complete audit trail for all actions
- `JWTBlacklist` - Token blacklisting for secure logout

### Database Statistics
- **Total Records**: 42,003+ locations + user data
- **Database Size**: 6.3MB (SQLite)
- **Relationships**: Complete foreign key constraints
- **Indexes**: Optimized for common queries
- **Multi-tenant**: Isolated data per barangay

## 🚀 Development

### Running in Development Mode

```bash
export FLASK_ENV=development
python app.py
```

### Database Migrations

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## 🧪 Testing

```bash
python -m pytest
```

## 📦 Dependencies

### Core Framework
- Flask 2.3.3 - Web framework
- Flask-RESTful 0.3.10 - REST API framework
- Flask-CORS 4.0.0 - Cross-origin resource sharing
- Flask-SQLAlchemy 3.0.5 - Database ORM
- Flask-Migrate 4.0.5 - Database migrations
- Flask-JWT-Extended 4.5.3 - JWT authentication

### Security & Authentication
- bcrypt 4.0.1 - Password hashing
- python-dotenv 1.0.0 - Environment variables

### Database
- psycopg2-binary 2.9.7 - PostgreSQL adapter

### Document Generation
- qrcode 7.4.2 - QR code generation
- Pillow 10.0.1 - Image processing
- reportlab 4.0.4 - PDF generation

### Data Validation
- marshmallow 3.20.1 - Object serialization
- marshmallow-sqlalchemy 0.29.0 - SQLAlchemy integration

## 🎯 Features Implemented

### ✅ Complete Systems
- **User Management**: Registration, verification, approval workflow
- **Authentication**: JWT with token blacklisting and email verification
- **Location Integration**: Complete PSGC data for all Philippine locations
- **Community Marketplace**: Item sharing and borrowing with approval workflow
- **Benefits Management**: Application and approval system
- **Announcements**: Priority-based community updates
- **Document Services**: QR verification and PDF generation
- **Emergency Systems**: SOS requests and relocation management
- **Admin Dashboard**: Real-time statistics and comprehensive management
- **Multi-tenant Architecture**: Isolated data per barangay

### 🔧 Technical Features
- **File Upload**: Document and image handling
- **Email Service**: Verification and notifications
- **QR Code Generation**: Document verification
- **PDF Generation**: Official documents with barangay branding
- **Activity Logging**: Complete audit trail
- **Error Handling**: Comprehensive error responses
- **Data Validation**: Input sanitization and validation
