import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SubjectsPage } from './pages/admin/SubjectsPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { ClassroomsPage } from './pages/admin/ClassroomsPage';
import { ClassroomAvailabilityPage } from './pages/admin/ClassroomAvailabilityPage';
import { GeneratorPage } from './pages/admin/GeneratorPage';
import { ViewTimetablePage } from './pages/admin/ViewTimetablePage';
import { AbsenceManagementPage } from './pages/admin/AbsenceManagementPage';
import { GraphAnalysisPage } from './pages/admin/GraphAnalysisPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { VersionHistoryPage } from './pages/admin/VersionHistoryPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { MyTimetablePage } from './pages/teacher/MyTimetablePage';
import { TeacherGraphPage } from './pages/teacher/TeacherGraphPage';
import { TeacherAbsencePage } from './pages/teacher/TeacherAbsencePage';
import { TeacherScheduleChangesPage } from './pages/teacher/TeacherScheduleChangesPage';
import { TeacherWorkloadPage } from './pages/teacher/TeacherWorkloadPage';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentTimetablePage } from './pages/student/StudentTimetablePage';
import { StudentGraphPage } from './pages/student/StudentGraphPage';
import { StudentClassroomInfoPage } from './pages/student/StudentClassroomInfoPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Shared Pages
import { NotificationsPage } from './pages/NotificationsPage';
import { DocumentationPage } from './pages/DocumentationPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f5132', color: 'white', fontSize: '1.2rem', fontWeight: 600 }}>
        Loading Smart Timetable Scheduler...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective authorized home
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  // Derive page title from pathname
  const getPageTitle = (path: string) => {
    if (path.includes('dashboard')) return 'Academic Dashboard';
    if (path.includes('subjects')) return 'Subject Management';
    if (path.includes('teachers')) return 'Faculty Management';
    if (path.includes('classrooms')) return 'Classrooms & Labs';
    if (path.includes('generator')) return 'Timetable Generator';
    if (path.includes('view-timetable') || path.includes('my-timetable')) return 'Weekly Timetable';
    if (path.includes('absences') || path.includes('absence')) return 'Teacher Absence & Substitution';
    if (path.includes('graph')) return 'Graph & Conflict Visualizations';
    if (path.includes('availability')) return 'Classroom Availability Grid';
    if (path.includes('reports') || path.includes('workload')) return 'Workload & Utilization Reports';
    if (path.includes('version-history')) return 'Version History & Audit Log';
    if (path.includes('settings')) return 'Institutional Settings';
    if (path.includes('schedule-changes')) return 'Schedule Adjustments';
    if (path.includes('classroom-info')) return 'Classroom Information';
    if (path.includes('notifications')) return 'Notices & Bulletins';
    if (path.includes('profile')) return 'Academic Profile';
    if (path.includes('docs')) return 'Project Academic Documentation';
    return 'Smart Timetable Scheduler';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Topbar
          title={getPageTitle(location.pathname)}
          subtitle="Smart Timetable Scheduler — Final Year AIDS"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect based on role */}
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <RoleRedirect />
              </ProtectedLayout>
            }
          />

          {/* Academic Project Documentation */}
          <Route
            path="/docs"
            element={
              <ProtectedLayout>
                <DocumentationPage />
              </ProtectedLayout>
            }
          />

          {/* ---------------- ADMIN ROUTES ---------------- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <SubjectsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <TeachersPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/classrooms"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <ClassroomsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/generator"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <GeneratorPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/view-timetable"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <ViewTimetablePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/absences"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <AbsenceManagementPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/graph-analysis"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <GraphAnalysisPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/availability"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <ClassroomAvailabilityPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/version-history"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <VersionHistoryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedLayout allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedLayout>
            }
          />

          {/* ---------------- TEACHER ROUTES ---------------- */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/my-timetable"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <MyTimetablePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/graph-visualizations"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherGraphPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/absence"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherAbsencePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/schedule-changes"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherScheduleChangesPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/classroom-availability"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <ClassroomAvailabilityPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/my-workload"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherWorkloadPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/notifications"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <NotificationsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedLayout allowedRoles={['teacher']}>
                <TeacherProfilePage />
              </ProtectedLayout>
            }
          />

          {/* ---------------- STUDENT ROUTES ---------------- */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/student/my-timetable"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <StudentTimetablePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/student/graph-visualizations"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <StudentGraphPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/student/classroom-info"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <StudentClassroomInfoPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <NotificationsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedLayout allowedRoles={['student']}>
                <StudentProfilePage />
              </ProtectedLayout>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default App;
