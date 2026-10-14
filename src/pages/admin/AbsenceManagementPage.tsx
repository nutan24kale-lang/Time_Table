import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  UserX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const AbsenceManagementPage: React.FC = () => {
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAbsences = async () => {
    try {
      setLoading(true);
      const res = await api.getAbsences();
      setAbsences(res.absences || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAbsences();
  }, []);

  const handleApproveAbsence = async (id: number) => {
    try {
      setErrorMsg(null);
      const res = await api.approveAbsence(id);
      setSuccessMsg(res.message);
      loadAbsences();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleApproveReplacement = async (replacementId: number, teacherId?: number) => {
    try {
      setErrorMsg(null);
      const res = await api.approveReplacement(replacementId, { assigned_teacher_id: teacherId });
      setSuccessMsg(res.message);
      loadAbsences();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Teacher Absence & Replacement Workflow</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Section 13 Decision Pipeline: Automated substitute matching, qualification scoring, alternate slot recovery, and administrative approval.
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

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Loading absences and replacement pipelines...</div>
      ) : absences.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          No teacher absence requests logged.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {absences.map(abs => {
            const isApproved = abs.status === 'approved';
            return (
              <div key={abs.id} className="card" style={{ padding: '24px' }}>
                {/* Absence Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: isApproved ? '#dcfce7' : '#fef3c7', color: isApproved ? '#15803d' : '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserX size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f5132' }}>{abs.teacher_name} ({abs.teacher_code})</h3>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Date of Absence: <strong>{abs.absence_date}</strong> &bull; Period: {abs.start_time} - {abs.end_time} &bull; Dept: {abs.department}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${isApproved ? 'badge-active' : 'badge-lab'}`}>
                      {abs.status.toUpperCase()}
                    </span>

                    {!isApproved && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleApproveAbsence(abs.id)}
                      >
                        <ShieldCheck size={16} />
                        <span>Approve Leave & Run Replacement</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '0.88rem', color: '#334155' }}>
                  <strong>Stated Absence Reason:</strong> {abs.reason}
                </div>

                {/* Replacement Suggestions Pipeline */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f5132', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={18} />
                    <span>Affected Lectures & Substitute Suggestions</span>
                  </h4>

                  {abs.replacements && abs.replacements.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {abs.replacements.map((rep: any) => {
                        const isAssigned = rep.status === 'approved';
                        const isUnresolved = rep.status === 'unresolved';

                        return (
                          <div
                            key={rep.id}
                            style={{
                              border: `1.5px solid ${isAssigned ? '#86efac' : isUnresolved ? '#fca5a5' : '#cbd5e1'}`,
                              borderRadius: '10px',
                              padding: '16px',
                              background: isAssigned ? '#f0fdf4' : isUnresolved ? '#fef2f2' : '#ffffff',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 800, color: '#0f5132', fontSize: '0.95rem' }}>
                                  {rep.subject_code}: {rep.subject_name}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  ({rep.day_of_week} at {rep.start_time}-{rep.end_time} &bull; {rep.classroom_name})
                                </span>
                              </div>

                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '9999px',
                                  background: isAssigned ? '#dcfce7' : isUnresolved ? '#fee2e2' : '#eff6ff',
                                  color: isAssigned ? '#15803d' : isUnresolved ? '#dc2626' : '#1d4ed8',
                                }}
                              >
                                {isAssigned ? 'APPROVED REPLACEMENT' : isUnresolved ? 'UNRESOLVED' : 'SUGGESTED OPTION'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '10px' }}>
                              {rep.notes}
                            </div>

                            {/* Actions */}
                            {!isAssigned && !isUnresolved && (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {rep.suggested_teacher_id && (
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleApproveReplacement(rep.id, rep.suggested_teacher_id)}
                                  >
                                    <CheckCircle2 size={15} />
                                    <span>Approve Substitute: {rep.suggested_teacher_name}</span>
                                  </button>
                                )}
                                {rep.alternative_slot_day && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleApproveReplacement(rep.id)}
                                  >
                                    <Clock size={15} />
                                    <span>Approve Reschedule to {rep.alternative_slot_day} ({rep.alternative_slot_start})</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {isAssigned && (
                              <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle2 size={16} />
                                <span>
                                  Active in schedule: {rep.assigned_teacher_name || rep.suggested_teacher_name || 'Rescheduled Slot'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      No lectures affected or replacement engine pending approval.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
