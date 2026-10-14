import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { DoorOpen, Filter, CheckCircle2, XCircle, Clock, MapPin, Search } from 'lucide-react';

export const ClassroomAvailabilityPage: React.FC = () => {
  const [gridData, setGridData] = useState<any[]>([]);
  const [collegeDays, setCollegeDays] = useState<string[]>([]);
  const [collegeSlots, setCollegeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedType) params.room_type = selectedType;
      if (selectedDay) params.day = selectedDay;
      if (selectedSlot !== '') params.slot_index = selectedSlot;
      if (selectedBuilding) params.building = selectedBuilding;

      const res = await api.getAvailability(params);
      setGridData(res.rooms || []);
      setCollegeDays(res.collegeDays || []);
      setCollegeSlots(res.collegeSlots || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [selectedType, selectedDay, selectedSlot, selectedBuilding]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Classroom & Lab Availability Grid</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Real-time weekly occupancy matrix across collegiate lecture halls, auditoriums, and computational laboratories.
        </p>
      </div>

      {/* Legend & Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #16a34a', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>STATUS: AVAILABLE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14532d' }}>Vacant for Scheduling</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #dc2626', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>STATUS: OCCUPIED</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>Lecture in Session</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '4px solid #64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>STATUS: UNAVAILABLE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>Maintenance / Inactive</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Facility Type</label>
            <select
              className="form-control"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
            >
              <option value="">All Facilities</option>
              <option value="Classroom">Classrooms Only</option>
              <option value="Laboratory">Laboratories Only</option>
            </select>
          </div>

          <div>
            <label className="form-label">Day of Week</label>
            <select
              className="form-control"
              value={selectedDay}
              onChange={e => setSelectedDay(e.target.value)}
            >
              <option value="">All Days (Mon-Fri)</option>
              {collegeDays.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Period / Time Slot</label>
            <select
              className="form-control"
              value={selectedSlot}
              onChange={e => setSelectedSlot(e.target.value)}
            >
              <option value="">All Periods (09:00 - 16:00)</option>
              {collegeSlots.map(s => (
                <option key={s.index} value={String(s.index)}>{s.start} - {s.end} ({s.label})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Campus Building</label>
            <select
              className="form-control"
              value={selectedBuilding}
              onChange={e => setSelectedBuilding(e.target.value)}
            >
              <option value="">All Buildings</option>
              <option value="Main Block">Main Academic Block</option>
              <option value="CS Block">Computer Science Block</option>
              <option value="Science Block">Science Block</option>
            </select>
          </div>
        </div>
      </div>

      {/* Availability Matrix Grid */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading availability data...</div>
      ) : gridData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No matching facilities found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {gridData.map(item => (
            <div key={item.room.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#0f5132', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DoorOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f5132' }}>{item.room.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {item.room.building} &bull; Capacity: {item.room.capacity} &bull; {item.room.equipment || 'Standard AV'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className={`badge ${item.room.room_type === 'Laboratory' ? 'badge-lab' : 'badge-theory'}`}>
                    {item.room.room_type}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a' }}>
                    {item.occupiedCount} slots occupied / {item.availableCount} available
                  </span>
                </div>
              </div>

              {/* Time slots pill grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px' }}>
                {item.schedule.map((slot: any, sIdx: number) => {
                  const isOccupied = slot.status === 'Occupied';
                  return (
                    <div
                      key={sIdx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: isOccupied ? '#fef2f2' : '#f0fdf4',
                        border: `1.5px solid ${isOccupied ? '#fecaca' : '#bbf7d0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                          {slot.day.substring(0, 3)} {slot.timeLabel.split(' ')[0]}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            background: isOccupied ? '#dc2626' : '#16a34a',
                            color: 'white',
                          }}
                        >
                          {slot.status}
                        </span>
                      </div>

                      {isOccupied && slot.booking ? (
                        <div style={{ marginTop: '2px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#991b1b' }}>
                            {slot.booking.subjectCode} ({slot.booking.section})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#7f1d1d' }}>
                            {slot.booking.teacherName}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '2px' }}>
                          Free for booking
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
