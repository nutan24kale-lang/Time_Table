import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { TimetableGrid } from '../../components/TimetableGrid';
import { Calendar, Filter, Printer, Download, Eye, CheckCircle2 } from 'lucide-react';

export const ViewTimetablePage: React.FC = () => {
  const [department, setDepartment] = useState('AIDS');
  const [semester, setSemester] = useState('4th');
  const [section, setSection] = useState('Section A');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.getActiveTimetable({ department, semester, section });
      setEntries(res.entries || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [department, semester, section]);

  return (
    <div>
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>View Official Timetables</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Inspect published academic timetables, verified conflict-free status, substitute teacher updates, and printable schedules.
        </p>
      </div>

      {/* Scope Filter Bar */}
      <div className="card no-print" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Department</label>
            <select
              className="form-control"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="AIDS">AIDS (Artificial Intelligence & Data Science)</option>
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
            </select>
          </div>

          <div>
            <label className="form-label">Semester</label>
            <select
              className="form-control"
              value={semester}
              onChange={e => setSemester(e.target.value)}
            >
              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(s => (
                <option key={s} value={s}>{s} Semester</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Section</label>
            <select
              className="form-control"
              value={section}
              onChange={e => setSection(e.target.value)}
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading timetable...</div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No published timetable entries found for {department} Semester {semester} ({section}).
        </div>
      ) : (
        <TimetableGrid
          entries={entries}
          title={`${department} — Semester ${semester} (${section})`}
          scope={`${department} / Semester ${semester} / ${section}`}
          statusBadge={entries[0]?.timetable_status || 'Published'}
          versionNumber={entries[0]?.timetable_version || 1}
        />
      )}
    </div>
  );
};
