import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { UserX, Plus, Calendar, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

export const TeacherAbsencePage: React.FC = () => {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [absenceDate, setAbsenceDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [reason, setReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceDate || !reason) {
      setErrorMsg('Please select an absence date and state your reason.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.submitAbsence({
        absence_date: absenceDate,
        start_time: startTime,
        end_time: endTime,
        reason,
      });
      setSuccessMsg(`Absence request submitted successfully! ${res.replacementOutcome?.affectedLecturesCount || 0} lecture(s) identified for replacement analysis.`);
      setReason('');
      setAbsenceDate('');
      loadAbsences();
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f5132' }}>Teacher Absence & Leave Request</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Submit planned or emergency leave. The automated engine evaluates qualified substitute instructors and routes recommendations to the Head of Department.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Submit Absence Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UserX size={20} color="#0f5132" />
              <span>Submit Leave Application</span>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Date of Absence</label>
              <input
                type="date"
                className="form-control"
                value={absenceDate}
                onChange={e => setAbsenceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">Reason for Absence</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Attending International Conference on AI / Medical Emergency"
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              <Send size={16} />
              <span>{submitting ? 'Submitting & Running Replacement Engine...' : 'Submit Absence Application'}</span>
            </button>
          </form>
        </div>

        {/* Existing Requests History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={20} color="#0f5132" />
              <span>My Absence Applications & Substitutes</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>Loading requests...</div>
          ) : absences.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              No absence applications submitted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {absences.map(a => (
                <div key={a.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0f5132', fontSize: '0.9rem' }}>{a.absence_date}</span>
                    <span className={`badge ${a.status === 'approved' ? 'badge-active' : 'badge-lab'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '6px' }}>{a.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Period: {a.start_time} - {a.end_time} &bull; Processed: {a.processed_at ? new Date(a.processed_at).toLocaleDateString() : 'Pending Review'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
