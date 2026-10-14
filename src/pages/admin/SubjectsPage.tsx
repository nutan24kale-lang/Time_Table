import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { BookOpen, Plus, Search, Filter, Edit, Trash2, Archive, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const location = useLocation();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any | null>(null);

  // Form state - EXACT 10 FIELDS
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: 'AIDS',
    semester: '4th',
    section: 'Section A',
    teacher_id: '',
    classroom_id: '',
    subject_type: 'Theory',
    lectures_per_week: 3,
    duration_per_lecture: 60,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // If URL has ?action=add, trigger modal
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add') {
      setShowAddModal(true);
    }
  }, [location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, tchsRes, roomsRes] = await Promise.all([
        api.getSubjects(),
        api.getTeachers(),
        api.getClassrooms(),
      ]);
      setSubjects(subsRes.subjects || []);
      setTeachers((tchsRes.teachers || []).filter((t: any) => t.status === 'active'));
      setClassrooms((roomsRes.classrooms || []).filter((r: any) => r.status === 'active'));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      department: 'AIDS',
      semester: '4th',
      section: 'Section A',
      teacher_id: teachers[0]?.id ? String(teachers[0].id) : '',
      classroom_id: classrooms[0]?.id ? String(classrooms[0].id) : '',
      subject_type: 'Theory',
      lectures_per_week: 3,
      duration_per_lecture: 60,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      code: sub.code,
      department: sub.department,
      semester: sub.semester,
      section: sub.section,
      teacher_id: String(sub.teacher_id),
      classroom_id: String(sub.classroom_id),
      subject_type: sub.subject_type,
      lectures_per_week: sub.lectures_per_week,
      duration_per_lecture: sub.duration_per_lecture,
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, formData);
        setSuccessMsg(`Subject ${formData.code} updated successfully.`);
      } else {
        await api.createSubject(formData);
        setSuccessMsg(`Subject ${formData.code} created successfully.`);
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (sub: any) => {
    if (!window.confirm(`Are you sure you want to delete / archive ${sub.code}: ${sub.name}?`)) return;
    try {
      const res = await api.deleteSubject(sub.id);
      setSuccessMsg(res.message);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject.');
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.code.toLowerCase().includes(search.toLowerCase());
    const matchesSem = !selectedSemester || s.semester === selectedSemester;
    const matchesSec = !selectedSection || s.section === selectedSection;
    return matchesSearch && matchesSem && matchesSec;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Subject Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Configure and maintain curriculum subjects, faculty assignments, and classroom allocations.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Subject</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Search Subject / Code</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by name or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter Semester</label>
            <select
              className="form-control"
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => (
                <option key={sem} value={sem}>{sem} Semester</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter Section</label>
            <select
              className="form-control"
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
            >
              <option value="">All Sections</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Subject Name</th>
              <th>Dept / Sem</th>
              <th>Section</th>
              <th>Type</th>
              <th>Assigned Teacher</th>
              <th>Room / Lab</th>
              <th>Lecs/Wk</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px' }}>Loading subjects from database...</td></tr>
            ) : filteredSubjects.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No matching subjects found.</td></tr>
            ) : (
              filteredSubjects.map(sub => (
                <tr key={sub.id}>
                  <td><strong>{sub.code}</strong></td>
                  <td>{sub.name}</td>
                  <td>{sub.department} &bull; {sub.semester}</td>
                  <td><span className="badge badge-active">{sub.section}</span></td>
                  <td>
                    <span className={`badge ${sub.subject_type === 'Practical/Lab' ? 'badge-lab' : 'badge-theory'}`}>
                      {sub.subject_type}
                    </span>
                  </td>
                  <td>{sub.teacher_name || 'Unassigned'}</td>
                  <td>{sub.classroom_name}</td>
                  <td>{sub.lectures_per_week}</td>
                  <td>{sub.duration_per_lecture} mins</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(sub)}
                        title="Edit Subject"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(sub)}
                        title="Delete or Archive Subject"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT SUBJECT MODAL (EXACT 10 FIELDS) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
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

                {/* Field 1: Subject Name */}
                <div className="form-group">
                  <label className="form-label required">1. Subject Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  {/* Field 2: Subject Code */}
                  <div className="form-group">
                    <label className="form-label required">2. Subject Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CS401"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  {/* Field 3: Department */}
                  <div className="form-group">
                    <label className="form-label required">3. Department</label>
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

                <div className="form-row">
                  {/* Field 4: Semester */}
                  <div className="form-group">
                    <label className="form-label required">4. Semester</label>
                    <select
                      className="form-control"
                      value={formData.semester}
                      onChange={e => setFormData({ ...formData, semester: e.target.value })}
                      required
                    >
                      {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map(sem => (
                        <option key={sem} value={sem}>{sem} Semester</option>
                      ))}
                    </select>
                  </div>

                  {/* Field 5: Section (Section A and Section B only) */}
                  <div className="form-group">
                    <label className="form-label required">5. Section</label>
                    <select
                      className="form-control"
                      value={formData.section}
                      onChange={e => setFormData({ ...formData, section: e.target.value })}
                      required
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  {/* Field 6: Assigned Teacher */}
                  <div className="form-group">
                    <label className="form-label required">6. Assigned Teacher</label>
                    <select
                      className="form-control"
                      value={formData.teacher_id}
                      onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                      required
                    >
                      <option value="">Select Qualified Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.teacher_id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Field 7: Classroom/Lab */}
                  <div className="form-group">
                    <label className="form-label required">7. Classroom/Lab</label>
                    <select
                      className="form-control"
                      value={formData.classroom_id}
                      onChange={e => setFormData({ ...formData, classroom_id: e.target.value })}
                      required
                    >
                      <option value="">Select Room / Laboratory</option>
                      {classrooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.room_type} &bull; Cap: {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  {/* Field 8: Subject Type (Theory or Practical/Lab) */}
                  <div className="form-group">
                    <label className="form-label required">8. Subject Type</label>
                    <select
                      className="form-control"
                      value={formData.subject_type}
                      onChange={e => {
                        const newType = e.target.value;
                        setFormData({
                          ...formData,
                          subject_type: newType,
                          duration_per_lecture: newType === 'Practical/Lab' ? 120 : 60,
                        });
                      }}
                      required
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical/Lab">Practical/Lab</option>
                    </select>
                  </div>

                  {/* Field 9: Lectures per Week */}
                  <div className="form-group">
                    <label className="form-label required">9. Lectures per Week</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="form-control"
                      value={formData.lectures_per_week}
                      onChange={e => setFormData({ ...formData, lectures_per_week: parseInt(e.target.value, 10) || 1 })}
                      required
                    />
                  </div>
                </div>

                {/* Field 10: Duration per Lecture */}
                <div className="form-group">
                  <label className="form-label required">10. Duration per Lecture (minutes)</label>
                  <select
                    className="form-control"
                    value={formData.duration_per_lecture}
                    onChange={e => setFormData({ ...formData, duration_per_lecture: parseInt(e.target.value, 10) })}
                    required
                  >
                    <option value={60}>60 Minutes (Standard Theory)</option>
                    <option value={120}>120 Minutes (2-Hour Laboratory Block)</option>
                    <option value={90}>90 Minutes (Special Session)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Update Subject' : 'Save Subject to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
