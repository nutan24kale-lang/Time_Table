import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { TimetableGrid } from '../../components/TimetableGrid';

export const MyTimetablePage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
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
    fetchTimetable();
  }, []);

  return (
    <div>
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>My Instructional Timetable</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Personalized weekly teaching roster for {user?.name}. Includes substituted and rescheduled sessions.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading teaching schedule...</div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No lectures assigned to your profile in the current published timetable.
        </div>
      ) : (
        <TimetableGrid
          entries={entries}
          title={`Faculty Teaching Schedule — ${user?.name}`}
          scope={`Faculty ID: ${user?.teacher_id || 'Faculty'} &bull; ${user?.department}`}
          statusBadge="Published Schedule"
          versionNumber="Current Term"
        />
      )}
    </div>
  );
};
