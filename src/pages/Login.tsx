import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Calendar, Lock, Mail, Eye, EyeOff, Shield, Award, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else if (user.role === 'student') navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'teacher' | 'student') => {
    setError(null);
    setLoading(true);
    try {
      const user = await quickLogin(role);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else if (user.role === 'student') navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #092617 0%, #0f5132 50%, #14532d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Logo and Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#0f5132',
              color: '#86efac',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 10px 20px rgba(15, 81, 50, 0.3)',
            }}
          >
            <Calendar size={36} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f5132', marginBottom: '4px' }}>
            Smart Timetable Scheduler
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.4 }}>
            Final Year AIDS (Artificial Intelligence & Data Science) Project &bull; Automated Conflict-Free Scheduling Powered by Welsh-Powell Graph Coloring
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Institutional Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type="email"
                className="form-control"
                style={{ paddingLeft: '42px' }}
                placeholder="e.g. admin@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label required" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                placeholder="Enter account password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Quick Demo Examiner Section */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Instant Evaluation Logins
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', padding: '10px 6px', gap: '4px', fontSize: '0.75rem' }}
              onClick={() => handleQuickLogin('admin')}
              disabled={loading}
            >
              <Shield size={16} color="#0f5132" />
              <span>Admin (HOD)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', padding: '10px 6px', gap: '4px', fontSize: '0.75rem' }}
              onClick={() => handleQuickLogin('teacher')}
              disabled={loading}
            >
              <Award size={16} color="#1d4ed8" />
              <span>Teacher (Sharma)</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', flexDirection: 'column', padding: '10px 6px', gap: '4px', fontSize: '0.75rem' }}
              onClick={() => handleQuickLogin('student')}
              disabled={loading}
            >
              <GraduationCap size={16} color="#a21caf" />
              <span>Student (Sem 4A)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-overlay" onClick={() => setForgotModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div className="modal-title">Reset Password</div>
              <button onClick={() => setForgotModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div className="modal-body">
              {forgotMsg ? (
                <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '10px', fontSize: '0.88rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <CheckCircle2 size={24} />
                  <span>{forgotMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
                    Enter your registered college email. We will send a secure password reset token.
                  </p>
                  <div className="form-group">
                    <label className="form-label required">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Send Reset Link
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
