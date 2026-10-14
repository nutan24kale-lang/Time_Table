import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Carousel } from '../../components/Carousel';
import {
  BookOpen,
  Users,
  School,
  CalendarCheck,
  PlusCircle,
  UserCheck,
  Cpu,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Network,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<{
    totalSubjects: number;
    totalTeachers: number;
    totalClassrooms: number;
    timetableStatus: string;
  }>({
    totalSubjects: 0,
    totalTeachers: 0,
    totalClassrooms: 0,
    timetableStatus: 'Draft',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        const res = await api.getAdminOverview();
        setStats({
          totalSubjects: res.totalSubjects,
          totalTeachers: res.totalTeachers,
          totalClassrooms: res.totalClassrooms,
          timetableStatus: res.timetableStatus,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  return (
    <div>
      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* ----------------------------------------------------
          SECTION 5: EXACT FOUR OVERVIEW CARDS
          ---------------------------------------------------- */}
      <div className="overview-grid">
        {/* Card 1: Total Subjects */}
        <div className="overview-card" onClick={() => navigate('/admin/subjects')} style={{ cursor: 'pointer' }}>
          <div className="overview-icon-box">
            <BookOpen size={26} />
          </div>
          <div className="overview-data">
            <div className="overview-label">Total Subjects</div>
            <div className="overview-value">{loading ? '...' : stats.totalSubjects}</div>
          </div>
        </div>

        {/* Card 2: Total Teachers */}
        <div className="overview-card" onClick={() => navigate('/admin/teachers')} style={{ cursor: 'pointer' }}>
          <div className="overview-icon-box">
            <Users size={26} />
          </div>
          <div className="overview-data">
            <div className="overview-label">Total Teachers</div>
            <div className="overview-value">{loading ? '...' : stats.totalTeachers}</div>
          </div>
        </div>

        {/* Card 3: Total Classrooms/Labs */}
        <div className="overview-card" onClick={() => navigate('/admin/classrooms')} style={{ cursor: 'pointer' }}>
          <div className="overview-icon-box">
            <School size={26} />
          </div>
          <div className="overview-data">
            <div className="overview-label">Total Classrooms/Labs</div>
            <div className="overview-value">{loading ? '...' : stats.totalClassrooms}</div>
          </div>
        </div>

        {/* Card 4: Timetable Status */}
        <div className="overview-card" onClick={() => navigate('/admin/view-timetable')} style={{ cursor: 'pointer' }}>
          <div className="overview-icon-box">
            <CalendarCheck size={26} />
          </div>
          <div className="overview-data">
            <div className="overview-label">Timetable Status</div>
            <div>
              <span className={`overview-badge ${stats.timetableStatus === 'Published' ? 'published' : 'draft'}`}>
                {loading ? '...' : stats.timetableStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          SECTION 5: EXACT FOUR QUICK ACTION BUTTONS
          ---------------------------------------------------- */}
      <section className="quick-actions-section">
        <h2 className="quick-actions-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {/* Action 1: Add Subject */}
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/subjects?action=add')}
          >
            <div className="quick-action-icon">
              <PlusCircle size={20} />
            </div>
            <span>Add Subject</span>
          </button>

          {/* Action 2: Manage Teachers */}
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/teachers')}
          >
            <div className="quick-action-icon">
              <UserCheck size={20} />
            </div>
            <span>Manage Teachers</span>
          </button>

          {/* Action 3: Generate Timetable */}
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/generator')}
          >
            <div className="quick-action-icon">
              <Cpu size={20} />
            </div>
            <span>Generate Timetable</span>
          </button>

          {/* Action 4: View Timetable */}
          <button
            className="quick-action-btn"
            onClick={() => navigate('/admin/view-timetable')}
          >
            <div className="quick-action-icon">
              <Calendar size={20} />
            </div>
            <span>View Timetable</span>
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------
          SECTION 6: FOUR-IMAGE AUTOMATIC CAROUSEL
          ---------------------------------------------------- */}
      <Carousel />

      {/* ----------------------------------------------------
          SECTION 5: ABOUT SMART TIMETABLE SCHEDULER SECTION
          ---------------------------------------------------- */}
      <section className="about-section">
        <div className="about-header">
          <Network size={28} color="#0f5132" />
          <h2 className="about-title">About Smart Timetable Scheduler</h2>
        </div>
        <p className="about-paragraph">
          Smart Timetable Scheduler is an automated academic timetable optimization system engineered for collegiate institutions.
          The platform models academic scheduling requirements through Graph Theory, constructing a comprehensive Adjacency Matrix
          where lecture requirements form vertices and simultaneous resource constraints—such as instructor availability, room occupancy,
          and student batch schedules—form conflict edges. Utilizing the Welsh-Powell Greedy Graph Coloring algorithm alongside
          multi-constraint satisfaction validation, the system guarantees conflict-free lecture allocations, dynamic teacher absence
          handling with automated substitute ranking, alternative slot recovery, and optimal classroom and laboratory capacity utilization.
        </p>

        <div className="about-highlights">
          <span className="about-pill">
            <CheckCircle2 size={14} color="#16a34a" /> Graph Theory Formulation
          </span>
          <span className="about-pill">
            <CheckCircle2 size={14} color="#16a34a" /> N×N Adjacency Matrix Analysis
          </span>
          <span className="about-pill">
            <CheckCircle2 size={14} color="#16a34a" /> Welsh-Powell Graph Coloring
          </span>
          <span className="about-pill">
            <CheckCircle2 size={14} color="#16a34a" /> Automated Substitute Ranking
          </span>
          <span className="about-pill">
            <CheckCircle2 size={14} color="#16a34a" /> Laboratory Capacity Optimization
          </span>
        </div>
      </section>
    </div>
  );
};
