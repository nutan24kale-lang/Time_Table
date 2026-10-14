import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  CalendarCheck,
  Share2,
  CheckCircle2,
  GraduationCap,
  Bell,
  User,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ttRes, nRes] = await Promise.all([
          api.getActiveTimetable(),
          api.getNotifications(),
        ]);
        setEntries(ttRes.entries || []);
        setNotifications((nRes.notifications || []).filter((n: any) => n.target_role === 'student' || n.target_role === 'all'));
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()];
  const todayEntries = entries.filter(e => e.day_of_week === (todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday' : todayName));
  const nextLecture = todayEntries.length > 0 ? todayEntries[0] : null;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Student Academic Dashboard</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Welcome, {user?.name} &bull; {user?.department} (Semester {user?.semester || '4th'}, {user?.section || 'Section A'}).
        </p>
      </div>

      {/* Next Lecture Banner Hero */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #093320 0%, #0f5132 100%)',
          color: 'white',
          padding: '28px',
          marginBottom: '28px',
          border: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', background: 'rgba(255,255,255,0.15)', fontSize: '0.78rem', fontWeight: 700, color: '#86efac', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Clock size={12} /> Next Up Today
            </div>
            {nextLecture ? (
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                  {nextLecture.subject_name} ({nextLecture.subject_code})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.9rem', color: '#dcfce7', marginTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> {nextLecture.day_of_week} &bull; {nextLecture.start_time} - {nextLecture.end_time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} /> {nextLecture.replacement_teacher_name ? `${nextLecture.replacement_teacher_name} (Substitute)` : nextLecture.teacher_name}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> {nextLecture.classroom_name}
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '1.1rem', color: '#dcfce7' }}>
                All class lectures for today are finished. Review your coursework and lab reports!
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/student/my-timetable')}
              style={{ background: '#ffffff', color: '#0f5132', border: 'none', fontWeight: 700 }}
            >
              <CalendarCheck size={16} /> View Full Timetable
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/student/graph-visualizations')}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Share2 size={16} /> Graph Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="overview-grid" style={{ marginBottom: '28px' }}>
        <div className="overview-card">
          <div className="overview-icon-box"><BookOpen size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Weekly Lectures</div>
            <div className="overview-value">{entries.length}</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><CalendarCheck size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Timetable Status</div>
            <div>
              <span className="overview-badge published">Published (v1.0)</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><Clock size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Lectures Today</div>
            <div className="overview-value">{todayEntries.length}</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><Bell size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Official Notices</div>
            <div className="overview-value">{notifications.length}</div>
          </div>
        </div>
      </div>

      {/* Today's Schedule and Academic Notices */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={20} color="#0f5132" />
              <span>Today's Classes ({todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday Preview' : todayName})</span>
            </div>
          </div>

          {todayEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No scheduled classes today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayEntries.map(e => (
                <div
                  key={e.id}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f5132' }}>{e.subject_code}: {e.subject_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '14px', marginTop: '2px' }}>
                      <span><Clock size={12} /> {e.start_time} - {e.end_time}</span>
                      <span><User size={12} /> {e.replacement_teacher_name ? `${e.replacement_teacher_name} (Substitute)` : e.teacher_name}</span>
                      <span><MapPin size={12} /> {e.classroom_name}</span>
                    </div>
                  </div>
                  <span className={`badge ${e.subject_type === 'Practical/Lab' ? 'badge-lab' : 'badge-theory'}`}>
                    {e.subject_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Bell size={20} color="#0f5132" />
              <span>Timetable Notices & Bulletins</span>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No notices at this time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.88rem' }}>{n.title}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#334155' }}>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
