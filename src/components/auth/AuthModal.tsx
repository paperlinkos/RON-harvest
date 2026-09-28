import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, X, LogIn, UserPlus, KeyRound, AlertCircle, Building, Church as ChurchIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getGroups, getChurches } from '../../services/organizationService';
import type { Group, Church } from '../../types/organization';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [groups, setGroups] = useState<Group[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    groupId: '',
    churchId: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, signup, resetPassword } = useAuth();

  useEffect(() => {
    if (isOpen && mode === 'signup') {
      const loadOrgs = async () => {
        try {
          const [gList, cList] = await Promise.all([getGroups(), getChurches()]);
          setGroups(gList);
          setChurches(cList);
        } catch (err) {
          console.warn('Error loading groups/churches for signup:', err);
        }
      };
      loadOrgs();
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      groupId: gId,
      churchId: '', // Reset church when group changes
    }));
    setError('');
  };

  const filteredChurches = churches.filter((c) => c.groupId === formData.groupId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          setError('Please enter your email and password');
          setIsSubmitting(false);
          return;
        }
        await login(formData.email, formData.password);
        onClose();
      } else if (mode === 'signup') {
        if (!formData.name || !formData.email || !formData.phone || !formData.groupId || !formData.churchId || !formData.password) {
          setError('All fields including Group and Church selection are required');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSubmitting(false);
          return;
        }
        await signup(
          formData.name,
          formData.email,
          formData.phone,
          formData.password,
          formData.groupId,
          formData.churchId
        );
        onClose();
      } else if (mode === 'reset') {
        if (!formData.email) {
          setError('Please enter your email address');
          setIsSubmitting(false);
          return;
        }
        await resetPassword(formData.email);
        setSuccessMsg('Password reset link sent to your email.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
        setError('Invalid email or password.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('An account with this email already exists.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button onClick={onClose} className="modal-close-btn" aria-label="Close">
          <X size={20} />
        </button>

        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'login' && 'Sign In to CEAZ1 Reachout Nigeria'}
            {mode === 'signup' && 'Create Soul Winner Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h3>
          <p className="modal-subtitle">
            {mode === 'login' && 'Access your account and record soul-winning activity.'}
            {mode === 'signup' && 'Select your Group & Church to activate your account immediately.'}
            {mode === 'reset' && 'We will send a reset link to your email.'}
          </p>
        </div>

        {error && (
          <div className="error-box">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && <div className="success-box">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate className="modal-form">
          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* DYNAMIC GROUP DROPDOWN */}
              <div className="form-group">
                <label className="form-label">Select Group</label>
                <div className="input-wrapper">
                  <Building size={18} className="input-icon" />
                  <select
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleGroupChange}
                    className="form-input"
                    disabled={isSubmitting}
                    style={{ paddingLeft: '40px', color: formData.groupId ? '#ffffff' : '#94a3b8', background: 'rgba(0,0,0,0.4)' }}
                  >
                    <option value="" style={{ background: '#0d1913', color: '#94a3b8' }}>-- Select Your Group --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id} style={{ background: '#0d1913', color: '#ffffff' }}>
                        {g.name} {g.code ? `(${g.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DYNAMIC CHURCH DROPDOWN (FILTERED BY SELECTED GROUP) */}
              <div className="form-group">
                <label className="form-label">Select Church</label>
                <div className="input-wrapper">
                  <ChurchIcon size={18} className="input-icon" />
                  <select
                    name="churchId"
                    value={formData.churchId}
                    onChange={handleChange}
                    className="form-input"
                    disabled={isSubmitting || !formData.groupId}
                    style={{ paddingLeft: '40px', color: formData.churchId ? '#ffffff' : '#94a3b8', background: 'rgba(0,0,0,0.4)' }}
                  >
                    <option value="" style={{ background: '#0d1913', color: '#94a3b8' }}>
                      {!formData.groupId
                        ? '-- Select Group First --'
                        : filteredChurches.length === 0
                        ? 'No churches available under this group'
                        : '-- Select Your Church --'}
                    </option>
                    {filteredChurches.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: '#0d1913', color: '#ffffff' }}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="form-input"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {mode === 'login' && <LogIn size={18} />}
            {mode === 'signup' && <UserPlus size={18} />}
            {mode === 'reset' && <KeyRound size={18} />}
            <span>
              {isSubmitting
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Register Account'
                : 'Send Reset Link'}
            </span>
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('signup')} className="text-link">
                Don't have an account? Sign Up
              </button>
              <button onClick={() => setMode('reset')} className="text-link">
                Forgot password?
              </button>
            </>
          )}

          {mode === 'signup' && (
            <button onClick={() => setMode('login')} className="text-link">
              Already have an account? Sign In
            </button>
          )}

          {mode === 'reset' && (
            <button onClick={() => setMode('login')} className="text-link">
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
