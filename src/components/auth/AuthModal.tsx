import React, { useState } from 'react';
import { Mail, Lock, User, Phone, X, LogIn, UserPlus, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, signup, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

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
        if (!formData.name || !formData.email || !formData.phone || !formData.password) {
          setError('All fields are required');
          setIsSubmitting(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsSubmitting(false);
          return;
        }
        await signup(formData.name, formData.email, formData.phone, formData.password);
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
            {mode === 'login' && 'Sign In to Reach Out Nigeria'}
            {mode === 'signup' && 'Create Soul Winner Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h3>
          <p className="modal-subtitle">
            {mode === 'login' && 'Access your account and record soul-winning activity.'}
            {mode === 'signup' && 'Register as a Soul Winner for the campaign.'}
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
