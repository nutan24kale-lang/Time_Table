import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Clock, CheckCircle2, UserCheck, Calendar, MapPin, AlertCircle } from 'lucide-react';

export const TeacherScheduleChangesPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChanges() {
      try {
        setLoading(true);
        const res = await api.getNotifications();
        // filter schedule notices
        setNotifications((res.notifications || []).filter((n: any) =>
          n.title.toLowerCase().includes('schedule') ||
          n.title.toLowerCase().includes('timetable') ||
          n.title.toLowerCase().includes('replacement') ||
          n.title.toLowerCase().includes('substitute')
        ));
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadChanges();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Schedule Changes & Substitution Notices</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Real-time log of administrative timetable adjustments, replacement teaching assignments, and rescheduled lecture slots.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} color="#0f5132" />
            <span>Official Schedule Adjustment Records</span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>Loading schedule changes...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            No recent schedule alterations or substitution notices.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: n.type === 'warning' ? '#fefce8' : '#f0fdf4',
                  border: `1px solid ${n.type === 'warning' ? '#fde047' : '#bbf7d0'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: n.type === 'warning' ? '#eab308' : '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <UserCheck size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.95rem' }}>{n.title}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
