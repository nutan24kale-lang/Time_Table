import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  AlertCircle,
  Share2,
  CalendarCheck,
  UserX,
  CheckCircle2,
  Bell,
  ArrowRight,
  Award,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [ttRes, absRes] = await Promise.all([
          api.getActiveTimetable(),
          api.getAbsences(),
        ]);
        setEntries(ttRes.entries || []);
        setAbsences(absRes.absences || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Today's day name
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()];
  const todayEntries = entries.filter(e => e.day_of_week === (todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday' : todayName));
  const nextLecture = todayEntries.length > 0 ? todayEntries[0] : null;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Faculty Dashboard</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Welcome back, {user?.name}. Here is your active instructional schedule, next lecture notice, and leave status.
        </p>
      </div>

      {/* Next Lecture Alert Hero */}
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
              <Clock size={12} /> Next Scheduled Lecture
            </div>
            {nextLecture ? (
              <div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
                  {nextLecture.subject_name} ({nextLecture.subject_code})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.9rem', color: '#dcfce7', marginTop: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> {nextLecture.day_of_week} &bull; {nextLecture.start_time} - {nextLecture.end_time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} /> {nextLecture.classroom_name}
                  </span>
                  <span>Batch: {nextLecture.subject_dept} Sem {nextLecture.subject_sem} ({nextLecture.subject_sec})</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '1.1rem', color: '#dcfce7' }}>
                No more lectures scheduled for today. Enjoy your research and grading hours!
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/teacher/my-timetable')}
              style={{ background: '#ffffff', color: '#0f5132', border: 'none', fontWeight: 700 }}
            >
              <CalendarCheck size={16} /> View Full Timetable
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/teacher/graph-visualizations')}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Share2 size={16} /> View Conflict Graph
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="overview-grid" style={{ marginBottom: '28px' }}>
        <div className="overview-card">
          <div className="overview-icon-box"><BookOpen size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Weekly Lectures</div>
            <div className="overview-value">{entries.length}</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><Clock size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Teaching Hours</div>
            <div className="overview-value">
              {entries.reduce((acc, e) => acc + (e.duration_mins / 60), 0)} hrs
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><Calendar size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Lectures Today</div>
            <div className="overview-value">{todayEntries.length}</div>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-icon-box"><UserX size={24} /></div>
          <div className="overview-data">
            <div className="overview-label">Absence Requests</div>
            <div className="overview-value">{absences.length}</div>
          </div>
        </div>
      </div>

      {/* Today's Schedule List & Absence Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Today's Schedule Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <CalendarCheck size={20} color="#0f5132" />
              <span>Today's Classes ({todayName === 'Sunday' || todayName === 'Saturday' ? 'Monday Preview' : todayName})</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/teacher/my-timetable')}
            >
              Full Week
            </button>
          </div>

          {todayEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No classes scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayEntries.map(e => (
                <div
                  key={e.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f5132' }}>
                      {e.subject_code}: {e.subject_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '12px', marginTop: '2px' }}>
                      <span><Clock size={12} /> {e.start_time} - {e.end_time}</span>
                      <span><MapPin size={12} /> {e.classroom_name}</span>
                      <span>{e.subject_sec}</span>
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

        {/* Absence & Leave Requests Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UserX size={20} color="#0f5132" />
              <span>My Leave / Absence Requests</span>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/teacher/absence')}
            >
              New Request
            </button>
          </div>

          {absences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
              No absence requests logged. All scheduled lectures intact.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {absences.map(a => (
                <div
                  key={a.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.9rem' }}>
                      Absence on {a.absence_date}
                    </span>
                    <span className={`badge ${a.status === 'approved' ? 'badge-active' : 'badge-lab'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>{a.reason}</div>
                  {a.replacements && a.replacements.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      &bull; {a.replacements.length} lecture replacement(s) evaluated
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
