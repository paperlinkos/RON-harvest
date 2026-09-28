import React, { useState, useRef, useEffect } from 'react';
import { User, Phone, MapPin, Send, CheckCircle2, History, Lock } from 'lucide-react';
import type { FormSubmissionData } from '../types/record';
import type { SubmissionResult } from '../hooks/useSoulRecords';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import type { EventStatus } from '../config/eventConfig';

interface SoulRecordFormProps {
  onSubmit: (data: FormSubmissionData) => Promise<SubmissionResult>;
  isSubmitting: boolean;
  mySoulsWon?: number;
  onViewHistory?: () => void;
  eventStatus?: EventStatus;
}

const LOCATION_PRESETS = [
  'Wuse Market',
  'Gwarinpa',
  'Church',
  'Street outreach',
  'University',
  'Workplace',
  'Personal contact',
];

export const SoulRecordForm: React.FC<SoulRecordFormProps> = ({
  onSubmit,
  isSubmitting,
  mySoulsWon = 0,
  onViewHistory,
  eventStatus = 'live',
}) => {
  const { isOnline } = useNetworkStatus();

  const [formData, setFormData] = useState<FormSubmissionData>({
    name: '',
    phone: '',
    location: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successResult, setSuccessResult] = useState<{
    isOffline: boolean;
  } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!successResult) {
      nameInputRef.current?.focus();
    }
  }, [successResult]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSelectPreset = (preset: string) => {
    setFormData((prev) => ({ ...prev, location: preset }));
    if (errors.location) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.location;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSuccessResult(null);

    const result = await onSubmit(formData);

    if (result.success) {
      setSuccessResult({
        isOffline: result.isOfflineSubmitted,
      });
      setFormData({ name: '', phone: '', location: '' });
      setErrors({});
    } else if (result.errors) {
      setErrors(result.errors);
    }
  };

  const handleResetForNext = () => {
    setSuccessResult(null);
    setFormData({ name: '', phone: '', location: '' });
    setErrors({});
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  if (eventStatus === 'completed') {
    return (
      <div className="form-card rapid-record-card event-completed-card">
        <div className="completed-lock-badge">
          <Lock size={36} className="text-muted" />
        </div>
        <h2 className="form-title text-center">EVENT COMPLETED</h2>
        <p className="form-lead text-center">
          Soul recording for CEAZ1 Reachout Nigeria Soul Winning Campaign 2026 is now closed.
        </p>
        {mySoulsWon > 0 && (
          <div className="my-total-pill mx-auto">
            MY FINAL SOULS WON: <strong>{mySoulsWon}</strong>
          </div>
        )}
        {onViewHistory && (
          <div className="form-footer-link-row">
            <button
              type="button"
              onClick={onViewHistory}
              className="text-link-subtle"
            >
              <History size={15} />
              <span>View My Submissions</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (successResult) {
    return (
      <div className="form-card rapid-success-card" tabIndex={-1}>
        <div className="success-badge-glow">
          <CheckCircle2 size={48} className="success-icon" />
        </div>

        <h2 className="success-title">SOUL RECORDED</h2>
        <div className="success-count-plus">+1</div>

        {successResult.isOffline ? (
          <div className="offline-success-box">
            <span className="offline-badge-tag">SAVED LOCALLY</span>
            <p className="offline-subtext">WILL SYNC WHEN ONLINE</p>
          </div>
        ) : (
          <p className="success-subtext">Soul successfully added to campaign records.</p>
        )}

        {mySoulsWon > 0 && (
          <div className="my-total-pill">
            MY TOTAL SOULS WON: <strong>{mySoulsWon}</strong>
          </div>
        )}

        <div className="success-actions-row">
          <button
            type="button"
            onClick={handleResetForNext}
            className="submit-button fast-record-btn"
            autoFocus
          >
            RECORD ANOTHER
          </button>

          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="secondary-button view-history-btn"
            >
              <History size={16} />
              <span>MY SUBMISSIONS</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="form-card rapid-record-card">
      <div className="record-form-top-bar">
        <div className="form-header-clean">
          <h2 className="form-title">RECORD A SOUL</h2>
          {mySoulsWon > 0 && (
            <span className="personal-count-chip">MY SOULS: {mySoulsWon}</span>
          )}
        </div>

        {!isOnline && (
          <div className="network-indicator-badge">
            <span className="net-status net-offline">
              <span className="dot-offline">○</span> OFFLINE — SAVING LOCALLY
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="record-form">
        {/* 1. NAME FIELD */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            NAME
          </label>
          <div className="input-wrapper">
            <User size={18} className="input-icon" />
            <input
              id="name"
              ref={nameInputRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter name"
              disabled={isSubmitting}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  phoneInputRef.current?.focus();
                }
              }}
            />
          </div>
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* 2. PHONE NUMBER FIELD */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            PHONE NUMBER
          </label>
          <div className="input-wrapper">
            <Phone size={18} className="input-icon" />
            <input
              id="phone"
              ref={phoneInputRef}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              disabled={isSubmitting}
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  locationInputRef.current?.focus();
                }
              }}
            />
          </div>
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        {/* 3. LOCATION FIELD */}
        <div className="form-group">
          <label htmlFor="location" className="form-label">
            WHERE DID YOU MEET THEM?
          </label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <input
              id="location"
              ref={locationInputRef}
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Wuse Market, Gwarinpa, Church"
              disabled={isSubmitting}
              className={`form-input ${errors.location ? 'input-error' : ''}`}
            />
          </div>
          {errors.location && <span className="error-text">{errors.location}</span>}

          {/* QUICK PRESET PILLS */}
          <div className="location-presets-bar">
            <span className="preset-label">Quick location:</span>
            <div className="preset-chips">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className={`preset-chip ${
                    formData.location === preset ? 'chip-selected' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errors.general && <div className="general-error-box">{errors.general}</div>}

        {/* PRIMARY SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-button record-primary-btn"
        >
          <Send size={20} className={isSubmitting ? 'animate-pulse' : ''} />
          <span>{isSubmitting ? 'RECORDING...' : 'RECORD SOUL'}</span>
        </button>
      </form>

      {onViewHistory && (
        <div className="form-footer-link-row">
          <button
            type="button"
            onClick={onViewHistory}
            className="text-link-subtle"
          >
            <History size={15} />
            <span>View My Submissions</span>
          </button>
        </div>
      )}
    </div>
  );
};
