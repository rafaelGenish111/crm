import { Routes, Route, Navigate } from 'react-router-dom'
import { BusinessConfigProvider } from './context/BusinessConfigContext'
import { AuthProvider } from './context/AuthContext'
import { StudentAuthProvider } from './context/StudentAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import StudentProtectedRoute from './components/StudentProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import HomePage from './pages/HomePage'
import BusinessConfig from './pages/Admin/BusinessConfig'
import UsersManagement from './pages/Admin/UsersManagement'
import StaffManagement from './pages/Admin/StaffManagement'
import LeadsList from './pages/Leads/LeadsList'
import CustomersList from './pages/Customers/CustomersList'
import CustomerProfile from './pages/Customers/CustomerProfile'
import CoursesList from './pages/Courses/CoursesList'
import WorkshopsList from './pages/Workshops/WorkshopsList'
import AccountingDashboard from './pages/Accounting/Dashboard'
import Reports from './pages/Accounting/Reports'
import InvoicesByCustomers from './pages/Accounting/InvoicesByCustomers'
import CustomersWithDebts from './pages/Accounting/CustomersWithDebts'
import CampaignsList from './pages/Campaigns/CampaignsList'
import CampaignBuilder from './pages/Campaigns/CampaignBuilder'
import CampaignAnalytics from './pages/Campaigns/CampaignAnalytics'
import CourseDetails from './pages/Courses/CourseDetails'
import WorkshopDetails from './pages/Workshops/WorkshopDetails'
import LeadInteractions from './pages/Leads/LeadInteractions'
import Attendance from './pages/Courses/Attendance'
import PaymentPage from './pages/Payment/PaymentPage'
import StudentLoginPage from './pages/Student/StudentLoginPage'
import StudentDashboard from './pages/Student/StudentDashboard'
import StudentCoursesPage from './pages/Student/StudentCoursesPage'
import StudentCourseDetails from './pages/Student/StudentCourseDetails'
import StudentGradesPage from './pages/Student/StudentGradesPage'
import StudentWorkshopsPage from './pages/Student/StudentWorkshopsPage'
import StudentProfilePage from './pages/Student/StudentProfilePage'
import ChangePasswordPage from './pages/Student/ChangePasswordPage'
import AIBotChat from './pages/Student/AIBotChat'
import KnowledgeBaseManagement from './pages/Admin/KnowledgeBaseManagement'
import EventsList from './pages/Events/EventsList'
import EventDetails from './pages/Events/EventDetails'

function App() {
  return (
    <AuthProvider>
      <StudentAuthProvider>
        <BusinessConfigProvider>
          <div className="min-h-screen" dir="rtl">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Student routes */}
              <Route path="/student/login" element={<StudentLoginPage />} />
              <Route
                path="/student"
                element={
                  <StudentProtectedRoute>
                    <StudentDashboard />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/courses"
                element={
                  <StudentProtectedRoute>
                    <StudentCoursesPage />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/courses/:id"
                element={
                  <StudentProtectedRoute>
                    <StudentCourseDetails />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/grades"
                element={
                  <StudentProtectedRoute>
                    <StudentGradesPage />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/workshops"
                element={
                  <StudentProtectedRoute>
                    <StudentWorkshopsPage />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <StudentProtectedRoute>
                    <StudentProfilePage />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/change-password"
                element={
                  <StudentProtectedRoute>
                    <ChangePasswordPage />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/ai-bot"
                element={
                  <StudentProtectedRoute>
                    <AIBotChat />
                  </StudentProtectedRoute>
                }
              />
              <Route
                path="/student/ai-bot/course/:courseId"
                element={
                  <StudentProtectedRoute>
                    <AIBotChat />
                  </StudentProtectedRoute>
                }
              />

              {/* Protected routes */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/knowledge-base"
                element={
                  <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                    <KnowledgeBaseManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/config"
                element={
                  <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                    <BusinessConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/staff"
                element={
                  <ProtectedRoute requiredRoles={['super_admin', 'admin', 'admin_staff']}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <LeadsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <CustomersList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers/:id"
                element={
                  <ProtectedRoute>
                    <CustomerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <ProtectedRoute>
                    <CoursesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:id"
                element={
                  <ProtectedRoute>
                    <CourseDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:courseId/attendance"
                element={
                  <ProtectedRoute>
                    <Attendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:paymentId"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workshops"
                element={
                  <ProtectedRoute>
                    <WorkshopsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workshops/:id"
                element={
                  <ProtectedRoute>
                    <WorkshopDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads/:id/interactions"
                element={
                  <ProtectedRoute>
                    <LeadInteractions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting"
                element={
                  <ProtectedRoute>
                    <AccountingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/invoices"
                element={
                  <ProtectedRoute>
                    <InvoicesByCustomers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/accounting/debts"
                element={
                  <ProtectedRoute>
                    <CustomersWithDebts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <CampaignsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/new"
                element={
                  <ProtectedRoute>
                    <CampaignBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/:id/edit"
                element={
                  <ProtectedRoute>
                    <CampaignBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/:id/analytics"
                element={
                  <ProtectedRoute>
                    <CampaignAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventsList />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/home" replace />} />
            </Routes>
          </div>
        </BusinessConfigProvider>
      </StudentAuthProvider>
    </AuthProvider>
  )
}

export default App
