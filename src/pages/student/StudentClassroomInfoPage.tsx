import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { School, MapPin, Users, Cpu } from 'lucide-react';

export const StudentClassroomInfoPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRooms() {
      try {
        setLoading(true);
        const res = await api.getClassrooms();
        setClassrooms((res.classrooms || []).filter((r: any) => r.status === 'active'));
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRooms();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Classroom & Laboratory Directory</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Campus room directory, student seating capacity, and laboratory computing infrastructure details.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading classroom information...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {classrooms.map(r => (
            <div key={r.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className={`badge ${r.room_type === 'Laboratory' ? 'badge-lab' : 'badge-theory'}`}>
                  {r.room_type}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                  Cap: {r.capacity} seats
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f5132', marginBottom: '4px' }}>{r.name}</h3>
              <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                <MapPin size={13} /> {r.building} &bull; {r.department}
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#334155' }}>
                <strong>Infrastructure:</strong> {r.equipment || 'Standard lecture equipment, projector, and audio-visual podium.'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
