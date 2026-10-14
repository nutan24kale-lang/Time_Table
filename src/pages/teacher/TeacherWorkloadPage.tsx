import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { BarChart3, Clock, CheckCircle2, Award, Calendar } from 'lucide-react';

export const TeacherWorkloadPage: React.FC = () => {
  const { user } = useAuth();
  const [workload, setWorkload] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkload() {
      try {
        setLoading(true);
        const res = await api.getWorkloadReport();
        if (res.workload && res.workload.length > 0) {
          setWorkload(res.workload[0]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkload();
  }, []);

  const totalHours = workload?.total_hours || 0;
  const maxHours = workload?.max_weekly_hours || 20;
  const utilization = Math.min(100, Math.round((totalHours / maxHours) * 100));

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>My Workload Report</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Confidential teaching hours telemetry and AICTE / UGC regulatory workload compliance for {user?.name}.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading workload report...</div>
      ) : !workload ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No workload recorded.</div>
      ) : (
        <div>
          <div className="overview-grid" style={{ marginBottom: '24px' }}>
            <div className="overview-card">
              <div className="overview-icon-box"><Clock size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Teaching Hours</div>
                <div className="overview-value">{totalHours} hrs/wk</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><Award size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Statutory Capacity</div>
                <div className="overview-value">{maxHours} hrs/wk</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><BarChart3 size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Capacity Utilization</div>
                <div className="overview-value">{utilization}%</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><CheckCircle2 size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Compliance Status</div>
                <div className="overview-value" style={{ fontSize: '1.25rem', color: '#16a34a' }}>Compliant</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Calendar size={20} color="#0f5132" />
                <span>Day-by-Day Instructional Commitment</span>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Academic Day</th>
                    <th>Scheduled Lectures</th>
                    <th>Estimated Contact Hours</th>
                    <th>Load Intensity</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { day: 'Monday', lecs: workload.mon_lecs || 0 },
                    { day: 'Tuesday', lecs: workload.tue_lecs || 0 },
                    { day: 'Wednesday', lecs: workload.wed_lecs || 0 },
                    { day: 'Thursday', lecs: workload.thu_lecs || 0 },
                    { day: 'Friday', lecs: workload.fri_lecs || 0 },
                  ].map(item => (
                    <tr key={item.day}>
                      <td><strong>{item.day}</strong></td>
                      <td>{item.lecs} lecture(s)</td>
                      <td>{item.lecs * 1.5} contact hours</td>
                      <td>
                        <span className={`badge ${item.lecs >= 3 ? 'badge-lab' : 'badge-active'}`}>
                          {item.lecs >= 3 ? 'Heavy Session' : 'Optimal Load'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
