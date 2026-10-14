import React, { useState } from 'react';
import { Settings, Shield, Database, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [collegeName, setCollegeName] = useState('Imperial Institute of Technology');
  const [department, setDepartment] = useState('Department of AIDS (Artificial Intelligence & Data Science)');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>System Settings & Institutional Parameters</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Configure institution branding, academic calendar settings, and algorithmic scheduling thresholds.
        </p>
      </div>

      {saved && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>System parameters updated successfully.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Settings size={20} color="#0f5132" />
              <span>Institutional Information</span>
            </div>
          </div>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label required">College / University Name</label>
              <input
                type="text"
                className="form-control"
                value={collegeName}
                onChange={e => setCollegeName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Engineering Department</label>
              <input
                type="text"
                className="form-control"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Current Academic Year</label>
              <input
                type="text"
                className="form-control"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Save size={16} />
              <span>Save Institutional Settings</span>
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={20} color="#0f5132" />
              <span>Database & Algorithm Configuration</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <strong>Primary Database:</strong> SQLite Embedded (`timetable.sqlite`)
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>ACID Compliant &bull; Shared Multi-User Persistent Storage</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <strong>Optimization Algorithm:</strong> Welsh-Powell Greedy Graph Coloring
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Vertex Degree Sorting: O(V log V) &bull; Adjacency Matrix: O(V²)</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <strong>Operating Time Slots:</strong> 09:00 - 16:00 (6 periods / day)
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Break: 11:00-11:15 &bull; Lunch: 01:15-02:00 PM &bull; Mon to Fri</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px' }}>
              <strong>Role-Based Access:</strong> Admin, Teacher, Student
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>Cryptographic JWT verification & server-side role enforcement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
