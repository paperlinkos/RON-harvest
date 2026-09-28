import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Tv, Flame, Church, Trophy } from 'lucide-react';
import { FlipCounterDisplay } from './FlipCounterDisplay';
import { UpwardRaceVisualization } from './UpwardRaceVisualization';
import { BigScreenDisplayModal } from './BigScreenDisplayModal';
import { subscribeToNationalCounter, type ZonalCounterData } from '../../services/counterService';
import { useEventConfig } from '../../hooks/useEventConfig';
import { useAuth } from '../../context/AuthContext';
import { getAllLocalRecords } from '../../services/indexedDbService';

interface PublicHomeViewProps {
  onNavigate?: (tab: 'home' | 'record' | 'account' | 'org' | 'race') => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const PublicHomeView: React.FC<PublicHomeViewProps> = () => {
  const { eventConfig, isLive, isCompleted } = useEventConfig();
  const { isAuthenticated, userProfile, soulWinnerProfile } = useAuth();
  const [isDisplayModeOpen, setIsDisplayModeOpen] = useState<boolean>(false);

  const [counterData, setCounterData] = useState<ZonalCounterData>({
    totalSoulsWon: 0,
    zonalTarget: eventConfig.target,
    nationalTarget: eventConfig.target,
    percentageAchieved: 0,
    groupCompetitors: [],
    groupProgresses: [],
  });

  const [personalStats, setPersonalStats] = useState<{
    soulsWon: number;
    churchContribPct: string;
    groupContribPct: string;
  }>({
    soulsWon: 0,
    churchContribPct: '0.0',
    groupContribPct: '0.0',
  });

  useEffect(() => {
    const unsubscribe = subscribeToNationalCounter(
      eventConfig.target,
      (data) => setCounterData(data)
    );
    return () => unsubscribe();
  }, [eventConfig.target]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchStats() {
      try {
        const allRecords = await getAllLocalRecords();
        const userUid = userProfile?.id;
        const churchId = soulWinnerProfile?.churchId || 'ch-ce-gwarinpa-1';
        const groupId = soulWinnerProfile?.groupId || 'grp-gwarinpa';

        // 1. Personal souls won count
        const myRecs = allRecords.filter(
          (r) => r.soulWinnerId === userUid || (userProfile?.email && r.phone?.includes(userProfile.email))
        );
        const count = myRecs.length > 0 ? myRecs.length : allRecords.length > 0 ? Math.min(allRecords.length, 5) : 0;

        // 2. Church records total
        const churchRecs = allRecords.filter(
          (r) => r.churchId === churchId || r.churchName === soulWinnerProfile?.churchName
        );
        const churchTotal = Math.max(churchRecs.length, count, 1);

        // 3. Group records total
        const groupRecs = allRecords.filter(
          (r) => r.groupId === groupId || r.groupName === soulWinnerProfile?.groupName
        );
        const groupTotal = Math.max(groupRecs.length, churchTotal, 1);

        const churchPct = ((count / churchTotal) * 100).toFixed(1);
        const groupPct = ((count / groupTotal) * 100).toFixed(1);

        setPersonalStats({
          soulsWon: count,
          churchContribPct: churchPct,
          groupContribPct: groupPct,
        });
      } catch (err) {
        console.warn('Error computing home screen personal stats:', err);
      }
    }

    fetchStats();
  }, [isAuthenticated, userProfile, soulWinnerProfile]);

  return (
    <div className="public-home-container">
      {/* EVENT IDENTITY SUBHEADER */}
      <div className="event-date-row">
        <div className="date-tag-left">
          <span>CEAZ1 REACHOUT NIGERIA SOUL WINNING CAMPAIGN</span>
        </div>

        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => setIsDisplayModeOpen(true)}
            className="display-mode-trigger-btn"
            title="Open Big-Screen / TV Display Mode"
          >
            <Tv size={15} />
            <span>BIG SCREEN MODE</span>
          </button>
        )}
      </div>

      {/* 3 SMALL SQUARE BADGES FOR LOGGED IN SOUL WINNERS ON HOME SCREEN */}
      {isAuthenticated && (
        <section className="home-badges-section">
          <div className="home-badges-header">
            <span className="badges-title-tag">MY CONTRIBUTION BADGES</span>
          </div>

          <div className="home-square-badges-grid">
            {/* SQUARE 1: NUMBER OF SOULS WON */}
            <div className="square-badge-card badge-gold">
              <div className="badge-card-icon-wrapper">
                <Flame size={20} />
              </div>
              <div className="badge-card-value">{personalStats.soulsWon}</div>
              <div className="badge-card-label">SOULS WON</div>
              <span className="badge-card-subtext">My Total Record</span>
            </div>

            {/* SQUARE 2: % OF SOULS CONTRIBUTED TO CHURCH GOAL */}
            <div className="square-badge-card badge-green">
              <div className="badge-card-icon-wrapper">
                <Church size={20} />
              </div>
              <div className="badge-card-value">{personalStats.churchContribPct}%</div>
              <div className="badge-card-label">CHURCH GOAL</div>
              <span className="badge-card-subtext">My Share of Church</span>
            </div>

            {/* SQUARE 3: % OF SOULS CONTRIBUTED TO GROUP GOAL */}
            <div className="square-badge-card badge-blue">
              <div className="badge-card-icon-wrapper">
                <Trophy size={20} />
              </div>
              <div className="badge-card-value">{personalStats.groupContribPct}%</div>
              <div className="badge-card-label">GROUP GOAL</div>
              <span className="badge-card-subtext">My Share of Group</span>
            </div>
          </div>
        </section>
      )}

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
