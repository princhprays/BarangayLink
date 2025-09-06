# BarangayLink - Barangay Management Platform

A comprehensive barangay management platform that connects residents, facilitates community sharing, and streamlines administrative processes.

## 🚀 Features

- **Multi-Barangay Support**: Each barangay has isolated data and admin access
- **Community Marketplace**: Share and borrow items within the community
- **Document Services**: Request barangay certificates with QR code verification
- **Emergency SOS**: Quick emergency response system
- **Benefits Management**: Access and request barangay benefits
- **Announcements**: Community updates and notifications
- **Relocation System**: Seamless transfer between barangays

## 🛠 Tech Stack

### Backend
- **Python Flask** with Flask-RESTful for APIs
- **PostgreSQL** (production) / SQLite (development)
- **JWT Authentication** with bcrypt password hashing
- **QR Code Generation** for document verification
- **PDF Generation** with barangay logos

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **Axios** for HTTP requests
- **React Hot Toast** for notifications
- **Lucide React** for icons

## 📁 Project Structure

```
BarangayLink/
├── backend/                 # Flask backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── app.py              # Flask application
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   ├── package.json        # Node dependencies
│   └── vite.config.ts      # Vite configuration
└── README.md
```

## 🚀 Getting Started

### Current Status (Week 9+ - Production Ready)

The BarangayLink platform is now **production-ready** with all core features implemented and tested. The system has evolved from a basic concept to a comprehensive barangay management solution.

### What's Been Built

#### ✅ **Complete Backend API** (Flask)
- **13 Database Models** with full relationships
- **13 Route Modules** with comprehensive endpoints
- **JWT Authentication** with token blacklisting
- **File Upload System** with validation
- **Email Service** for notifications
- **QR Code Generation** for document verification
- **PDF Generation** with barangay branding
- **Activity Logging** for audit trails

#### ✅ **Complete Frontend** (React + TypeScript)
- **Responsive Design** with TailwindCSS
- **Role-based Access Control** (Admin/Resident)
- **Protected Routes** with authentication
- **Form Management** with validation
- **Real-time Updates** with React Query
- **File Upload** with progress tracking
- **QR Code Scanning** for document verification
- **Mobile-friendly** interface

#### ✅ **Core Features Implemented**
1. **User Management**: Registration, verification, approval workflow
2. **Community Marketplace**: Item sharing and borrowing
3. **Document Services**: Certificate requests with QR verification
4. **Benefits Management**: Application and approval system
5. **Announcements**: Priority-based community updates
6. **Emergency Systems**: SOS requests and relocation
7. **Admin Dashboard**: Comprehensive management interface
8. **Multi-tenant Architecture**: Isolated data per barangay

### 🎯 **Key Achievements**

- **42,000+ Location Records**: Complete PSGC integration
- **Multi-role System**: Admin and Resident roles with proper permissions
- **File Management**: Secure upload and storage system
- **Email Integration**: Verification and notification system
- **Document Generation**: QR-verified PDF certificates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Production Ready**: Error handling, validation, security

### 📊 **Database Structure**

The system uses a comprehensive database with 13 interconnected models:

- **Location**: Complete Philippine location hierarchy (42,003 records)
- **User**: Authentication and basic user information
- **ResidentProfile**: Detailed resident data and verification
- **Barangay**: Administrative location information
- **Item**: Community marketplace items
- **Transaction**: Item borrowing and return tracking
- **Benefit**: Community benefits and programs
- **BenefitApplication**: Benefit request management
- **DocumentType**: Available certificates and requirements
- **DocumentRequest**: Certificate request workflow
- **Announcement**: Community updates and notifications
- **SOSRequest**: Emergency response system
- **RelocationRequest**: Inter-barangay transfer system
- **ActivityLog**: Complete audit trail
- **JWTBlacklist**: Token management for security

### 🔧 **Technical Implementation**

#### Backend Architecture
- **Flask-RESTful**: RESTful API design
- **SQLAlchemy**: Database ORM with relationships
- **JWT**: Secure authentication with blacklisting
- **bcrypt**: Password hashing
- **Pillow**: Image processing
- **qrcode**: QR code generation
- **reportlab**: PDF generation
- **smtplib**: Email service

#### Frontend Architecture
- **React 18**: Modern React with hooks
- **TypeScript**: Type safety and better development experience
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Query**: Server state management
- **React Hook Form**: Form handling
- **Axios**: HTTP client
- **React Hot Toast**: Notifications
- **Lucide React**: Icon library

### 🚀 **Getting Started**

#### Prerequisites
- Python 3.8+
- Node.js 18+
- Git

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BarangayLink
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   cp env.example .env
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### 🌐 **Production Deployment**

The application is currently deployed and live:

#### **Frontend (Vercel)**
- **URL**: https://barangaylink-l5z87m7y8-pauljohnantigo-7126s-projects.vercel.app
- **Platform**: Vercel
- **Build**: Automated from GitHub
- **Status**: ✅ Live and Running

#### **Backend (Railway)**
- **Platform**: Railway
- **Database**: PostgreSQL 17.6
- **Status**: ✅ Live and Running
- **Features**: Auto-scaling, managed database, environment variables

