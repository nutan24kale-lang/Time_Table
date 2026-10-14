import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, School, ShieldCheck } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Student Academic Profile</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Registered student enrollment profile, authorized semester batch, and class section.
        </p>
      </div>

      <div style={{ maxWidth: '650px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0f5132', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
              {user?.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f5132' }}>{user?.name}</h3>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Enrolled Student &bull; {user?.department}
              </div>
              <span className="badge badge-active" style={{ marginTop: '6px' }}>Enrolled & Active</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Student Email</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.email}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Department</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.department}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Current Semester</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.semester || '4th'} Semester</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Section</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.section || 'Section A'}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Authorization Scope</div>
              <div style={{ fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '4px' }}>
                Read-Only Access for {user?.department} Semester {user?.semester || '4th'} ({user?.section || 'Section A'}).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
