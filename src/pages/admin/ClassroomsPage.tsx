import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { School, Plus, Search, Edit, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, X, Cpu } from 'lucide-react';

export const ClassroomsPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    room_type: 'Classroom',
    capacity: 70,
    building: 'Main Block',
    department: 'AIDS',
    equipment: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await api.getClassrooms();
      setClassrooms(res.classrooms || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      room_type: 'Classroom',
      capacity: 70,
      building: 'Main Block',
      department: 'AIDS',
      equipment: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (r: any) => {
    setEditingRoom(r);
    setFormData({
      name: r.name,
      room_type: r.room_type,
      capacity: r.capacity,
      building: r.building,
      department: r.department,
      equipment: r.equipment || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    try {
      if (editingRoom) {
        await api.updateClassroom(editingRoom.id, formData);
        setSuccessMsg(`Room ${formData.name} updated successfully.`);
      } else {
        await api.createClassroom(formData);
        setSuccessMsg(`Room ${formData.name} added successfully.`);
      }
      setShowModal(false);
      loadRooms();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleToggleStatus = async (r: any) => {
    try {
      const res = await api.toggleClassroomStatus(r.id);
      setSuccessMsg(res.message);
      loadRooms();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle room status.');
    }
  };

  const filteredRooms = classrooms.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.building.toLowerCase().includes(search.toLowerCase()) ||
                          (r.equipment && r.equipment.toLowerCase().includes(search.toLowerCase()));
    const matchesType = !typeFilter || r.room_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Classroom & Lab Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Configure theoretical lecture halls, specialized laboratories, seat capacities, and hardware infrastructure.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>Add Classroom / Lab</span>
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#14532d', padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} color="#15803d" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Search Room / Building / Equipment</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search rooms or hardware..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter Room Type</label>
            <select
              className="form-control"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All Types (Classroom & Lab)</option>
              <option value="Classroom">Classroom (Theory)</option>
              <option value="Laboratory">Laboratory (Practical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classrooms Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Room Identifier</th>
              <th>Facility Type</th>
              <th>Seating Capacity</th>
              <th>Building / Campus</th>
              <th>Equipped Infrastructure</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>Loading classrooms & labs...</td></tr>
            ) : filteredRooms.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No facilities found.</td></tr>
            ) : (
              filteredRooms.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>
                    <span className={`badge ${r.room_type === 'Laboratory' ? 'badge-lab' : 'badge-theory'}`}>
                      {r.room_type}
                    </span>
                  </td>
                  <td><strong>{r.capacity}</strong> students</td>
                  <td>{r.building}</td>
                  <td style={{ maxWidth: '280px', fontSize: '0.85rem', color: '#475569' }}>
                    {r.equipment || 'Standard classroom audio-visual'}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(r)}
                        title="Edit Facility"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className={`btn ${r.status === 'active' ? 'btn-secondary' : 'btn-success'} btn-sm`}
                        onClick={() => handleToggleStatus(r)}
                        title={r.status === 'active' ? 'Deactivate Room' : 'Activate Room'}
                      >
                        {r.status === 'active' ? <ToggleRight size={16} color="#16a34a" /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingRoom ? 'Edit Facility' : 'Add New Classroom / Lab'}</div>
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
                    <label className="form-label required">Room Name / Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Room 304 or AI Computing Lab"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Facility Type</label>
                    <select
                      className="form-control"
                      value={formData.room_type}
                      onChange={e => setFormData({ ...formData, room_type: e.target.value })}
                      required
                    >
                      <option value="Classroom">Classroom (Theory)</option>
                      <option value="Laboratory">Laboratory (Practical / Lab)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Student Capacity</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      className="form-control"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 60 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Building / Block</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. CS Block or Main Academic Block"
                      value={formData.building}
                      onChange={e => setFormData({ ...formData, building: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Lab Equipment / Hardware Specifications</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. 40 High-End Workstations, Cisco Switch Racks, Ubuntu & Windows Dual Boot"
                    value={formData.equipment}
                    onChange={e => setFormData({ ...formData, equipment: e.target.value })}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
                    Checked by the constraint satisfaction engine during Practical/Lab course assignment.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Update Room' : 'Save Room to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