#### **Deployment Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│   React + TS    │    │   Flask + API   │    │   Production DB │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### **Environment Variables (Production)**
- **Frontend**: `VITE_API_URL` points to Railway backend
- **Backend**: `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET_KEY`, etc.
- **Email**: SMTP configuration for notifications

#### Sample Accounts
After setup, you can use these test accounts:
- **Admin**: `Pauljohn` / `Pauljohn8265`
- **Resident**: `N?A` / `N?A`

### 📱 **User Experience**

#### For Residents
- **Easy Registration**: Simple form with file uploads
- **Community Access**: Browse marketplace, request documents
- **Real-time Updates**: Get notified of announcements and status changes
- **Mobile-friendly**: Works seamlessly on all devices

#### For Administrators
- **Comprehensive Dashboard**: Real-time statistics and management
- **User Management**: Approve/reject registrations
- **Content Management**: Create announcements, manage benefits
- **Document Processing**: Generate and verify certificates
- **Emergency Response**: Handle SOS requests

### 🔒 **Security Features**

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Token Blacklisting**: Secure logout functionality
- **File Validation**: Secure file upload with type checking
- **Role-based Access**: Proper permission system
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: SQLAlchemy ORM protection
- **XSS Protection**: React's built-in XSS protection

### 📈 **Performance Optimizations**

- **Database Indexing**: Optimized queries for large datasets
- **Lazy Loading**: Efficient data loading
- **Image Optimization**: Compressed and resized uploads
- **Caching**: React Query for efficient data caching
- **Code Splitting**: Optimized bundle sizes
- **Responsive Images**: Adaptive image loading

### 🧪 **Testing & Quality**

- **Error Handling**: Comprehensive error management
- **Input Validation**: Both client and server-side validation
- **File Upload Testing**: Secure file handling
- **Authentication Testing**: JWT token management
- **Database Testing**: Relationship integrity
- **UI Testing**: Cross-browser compatibility

### 🚀 **Deployment Ready**

The application is production-ready and **LIVE** with:
- **Frontend**: Deployed on Vercel (https://barangaylink-l5z87m7y8-pauljohnantigo-7126s-projects.vercel.app)
- **Backend**: Deployed on Railway with PostgreSQL database
- **Environment Configuration**: Separate dev/prod settings
- **Database Migration**: Easy database setup
- **Static File Serving**: Optimized file handling
- **Error Logging**: Comprehensive error tracking
- **Security Headers**: Production security measures
- **Performance Monitoring**: Built-in performance tracking

#### 🌐 **Live Application**
- **Frontend URL**: https://barangaylink-l5z87m7y8-pauljohnantigo-7126s-projects.vercel.app
- **Backend API**: Railway-hosted with PostgreSQL database
- **Status**: ✅ Production Ready and Deployed

### 📚 **API Documentation**

The backend provides a comprehensive REST API:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

#### Marketplace
- `GET /api/marketplace/items` - Get all items
- `POST /api/marketplace/items` - Create item
- `POST /api/marketplace/items/{id}/request` - Request item

#### Documents
- `GET /api/documents/types` - Get document types
- `POST /api/documents/requests` - Create document request
- `GET /api/documents/verify/{code}` - Verify document

#### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/residents/pending` - Pending residents
- `POST /api/admin/residents/{id}/approve` - Approve resident

### 🎯 **Future Enhancements**

While the current system is production-ready, potential future enhancements include:
- **Mobile App**: Native mobile applications
- **Advanced Analytics**: Detailed reporting and analytics
- **Payment Integration**: Online payment processing
- **Multi-language Support**: Localization for different regions
- **Advanced Search**: Full-text search capabilities
- **API Rate Limiting**: Advanced API protection
- **Real-time Chat**: Community communication features

### 📞 **Support**

For support and questions:
- Check the documentation in each module
- Review the API endpoints
- Test with the provided sample accounts
- Check the error logs for debugging

### 🚀 **Deployment Process**

#### **Frontend Deployment (Vercel)**
1. **Automatic Deployment**: Connected to GitHub repository
2. **Build Process**: `npm install && npm run build`
3. **Environment**: Production build with TypeScript compilation
4. **URL**: https://barangaylink-l5z87m7y8-pauljohnantigo-7126s-projects.vercel.app

#### **Backend Deployment (Railway)**
1. **Platform**: Railway with automatic scaling
2. **Database**: PostgreSQL 17.6 with managed backups
3. **Environment Variables**: Secure configuration management
4. **API**: RESTful endpoints with JWT authentication

#### **Database Setup**
- **PostgreSQL 17.6**: Production-grade database
- **Automatic Migrations**: Flask-Migrate for schema updates
- **Backup**: Automated backups via Railway
- **Connection**: Secure connection strings

### 🏆 **Conclusion**

BarangayLink has evolved from a concept to a **production-ready, live barangay management platform**. With comprehensive features, robust architecture, and user-friendly design, it's now **actively serving real barangays and their communities**.

The platform demonstrates modern web development practices, security best practices, and user experience design, making it a solid foundation for barangay digital transformation.

**🎉 Status: LIVE AND DEPLOYED** - Ready for real-world usage!
