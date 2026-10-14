import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Users, Plus, Search, Edit, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, X, Award, Clock } from 'lucide-react';

export const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    department: 'AIDS',
    qualifications: '',
    max_weekly_hours: 20,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.getTeachers();
      setTeachers(res.teachers || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      teacher_id: '',
      name: '',
      email: '',
      department: 'AIDS',
      qualifications: '',
      max_weekly_hours: 20,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTeacher(t);
    setFormData({
      teacher_id: t.teacher_id,
      name: t.name,
      email: t.email,
      department: t.department,
      qualifications: t.qualifications,
      max_weekly_hours: t.max_weekly_hours,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    try {
      if (editingTeacher) {
        await api.updateTeacher(editingTeacher.id, formData);
        setSuccessMsg(`Teacher ${formData.name} updated successfully.`);
      } else {
        await api.createTeacher(formData);
        setSuccessMsg(`Teacher ${formData.name} registered successfully.`);
      }
      setShowModal(false);
      loadTeachers();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleToggleStatus = async (t: any) => {
    try {
      const res = await api.toggleTeacherStatus(t.id);
      setSuccessMsg(res.message);
      loadTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.teacher_id.toLowerCase().includes(search.toLowerCase()) ||
    t.qualifications.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Teacher Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Manage faculty profiles, academic credentials, teaching workload capacities, and availability.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ maxWidth: '400px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by name, ID, or qualifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Faculty Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Qualified Specializations</th>
              <th>Workload Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>Loading faculty members...</td></tr>
            ) : filteredTeachers.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No faculty records found.</td></tr>
            ) : (
              filteredTeachers.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.teacher_id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                  </td>
                  <td>{t.email}</td>
                  <td>{t.department}</td>
                  <td style={{ maxWidth: '240px', fontSize: '0.85rem', color: '#334155' }}>{t.qualifications}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#16a34a" />
                      <span>{t.scheduled_hours || 0} / {t.max_weekly_hours} hrs/wk</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Faculty Details"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className={`btn ${t.status === 'active' ? 'btn-secondary' : 'btn-success'} btn-sm`}
                        onClick={() => handleToggleStatus(t)}
                        title={t.status === 'active' ? 'Deactivate Teacher' : 'Activate Teacher'}
                      >
                        {t.status === 'active' ? <ToggleRight size={16} color="#16a34a" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Faculty Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingTeacher ? 'Edit Faculty Member' : 'Register New Faculty'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                    {formError}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Unique Teacher ID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TCH107"
                      value={formData.teacher_id}
                      onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                      required
                      disabled={!!editingTeacher}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Faculty Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. Robert Vance"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. vance@college.edu"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Department</label>
                    <select
                      className="form-control"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      required
                    >
                      <option value="AIDS">AIDS (Artificial Intelligence & Data Science)</option>
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label required">Qualified Subjects / Specializations</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Data Structures, Cloud Computing, Operating Systems"
                    value={formData.qualifications}
                    onChange={e => setFormData({ ...formData, qualifications: e.target.value })}
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    Used by the Welsh-Powell engine and the Absence Replacement algorithm to match qualified substitute instructors.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label required">Max Weekly Teaching Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    className="form-control"
                    value={formData.max_weekly_hours}
                    onChange={e => setFormData({ ...formData, max_weekly_hours: parseInt(e.target.value, 10) || 20 })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? 'Update Faculty Details' : 'Register Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
