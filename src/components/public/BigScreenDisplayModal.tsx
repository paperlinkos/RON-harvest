import React, { useEffect } from 'react';
import { Minimize2, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { FlipCounterDisplay } from './FlipCounterDisplay';
import { UpwardRaceVisualization } from './UpwardRaceVisualization';
import type { ZonalCounterData } from '../../services/counterService';
import type { EventStatus } from '../../config/eventConfig';

interface BigScreenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  counterData: ZonalCounterData;
  eventStatus: EventStatus;
}

export const BigScreenDisplayModal: React.FC<BigScreenDisplayModalProps> = ({
  isOpen,
  onClose,
  counterData,
  eventStatus,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isUpcoming = eventStatus === 'upcoming';
  const isLive = eventStatus === 'live';
  const isCompleted = eventStatus === 'completed';

  return (
    <div className="big-screen-backdrop" role="dialog" aria-modal="true" aria-label="Big Screen Live Display Mode">
      <div className="big-screen-container">
        {/* TOP BAR / CONTROL BUTTONS */}
        <div className="big-screen-header">
          <div className="big-screen-brand">
            <Sparkles size={20} className="text-green-accent" />
            <span className="big-screen-brand-title">REACH OUT NIGERIA • LIVE CAMPAIGN DISPLAY</span>
          </div>

          <button
            onClick={onClose}
            className="big-screen-exit-btn"
            title="Exit Big Screen Mode (Esc)"
            aria-label="Exit Big Screen Mode"
          >
            <Minimize2 size={18} />
            <span>EXIT DISPLAY MODE</span>
          </button>
        </div>

        {/* HERO CONTENT AREA */}
        <div className="big-screen-hero">
          <h1 className="big-screen-title">REACH OUT NIGERIA</h1>
          <div className="big-screen-subtitle">ZONAL SOUL WINNING CAMPAIGN</div>

          {/* STATUS BADGE */}
          <div className="big-screen-status-row">
            {isUpcoming && (
              <span className="big-status-pill upcoming-badge">
                <Clock size={16} /> UPCOMING
              </span>
            )}
            {isLive && (
              <span className="big-status-pill live-badge">
                <span className="live-dot" /> LIVE EVENT
              </span>
            )}
            {isCompleted && (
              <span className="big-status-pill completed-badge">
                <CheckCircle2 size={16} /> CAMPAIGN COMPLETED
              </span>
            )}
          </div>

          {/* VERY LARGE LIVE FLIP COUNTER */}
          <div className="big-screen-counter-wrapper">
            <FlipCounterDisplay value={counterData.totalSoulsWon} />
          </div>

          {/* STATS READOUT */}
          <div className="big-screen-stats-grid">
            <div className="big-stat-box">
              <span className="big-stat-label">ZONAL TARGET</span>
              <span className="big-stat-number">{counterData.zonalTarget.toLocaleString()} SOULS</span>
            </div>

            <div className="big-stat-divider" />

            <div className="big-stat-box">
              <span className="big-stat-label">% OF ZONAL TARGET</span>
              <span className="big-stat-number text-green">{counterData.percentageAchieved}%</span>
            </div>
          </div>

          {/* PROGRESS FILL TRACK */}
          <div className="big-screen-progress-track">
            <div
              className="big-screen-progress-fill"
              style={{ width: `${Math.min(100, counterData.percentageAchieved)}%` }}
            />
          </div>
        </div>

        {/* UPWARD RACE BAR CHART VISUALIZATION (PROJECTOR / BIG SCREEN VIEW) */}
        <div className="big-screen-race-section">
          <UpwardRaceVisualization competitors={counterData.groupCompetitors} variant="barChart" />
        </div>
      </div>
    </div>
  );
};
