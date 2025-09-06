import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleBasedRedirect } from './components/RoleBasedRedirect'
import { PublicLayout } from './layouts/PublicLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AdminLayout } from './layouts/AdminLayout'

// Public Pages
import { HomePage } from './pages/public/HomePage'
import { MarketplacePage } from './pages/public/MarketplacePage'
import { BenefitsPage } from './pages/public/BenefitsPage'
import { AnnouncementsPage } from './pages/public/AnnouncementsPage'
import { CertificatesPage } from './pages/public/CertificatesPage'
import DocumentVerification from './pages/public/DocumentVerification'
import { AboutPage } from './pages/public/AboutPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { EmailVerificationPage } from './pages/auth/EmailVerificationPage'
import { ResendVerificationPage } from './pages/auth/ResendVerificationPage'

// Resident Pages
import { ResidentDashboard } from './pages/resident/Dashboard'
import { ResidentUserProfile } from './pages/resident/UserProfile'
import { CommunityItems } from './pages/resident/CommunityItems'
import { MyRequests } from './pages/resident/MyRequests'
import { CreateRequest } from './pages/resident/CreateRequest'
import { AddItem } from './pages/resident/AddItem'
import { Benefits } from './pages/resident/Benefits'
import { Certificates } from './pages/resident/Certificates'
import { Announcements } from './pages/resident/Announcements'
import { SOSRelocation } from './pages/resident/SOSRelocation'

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard'
import { Verifications } from './pages/admin/Verifications'
import { RequestManagement } from './pages/admin/RequestManagement'
import { ManageUsers } from './pages/admin/ManageUsers'
import { AdminManagement } from './pages/admin/AdminManagement'
import { PendingItems } from './pages/admin/PendingItems'
import { BenefitsManagementWrapper } from './pages/admin/BenefitsManagementWrapper'
import { BenefitApplications } from './pages/admin/BenefitApplications'
import { AnnouncementsManagement } from './pages/admin/AnnouncementsManagement'
import { BenefitsApplication } from './pages/resident/BenefitsApplication'
import DocumentRequests from './pages/resident/DocumentRequests'
import { AdminDocumentRequests } from './pages/admin/DocumentRequests'
import DocumentManagement from './pages/admin/DocumentManagement'
import { AdminSOSRelocation } from './pages/admin/SOSRelocation'
import { AdminProfile } from './pages/admin/Profile'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<RoleBasedRedirect><HomePage /></RoleBasedRedirect>} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="benefits" element={<BenefitsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="verify" element={<DocumentVerification />} />
          <Route path="verify-document/:code" element={<DocumentVerification />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify/:token" element={<EmailVerificationPage />} />
          <Route path="resend-verification" element={<ResendVerificationPage />} />
        </Route>

        {/* Resident Routes */}
        <Route path="/resident" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ResidentDashboard />} />
          <Route path="profile" element={<ResidentUserProfile />} />
          <Route path="community-items" element={<CommunityItems />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="create-request" element={<CreateRequest />} />
          <Route path="add-item" element={<AddItem />} />
          <Route path="benefits" element={<Benefits />} />
          <Route path="benefits/apply" element={<BenefitsApplication />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="document-requests" element={<DocumentRequests />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="sos-relocation" element={<SOSRelocation />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="verifications" element={<Verifications />} />
          <Route path="request-management" element={<RequestManagement />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="pending-items" element={<PendingItems />} />
          <Route path="benefits" element={
            <ErrorBoundary>
              <BenefitsManagementWrapper />
            </ErrorBoundary>
          } />
          <Route path="benefit-applications" element={<BenefitApplications />} />
          <Route path="announcements" element={
            <ErrorBoundary>
              <AnnouncementsManagement />
            </ErrorBoundary>
          } />
          <Route path="document-requests" element={<AdminDocumentRequests />} />
          <Route path="document-management" element={<DocumentManagement />} />
          <Route path="sos-relocation" element={<AdminSOSRelocation />} />
          <Route path="profile" element={
            <ErrorBoundary>
              <AdminProfile />
            </ErrorBoundary>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
