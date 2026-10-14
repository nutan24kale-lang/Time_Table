import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { History, RotateCcw, Eye, CheckCircle2, ShieldAlert, FileText, ArrowRight, User } from 'lucide-react';

export const VersionHistoryPage: React.FC = () => {
  const [versions, setVersions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'audit'>('versions');

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, aRes] = await Promise.all([
        api.getVersions(),
        api.getAuditLogs(),
      ]);
      setVersions(vRes.versions || []);
      setAuditLogs(aRes.logs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewVersion = async (v: any) => {
    try {
      const res = await api.getVersionDetails(v.id);
      setSelectedVersion(res.version);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRestore = async (v: any) => {
    if (!window.confirm(`Are you sure you want to restore Version ${v.version_number}? This will create a new validated active version.`)) return;

    try {
      setErrorMsg(null);
      const res = await api.restoreVersion(v.id);
      setSuccessMsg(res.message);
      setSelectedVersion(null);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Rollback failed.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Timetable Version History & Audit Trail</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Section 16 Institutional Governance: Trace published timetable revisions, compare snapshots, audit scheduling alterations, and safely rollback.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'versions' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('versions')}
        >
          <History size={15} />
          <span>Timetable Versions ({versions.length})</span>
        </button>
        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('audit')}
        >
          <FileText size={15} />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading version snapshots...</div>
      ) : activeTab === 'versions' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Title / Description</th>
                <th>Academic Scope</th>
                <th>Status</th>
                <th>Validation Integrity</th>
                <th>Modified By</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>No version history recorded yet.</td></tr>
              ) : (
                versions.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>
                        v{v.version_number}.0
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f5132' }}>{v.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{v.change_summary}</div>
                    </td>
                    <td>{v.scope}</td>
                    <td>
                      <span className={`overview-badge ${v.status.toLowerCase() === 'published' ? 'published' : 'draft'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} />
                        {v.validation_status}
                      </span>
                    </td>
                    <td>{v.created_by}</td>
                    <td>{new Date(v.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewVersion(v)}
                          title="View Snapshot Data"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRestore(v)}
                          title="Restore this version"
                        >
                          <RotateCcw size={14} />
                          <span>Restore</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Audit Trail */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Institutional Audit Event Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td><strong>{log.user_name}</strong></td>
                  <td>
                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: '#e2e8f0', fontWeight: 700, color: '#0f5132' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#334155' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Snapshot Details Modal */}
      {selectedVersion && (
        <div className="modal-overlay" onClick={() => setSelectedVersion(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div className="modal-title">Snapshot: Version {selectedVersion.version_number}.0</div>
              <button onClick={() => setSelectedVersion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p><strong>Title:</strong> {selectedVersion.title}</p>
                <p><strong>Scope:</strong> {selectedVersion.scope}</p>
                <p><strong>Recorded On:</strong> {new Date(selectedVersion.created_at).toLocaleString()}</p>
                <p><strong>Summary:</strong> {selectedVersion.change_summary}</p>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f5132', marginBottom: '10px' }}>
                  Snapshot Schedule Entries ({selectedVersion.data?.schedule?.length || selectedVersion.data?.entries?.length || 0} Lectures)
                </h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedVersion.data?.schedule || selectedVersion.data?.entries || []).map((e: any, idx: number) => (
                        <tr key={idx}>
                          <td>{e.dayOfWeek || e.day}</td>
                          <td>{e.startTime || e.start} - {e.endTime || e.end}</td>
                          <td><strong>{e.subjectCode || e.code}</strong></td>
                          <td>{e.teacherName || 'Assigned'}</td>
                          <td>{e.classroomName || 'Assigned'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedVersion(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => handleRestore(selectedVersion)}>
                <RotateCcw size={16} /> Restore as Active Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
