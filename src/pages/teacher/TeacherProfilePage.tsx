import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { UserCircle, Mail, School, Award, Clock, ShieldCheck } from 'lucide-react';

export const TeacherProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [teacherData, setTeacherData] = useState<any | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getTeachers();
        const me = (res.teachers || []).find((t: any) => t.teacher_id === user?.teacher_id || t.email === user?.email);
        setTeacherData(me);
      } catch (err: any) {
        console.error(err);
      }
    }
    loadProfile();
  }, [user]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Faculty Profile & Credentials</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Registered institutional faculty profile, assigned subjects, and teaching qualifications.
        </p>
      </div>

      <div style={{ maxWidth: '700px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#0f5132', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800 }}>
              {user?.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f5132' }}>{user?.name}</h3>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Faculty ID: <strong>{user?.teacher_id || 'TCH101'}</strong> &bull; {user?.department}
              </div>
              <span className="badge badge-active" style={{ marginTop: '6px' }}>Active Faculty Member</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Institutional Email</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.email}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Department</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.department}</div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Subject Specializations & Qualifications</div>
              <div style={{ fontWeight: 600, color: '#0f172a', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px' }}>
                {teacherData?.qualifications || 'Data Structures, Analysis of Algorithms, Head of Dept'}
              </div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>Workload Maximum</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{teacherData?.max_weekly_hours || 20} hours / week</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600 }}>System Authorization</div>
              <div style={{ fontWeight: 600, color: '#16a34a' }}>Teacher (Authenticated)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
