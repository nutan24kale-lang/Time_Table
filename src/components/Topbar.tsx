import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Bell, Menu, CheckCircle2, Shield, GraduationCap, Award, RefreshCw, X } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, onToggleSidebar }) => {
  const { user, quickLogin } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await api.getNotifications();
        if (res && res.notifications) {
          setNotifications(res.notifications);
        }
      } catch (err) {
        // silent fail on topbar poll
      }
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button className="icon-button" onClick={onToggleSidebar} title="Toggle Navigation">
            <Menu size={20} />
          </button>
        )}
        <div className="topbar-title-wrapper">
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        {/* Academic Role Badge */}
        <div className={`role-badge ${user.role}`}>
          {user.role === 'admin' && <Shield size={14} />}
          {user.role === 'teacher' && <Award size={14} />}
          {user.role === 'student' && <GraduationCap size={14} />}
          <span>{user.role} Portal</span>
        </div>

        {/* Quick Role Switcher for Academic Presentation */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            title="Switch authenticated role for project demo"
          >
            <RefreshCw size={14} />
            <span>Switch Role</span>
          </button>

          {showRoleSwitcher && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 60,
                width: '210px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', padding: '6px 8px', textTransform: 'uppercase' }}>
                Examiner Demo Switcher
              </div>
              <button
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: user.role === 'admin' ? '#dcfce7' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#0f5132', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => { setShowRoleSwitcher(false); quickLogin('admin'); }}
              >
                <Shield size={16} /> Admin (HOD)
              </button>
              <button
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: user.role === 'teacher' ? '#eff6ff' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => { setShowRoleSwitcher(false); quickLogin('teacher'); }}
              >
                <Award size={16} /> Teacher (Dr. Sharma)
              </button>
              <button
                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: user.role === 'student' ? '#fdf4ff' : 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#a21caf', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => { setShowRoleSwitcher(false); quickLogin('student'); }}
              >
                <GraduationCap size={16} /> Student (Sem 4A)
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-button"
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>

          {showNotifDrawer && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                width: '360px',
                maxHeight: '440px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '14px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f5132' }}>Notifications ({unreadCount} new)</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: '#16a34a', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifDrawer(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No notifications at this time
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 18px',
                        borderBottom: '1px solid #f1f5f9',
                        background: n.is_read ? '#ffffff' : '#f0fdf4',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: n.type === 'urgent' ? '#dc2626' : '#0f5132' }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
