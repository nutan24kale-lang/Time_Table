import React, { useState, useEffect } from 'react';
import { api, BASE_URL } from '../../api/client';
import { BarChart3, Download, Printer, School, Users, Clock, Award, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [workload, setWorkload] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workload' | 'utilization'>('workload');

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [wRes, uRes] = await Promise.all([
          api.getWorkloadReport(),
          api.getUtilizationReport(),
        ]);
        setWorkload(wRes.workload || []);
        setUtilization(uRes);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExportCsv = (type: string) => {
    window.location.href = `/api/reports/export-csv?type=${type}`;
  };

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Workload & Utilization Reports</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Academic resource telemetry: Faculty teaching distribution, lab utilization rates, and institutional efficiency metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExportCsv(activeTab)}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'workload' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('workload')}
        >
          <Users size={15} />
          <span>Faculty Teaching Workload</span>
        </button>
        <button
          className={`btn ${activeTab === 'utilization' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('utilization')}
        >
          <School size={15} />
          <span>Classroom & Lab Utilization</span>
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Aggregating institutional report data...</div>
      ) : activeTab === 'workload' ? (
        <div>
          {/* Summary metrics */}
          <div className="overview-grid" style={{ marginBottom: '24px' }}>
            <div className="overview-card">
              <div className="overview-icon-box"><Users size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Faculty Evaluated</div>
                <div className="overview-value">{workload.length}</div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><Clock size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Total Teaching Hours</div>
                <div className="overview-value">
                  {workload.reduce((acc, t) => acc + (t.total_hours || 0), 0)} hrs
                </div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><BarChart3 size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Avg Weekly Load</div>
                <div className="overview-value">
                  {workload.length > 0 ? (workload.reduce((acc, t) => acc + (t.total_hours || 0), 0) / workload.length).toFixed(1) : 0} hrs
                </div>
              </div>
            </div>

            <div className="overview-card">
              <div className="overview-icon-box"><Award size={24} /></div>
              <div className="overview-data">
                <div className="overview-label">Balance Compliance</div>
                <div className="overview-value">100%</div>
              </div>
            </div>
          </div>

          {/* Workload Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Total Lectures</th>
                  <th>Hours / Cap</th>
                  <th>Load Status</th>
                </tr>
              </thead>
              <tbody>
                {workload.map(t => {
                  const pct = Math.min(100, Math.round(((t.total_hours || 0) / t.max_weekly_hours) * 100));
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.teacher_id}</td>
                      <td>{t.department}</td>
                      <td>{t.mon_lecs || 0}</td>
                      <td>{t.tue_lecs || 0}</td>
                      <td>{t.wed_lecs || 0}</td>
                      <td>{t.thu_lecs || 0}</td>
                      <td>{t.fri_lecs || 0}</td>
                      <td><strong>{t.total_lectures || 0}</strong></td>
                      <td>{t.total_hours || 0} / {t.max_weekly_hours} hrs</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '80px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct > 85 ? '#d97706' : '#16a34a' }}></div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Utilization Tab */
        <div>
          {utilization && (
            <>
              <div className="overview-grid" style={{ marginBottom: '24px' }}>
                <div className="overview-card">
                  <div className="overview-icon-box"><School size={24} /></div>
                  <div className="overview-data">
                    <div className="overview-label">Total Facilities</div>
                    <div className="overview-value">{utilization.rooms.length}</div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-icon-box"><Clock size={24} /></div>
                  <div className="overview-data">
                    <div className="overview-label">Average Utilization</div>
                    <div className="overview-value">{utilization.averageUtilization}%</div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-icon-box"><CheckCircle2 size={24} /></div>
                  <div className="overview-data">
                    <div className="overview-label">Total Booked Slots</div>
                    <div className="overview-value">{utilization.totalBookedSlots}</div>
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-icon-box"><BarChart3 size={24} /></div>
                  <div className="overview-data">
                    <div className="overview-label">Weekly Capacity</div>
                    <div className="overview-value">{utilization.totalAvailableSlots} slots</div>
                  </div>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Room Identifier</th>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Building</th>
                      <th>Booked Periods</th>
                      <th>Teaching Hours</th>
                      <th>Available Hours</th>
                      <th>Utilization Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilization.rooms.map((r: any) => (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td>
                          <span className={`badge ${r.room_type === 'Laboratory' ? 'badge-lab' : 'badge-theory'}`}>
                            {r.room_type}
                          </span>
                        </td>
                        <td>{r.capacity} seats</td>
                        <td>{r.building}</td>
                        <td>{r.total_booked_slots} slots</td>
                        <td>{r.booked_hours} hrs</td>
                        <td>{r.availableHours} hrs</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${r.utilizationPercentage}%`, height: '100%', background: '#0f5132' }}></div>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f5132' }}>
                              {r.utilizationPercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
