import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  LayoutDashboard,
  BookOpen,
  Users,
  School,
  Cpu,
  CalendarCheck,
  UserX,
  Share2,
  DoorOpen,
  BarChart3,
  History,
  Settings,
  LogOut,
  Bell,
  UserCircle,
  FileText,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav items strictly matching Section 7 of the Master Prompt
  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Manage Teachers', path: '/admin/teachers', icon: Users },
    { label: 'Classroom & Lab Management', path: '/admin/classrooms', icon: School },
    { label: 'Timetable Generator', path: '/admin/generator', icon: Cpu },
    { label: 'View Timetable', path: '/admin/view-timetable', icon: CalendarCheck },
    { label: 'Teacher Absence & Replacement', path: '/admin/absences', icon: UserX },
    { label: 'Graph & Conflict Analysis', path: '/admin/graph-analysis', icon: Share2 },
    { label: 'Classroom & Lab Availability', path: '/admin/availability', icon: DoorOpen },
    { label: 'Workload & Utilization Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Timetable Version History', path: '/admin/version-history', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const teacherNav = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Timetable', path: '/teacher/my-timetable', icon: CalendarCheck },
    { label: 'Graph Visualizations', path: '/teacher/graph-visualizations', icon: Share2 },
    { label: 'Teacher Absence', path: '/teacher/absence', icon: UserX },
    { label: 'Schedule Changes', path: '/teacher/schedule-changes', icon: Clock },
    { label: 'Classroom Availability', path: '/teacher/classroom-availability', icon: DoorOpen },
    { label: 'My Workload Report', path: '/teacher/my-workload', icon: BarChart3 },
    { label: 'Notifications', path: '/teacher/notifications', icon: Bell },
    { label: 'My Profile', path: '/teacher/profile', icon: UserCircle },
  ];

  const studentNav = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Timetable', path: '/student/my-timetable', icon: CalendarCheck },
    { label: 'Graph Visualizations', path: '/student/graph-visualizations', icon: Share2 },
    { label: 'Classroom Information', path: '/student/classroom-info', icon: School },
    { label: 'Notices & Notifications', path: '/student/notifications', icon: Bell },
    { label: 'My Profile', path: '/student/profile', icon: UserCircle },
  ];

  let currentNav = adminNav;
  if (user.role === 'teacher') currentNav = teacherNav;
  if (user.role === 'student') currentNav = studentNav;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Calendar size={22} />
        </div>
        <div>
          <div className="sidebar-title">Smart Timetable</div>
          <div className="sidebar-subtitle">Scheduler</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {currentNav.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ marginTop: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
        >
          <LogOut className="nav-item-icon" />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user.name.charAt(0)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
