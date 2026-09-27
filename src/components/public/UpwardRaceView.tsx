import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Tv, Flame } from 'lucide-react';
import { UpwardRaceVisualization } from './UpwardRaceVisualization';
import { BigScreenDisplayModal } from './BigScreenDisplayModal';
import { subscribeToNationalCounter, type ZonalCounterData } from '../../services/counterService';
import { useEventConfig } from '../../hooks/useEventConfig';

export const UpwardRaceView: React.FC = () => {
  const { eventConfig } = useEventConfig();
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

  const competitors = counterData.groupCompetitors;

  return (
    <div className="public-home-container">
      {/* RACE HERO HEADER */}
      <div className="account-card dashboard-hero-card" style={{ background: 'linear-gradient(135deg, #071710 0%, #0d2a1d 100%)', color: '#ffffff', border: '1px solid rgba(0, 135, 81, 0.4)' }}>
        <div className="dashboard-hero-top">
          <div className="dashboard-hero-header">
            <div className="hero-badge" style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <Trophy size={14} />
              <span>LIVE CAMPAIGN COMPETITION</span>
            </div>
            <h2 className="dashboard-org-title" style={{ color: '#ffffff', fontSize: '2rem' }}>
              UPWARD RACE TO TARGET
            </h2>
            <p className="dashboard-org-subtitle" style={{ color: '#94a3b8' }}>
              Vertical progress tracking for Groups & Churches competing to hit their Reach Out Nigeria soul targets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsDisplayModeOpen(true)}
            className="submit-button"
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <Tv size={16} />
            <span>PROJECT ON TV / BIG SCREEN</span>
          </button>
        </div>

        {/* RACE SUMMARY METRICS */}
        <div className="dashboard-stats-grid" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="dash-stat-box">
            <span className="stat-label" style={{ color: '#94a3b8' }}>ZONAL SOULS WON</span>
            <span className="stat-value" style={{ color: '#008751', fontSize: '1.6rem' }}>
              {counterData.totalSoulsWon.toLocaleString()}
            </span>
          </div>

          <div className="dash-stat-divider" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div className="dash-stat-box">
            <span className="stat-label" style={{ color: '#94a3b8' }}>ZONAL TARGET</span>
            <span className="stat-value" style={{ color: '#ffffff', fontSize: '1.6rem' }}>
              {counterData.zonalTarget.toLocaleString()}
            </span>
          </div>

          <div className="dash-stat-divider" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div className="dash-stat-box">
            <span className="stat-label" style={{ color: '#94a3b8' }}>ZONAL PROGRESS</span>
            <span className="stat-value" style={{ color: '#FFD700', fontSize: '1.6rem' }}>
              {counterData.percentageAchieved}%
            </span>
          </div>
        </div>
      </div>

      {/* DEDICATED VERTICAL TRACK VISUALIZATION */}
      <section className="upward-race-section" style={{ background: '#ffffff' }}>
        <UpwardRaceVisualization competitors={competitors} />
      </section>

      {/* DETAILED LEADERBOARD TABLE */}
      <div className="account-card" style={{ background: '#ffffff' }}>
        <div className="children-header">
          <h3 className="children-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} className="text-gold" />
            <span>GROUP STANDINGS LEADERBOARD</span>
          </h3>
          <span className="personal-count-chip">{competitors.length} GROUPS COMPETING</span>
        </div>

        {competitors.length === 0 ? (
          <div className="race-empty-box">
            <span className="race-empty-badge">NO ACTIVITY RECORDED YET</span>
            <p className="race-empty-text">
              As soul winners record souls across Groups, real-time standings will populate here.
            </p>
          </div>
        ) : (
          <div className="soul-winners-grid">
            {competitors.map((comp, idx) => {
              const rankBadge =
                idx === 0
                  ? '🥇 1st'
                  : idx === 1
                  ? '🥈 2nd'
                  : idx === 2
                  ? '🥉 3rd'
                  : `#${idx + 1}`;

              return (
                <div key={comp.id} className="soul-winner-row-card" style={{ padding: '14px 18px' }}>
                  <div className="sw-rank" style={{ fontSize: idx < 3 ? '1.1rem' : '0.9rem', fontWeight: '900', minWidth: '54px' }}>
                    {rankBadge}
                  </div>

                  <div className="sw-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="sw-name">{comp.name}</span>
                      {comp.code && (
                        <span className="child-code">({comp.code})</span>
                      )}
                      {comp.isTargetExceeded && (
                        <span className="exceeded-tag">
                          <Sparkles size={11} /> TARGET EXCEEDED
                        </span>
                      )}
                    </div>

                    <div className="child-progress-track" style={{ marginTop: '6px' }}>
                      <div
                        className="child-progress-fill"
                        style={{ width: `${Math.min(100, comp.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <div className="child-pct-pill">
                      <span>{comp.displayPercentage || `${comp.percentage}%`}</span>
                    </div>
                    <span className="child-code">
                      {comp.soulsWon.toLocaleString()} / {comp.target > 0 ? comp.target.toLocaleString() : 'Not Set'} souls
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
