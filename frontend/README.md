# BarangayLink Frontend

React-based frontend for the BarangayLink platform - **PRODUCTION READY**

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Build for production:**
```bash
npm run build
```

The frontend will be available at `http://localhost:3000`

## 📁 Structure

- `src/components/` - 15+ Reusable UI components
- `src/contexts/` - React contexts (AuthContext with full state management)
- `src/layouts/` - 3 Layout components (Public, Dashboard, Admin)
- `src/pages/` - 40+ Page components across all user roles
- `src/services/` - API service functions with Axios integration
- `public/` - Static assets and favicon
- `index.html` - Main HTML template
- `vite.config.ts` - Vite configuration with proxy setup

## 🎨 UI Components

### Layout Components
- `Header` - Navigation header with user menu and role-based navigation
- `Sidebar` - Resident dashboard sidebar with all community features
- `AdminSidebar` - Admin dashboard sidebar with management tools
- `MobileSidebar` - Mobile navigation drawer with responsive design
- `Footer` - Site footer with links and information
- `PublicSidebar` - Public navigation sidebar
- `ErrorBoundary` - Error handling wrapper for admin pages

### Auth Components
- `ProtectedRoute` - Route protection wrapper with role-based access
- `RoleBasedRedirect` - Automatic redirection based on user role
- `LoginPage` - User login form with validation
- `RegisterPage` - User registration form with file uploads
- `EmailVerificationPage` - Email verification handler

### Page Components (40+ Pages)
#### Public Pages
- `HomePage` - Beautiful landing page with feature showcase
- `MarketplacePage` - Public marketplace browsing
- `BenefitsPage` - Public benefits information
- `AnnouncementsPage` - Public announcements
- `CertificatesPage` - Public certificate information
- `DocumentVerification` - QR code document verification
- `AboutPage` - About the platform

#### Resident Pages
- `Dashboard` - Resident dashboard with statistics
- `Profile` - Resident profile management
- `CommunityItems` - Browse and manage community items
- `MyRequests` - Personal request management
- `CreateRequest` - Create new item requests
- `AddItem` - Add items to community marketplace
- `Benefits` - Benefits browsing and applications
- `BenefitsApplication` - Apply for benefits
- `Certificates` - Certificate information
- `DocumentRequests` - Request documents and certificates
- `Announcements` - Community announcements
- `SOSRelocation` - Emergency SOS and relocation requests

#### Admin Pages
- `Dashboard` - Admin dashboard with real-time statistics
- `Verifications` - Resident verification management
- `RequestManagement` - Item request management
- `ManageUsers` - User management
- `AdminManagement` - Admin user management
- `PendingItems` - Pending item approvals
- `BenefitsManagement` - Benefits management
- `BenefitApplications` - Benefit application management
- `AnnouncementsManagement` - Announcement management
- `DocumentRequests` - Document request management
- `DocumentManagement` - Document type management
- `SOSRelocation` - Emergency and relocation management
- `Profile` - Admin profile management

## 🔐 Authentication

The app uses React Context for authentication state management:

```tsx
import { useAuth } from './contexts/AuthContext'

const { user, login, logout, isAuthenticated } = useAuth()
```

## 🎯 User Roles

### Public Users
- ✅ Browse marketplace (read-only)
- ✅ View community benefits
- ✅ Read announcements
- ✅ View certificate information
- ✅ Verify documents using QR codes
- ✅ Access about page

### Residents
- ✅ Full dashboard access with statistics
- ✅ Community items management (add, browse, request)
- ✅ Request creation and management
- ✅ Benefits browsing and applications
- ✅ Document requests and certificates
- ✅ Emergency SOS requests
- ✅ Relocation requests
- ✅ Profile management

### Admins
- ✅ Admin dashboard with real-time statistics
- ✅ Resident verification and approval
- ✅ Request management (items, benefits, documents)
- ✅ User management and statistics
- ✅ Benefits and announcements management
- ✅ Document type management
- ✅ Emergency response management
- ✅ System administration tools

## 🎨 Styling

The app uses TailwindCSS for styling with custom components:

### Custom Classes
- `.btn` - Button base styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-outline` - Outline button
- `.input` - Form input styles
- `.card` - Card container
- `.sidebar-item` - Sidebar navigation items

### Color Palette
- Primary: Blue shades (600-800)
- Secondary: Gray shades (100-900)
- Status colors for different states

## 📱 Responsive Design

- Mobile-first approach
- Hamburger menu for mobile navigation
- Responsive grid layouts
- Touch-friendly interface

## 🔧 Configuration

### Vite Configuration
- Development server on port 3000
- Proxy to backend API on port 5000
- Hot module replacement

### TypeScript
- Strict type checking
- React JSX transform
- Path mapping for imports

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Structure

```tsx
// Component structure
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const { data, loading, error } = useQuery('key', fetchFunction)
  
  // Event handlers
  const handleClick = () => {
    // Handle click
  }
  
  // Render
  return (
    <div className="container">
      {/* JSX content */}
    </div>
  )
}
```

## 📦 Dependencies

### Core Framework
- React 18.3.1 - UI library
- React DOM 18.3.1 - DOM rendering
- React Router DOM 6.30.1 - Client-side routing
- TypeScript 5.9.2 - Type safety

### UI & Styling
- TailwindCSS 3.4.17 - Utility-first CSS framework
- Lucide React 0.279.0 - Icon library
- React Hot Toast 2.6.0 - Toast notifications
- clsx 2.1.1 - Conditional className utility

### Data & Forms
- @tanstack/react-query 4.40.1 - Data fetching and caching
- React Hook Form 7.62.0 - Form management
- Axios 1.11.0 - HTTP client

### Development Tools
- Vite 4.5.14 - Build tool and dev server
- ESLint 8.57.1 - Code linting
- Autoprefixer 10.4.21 - CSS vendor prefixes
- PostCSS 8.5.6 - CSS processing

## 🎯 Features Implemented

### ✅ Complete Systems
- **Authentication**: Login, registration, email verification, role-based access
- **User Management**: Profile management, file uploads, location selection
- **Community Marketplace**: Item sharing, borrowing, request management
- **Benefits System**: Application workflow, admin approval
- **Announcements**: Priority-based updates, pinning, categorization
- **Document Services**: Request workflow, QR verification, PDF generation
- **Emergency Systems**: SOS requests, relocation management
- **Admin Dashboard**: Real-time statistics, comprehensive management
- **Responsive Design**: Mobile-first approach with excellent UX

### 🔧 Technical Features
- **State Management**: React Context with proper error handling
- **Form Handling**: React Hook Form with validation
- **Data Fetching**: React Query with caching and error states
- **File Uploads**: Multipart form data handling
- **Error Boundaries**: Graceful error handling
- **Loading States**: Proper loading indicators
- **Toast Notifications**: User feedback system
- **Responsive Design**: Mobile and desktop optimized
