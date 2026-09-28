import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Clock, Tv } from 'lucide-react';
import { FlipCounterDisplay } from './FlipCounterDisplay';
import { UpwardRaceVisualization } from './UpwardRaceVisualization';
import { BigScreenDisplayModal } from './BigScreenDisplayModal';
import { subscribeToNationalCounter, type ZonalCounterData } from '../../services/counterService';
import { useEventConfig } from '../../hooks/useEventConfig';

interface PublicHomeViewProps {
  onNavigate?: (tab: 'home' | 'record' | 'account' | 'org' | 'race' | 'about') => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const PublicHomeView: React.FC<PublicHomeViewProps> = () => {
  const { eventConfig, isUpcoming, isLive, isCompleted, countdown } = useEventConfig();
  const [isDisplayModeOpen, setIsDisplayModeOpen] = useState<boolean>(false);

  const [counterData, setCounterData] = useState<ZonalCounterData>({
    totalSoulsWon: 0,
    zonalTarget: eventConfig.target,
    nationalTarget: eventConfig.target,
    percentageAchieved: 0,
    groupCompetitors: [],
    groupProgresses: [],
  });

  useEffect(() => {
    const unsubscribe = subscribeToNationalCounter(
      eventConfig.target,
      (data) => setCounterData(data)
    );
    return () => unsubscribe();
  }, [eventConfig.target]);

  return (
    <div className="public-home-container">
      {/* EVENT IDENTITY SUBHEADER */}
      <div className="event-date-row">
        <div className="date-tag-left">
          <Sparkles size={16} className="text-green-accent" />
          <span>REACH OUT NIGERIA • 1 OCTOBER CAMPAIGN</span>
        </div>

        <button
          type="button"
          onClick={() => setIsDisplayModeOpen(true)}
          className="display-mode-trigger-btn"
          title="Open Big-Screen / TV Display Mode"
        >
          <Tv size={15} />
          <span>BIG SCREEN MODE</span>
        </button>
      </div>

      {/* DOMINANT DIGITAL LED COUNTER HERO */}
      <section className="counter-hero-section">
        <div className="counter-hero-header">
          <h2 className="souls-won-label">
            {isCompleted ? 'FINAL ZONAL SOULS WON' : 'ZONAL SOULS WON'}
          </h2>

          <div className="live-status-pill">
            {isLive && (
              <span className="pill-status-text live-badge">
                <span className="live-dot" /> LIVE
              </span>
            )}
            {isCompleted && (
              <span className="pill-status-text completed-badge">
                <CheckCircle2 size={14} /> EVENT COMPLETED
              </span>
            )}
          </div>
        </div>

        {/* Digital 7-Segment Digit Counter */}
        <FlipCounterDisplay value={counterData.totalSoulsWon} />

        {/* Target & Percentage Readout */}
        <div className="target-readout-row">
          <div className="target-stat">
            <span className="stat-label">ZONAL TARGET</span>
            <span className="stat-value">{counterData.zonalTarget.toLocaleString()} SOULS</span>
          </div>

          <div className="target-divider" />

          <div className="target-stat">
            <span className="stat-label">
              {isCompleted ? 'FINAL % OF ZONAL TARGET' : '% OF ZONAL TARGET'}
            </span>
            <span className="stat-value stat-green">{counterData.percentageAchieved}%</span>
          </div>
        </div>

        {/* Minimal Progress Line */}
        <div className="zonal-progress-track">
          <div
            className="zonal-progress-fill"
            style={{ width: `${Math.min(100, counterData.percentageAchieved)}%` }}
          />
        </div>
      </section>

      {/* UPWARD RACE VISUALIZATION (BAR CHART VARIANT ON HOME SCREEN) */}
      <section className="upward-race-section">
        <UpwardRaceVisualization competitors={counterData.groupCompetitors} variant="barChart" />
      </section>

      {/* BIG SCREEN / TV DISPLAY MODE MODAL */}
      <BigScreenDisplayModal
        isOpen={isDisplayModeOpen}
        onClose={() => setIsDisplayModeOpen(false)}
        counterData={counterData}
        eventStatus={eventConfig.status}
      />
    </div>
  );
};
