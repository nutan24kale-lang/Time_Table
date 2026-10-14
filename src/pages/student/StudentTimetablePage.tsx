import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { TimetableGrid } from '../../components/TimetableGrid';

export const StudentTimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimetable() {
      try {
        setLoading(true);
        const res = await api.getActiveTimetable();
        setEntries(res.entries || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTimetable();
  }, []);

  return (
    <div>
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Class Timetable Schedule</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Official published timetable for {user?.department} — Semester {user?.semester || '4th'} ({user?.section || 'Section A'}). Read-only student view.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading class timetable...</div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No published timetable entries found for your class.
        </div>
      ) : (
        <TimetableGrid
          entries={entries}
          title={`Class Schedule: ${user?.department} Sem ${user?.semester} (${user?.section})`}
          scope={`${user?.department} / Semester ${user?.semester} / ${user?.section}`}
          statusBadge="Official Published"
          versionNumber="1.0"
        />
      )}
    </div>
  );
};
