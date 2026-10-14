import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Notices & Notifications Center</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Official announcements, published timetable revisions, substitute faculty alerts, and class bulletins.
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAll}>
            <CheckCircle2 size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>Loading notification feed...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            No notifications in your inbox.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${n.is_read ? '#e2e8f0' : '#86efac'}`,
                  background: n.is_read ? '#ffffff' : '#f0fdf4',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: n.type === 'urgent' ? '#fee2e2' : n.type === 'warning' ? '#fef3c7' : '#dcfce7',
                      color: n.type === 'urgent' ? '#dc2626' : n.type === 'warning' ? '#b45309' : '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {n.type === 'urgent' ? <AlertTriangle size={18} /> : <Bell size={18} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.95rem' }}>{n.title}</span>
                      {!n.is_read && (
                        <span style={{ fontSize: '0.65rem', background: '#16a34a', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{n.message}</p>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
