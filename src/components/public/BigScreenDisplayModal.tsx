import React, { useState, useEffect } from 'react';
import { Minimize2, CheckCircle2, Clock, Layers, BarChart2, Church, Trophy, Sparkles, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { FlipCounterDisplay } from './FlipCounterDisplay';
import { UpwardRaceVisualization } from './UpwardRaceVisualization';
import { getAllLocalRecords } from '../../services/indexedDbService';
import { getGroups, getChurches } from '../../services/organizationService';
import { getTargets } from '../../services/targetService';
import { calculateChurchRaceProgress } from '../../services/targetProgressEngine';
import type { ZonalCounterData } from '../../services/counterService';
import type { EventStatus } from '../../config/eventConfig';

interface BigScreenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  counterData: ZonalCounterData;
  eventStatus: EventStatus;
}

interface ChurchStandingItem {
  id: string;
  name: string;
  code: string;
  groupName: string;
  soulsWon: number;
  target: number;
  percentage: number;
  displayPercentage: string;
  isTargetExceeded: boolean;
}

export const BigScreenDisplayModal: React.FC<BigScreenDisplayModalProps> = ({
  isOpen,
  onClose,
  counterData,
  eventStatus,
}) => {
  const [activePage, setActivePage] = useState<'counter' | 'groups' | 'churches'>('counter');
  const [churchStandings, setChurchStandings] = useState<ChurchStandingItem[]>([]);
  const [churchSearchQuery, setChurchSearchQuery] = useState<string>('');
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Keyboard controls: 1 = Counter, 2 = Groups, 3 = Churches, Esc = Exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '1') {
        setActivePage('counter');
      } else if (e.key === '2') {
        setActivePage('groups');
      } else if (e.key === '3') {
        setActivePage('churches');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load church standings for Page 3
  useEffect(() => {
    if (!isOpen) return;

    const loadChurchStandings = async () => {
      try {
        const [records, groups, churches, targets] = await Promise.all([
          getAllLocalRecords(),
          getGroups(),
          getChurches(),
          getTargets(),
        ]);

        const groupMap = new Map<string, string>();
        groups.forEach((g) => groupMap.set(g.id, g.name));

        const churchProgresses = calculateChurchRaceProgress(records, churches, targets);

        const mapped: ChurchStandingItem[] = churchProgresses.map((cp) => {
          const churchObj = churches.find((c) => c.id === cp.organizationId);
          const groupName = churchObj ? (groupMap.get(churchObj.groupId) || 'Abuja Zone 1') : 'Abuja Zone 1';

          return {
            id: cp.organizationId,
            name: cp.organizationName,
            code: cp.organizationCode || '',
            groupName,
            soulsWon: cp.actual,
            target: cp.target,
            percentage: cp.percentage,
            displayPercentage: cp.displayPercentage,
            isTargetExceeded: cp.isTargetExceeded,
          };
        });

        setChurchStandings(mapped);
      } catch (err) {
        console.warn('Error loading church standings for projector:', err);
      }
    };

    loadChurchStandings();
  }, [isOpen, counterData]);

  if (!isOpen) return null;

  const isUpcoming = eventStatus === 'upcoming';
  const isLive = eventStatus === 'live';
  const isCompleted = eventStatus === 'completed';

  return (
    <div className="big-screen-backdrop" role="dialog" aria-modal="true" aria-label="Big Screen Live Display Mode">
      {/* LEFT SIDE COLLAPSIBLE PROJECTOR NAVIGATION DOCK */}
      <div className={`big-screen-left-dock ${isDockCollapsed ? 'dock-collapsed' : 'dock-expanded'}`}>
        <button
          type="button"
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="dock-toggle-btn"
          title={isDockCollapsed ? 'Expand Navigation Menu' : 'Collapse Navigation Menu'}
        >
          {isDockCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isDockCollapsed && <span style={{ fontSize: '0.74rem', fontWeight: '800', letterSpacing: '0.04em' }}>COLLAPSE MENU</span>}
        </button>

        <div className="dock-divider" />

        <button
          type="button"
          onClick={() => setActivePage('counter')}
          className={`dock-btn ${activePage === 'counter' ? 'dock-btn-active' : ''}`}
          title="Overall Counter (Press 1)"
        >
          <Layers size={18} />
          {!isDockCollapsed && <span>OVERALL COUNTER</span>}
        </button>

        <button
          type="button"
          onClick={() => setActivePage('groups')}
          className={`dock-btn ${activePage === 'groups' ? 'dock-btn-active' : ''}`}
          title="Groups Race (Press 2)"
        >
          <BarChart2 size={18} />
          {!isDockCollapsed && <span>GROUPS RACE</span>}
        </button>

        <button
          type="button"
          onClick={() => setActivePage('churches')}
          className={`dock-btn ${activePage === 'churches' ? 'dock-btn-active' : ''}`}
          title="Churches Standings (Press 3)"
        >
          <Church size={18} />
          {!isDockCollapsed && <span>CHURCHES STANDINGS</span>}
        </button>
      </div>

      <div
        className="big-screen-container"
        style={{
          paddingLeft: isDockCollapsed ? '88px' : '240px',
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* TOP BAR / CONTROL BUTTONS */}
        <div className="big-screen-header">
          <div className="big-screen-brand">
            <span className="big-screen-brand-title">CEAZ1 REACHOUT NIGERIA • LIVE CAMPAIGN DISPLAY</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '700' }}>
              Press Keys 1, 2, 3 to switch views
            </span>
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
        </div>

        {/* PAGE 1: OVERALL COUNTER (STANDALONE HERO VIEW) */}
        {activePage === 'counter' && (
          <div className="big-screen-hero" style={{ margin: 'auto 0' }}>
            <h1 className="big-screen-title">CEAZ1 REACHOUT NIGERIA</h1>
            <div className="big-screen-subtitle">SOUL WINNING CAMPAIGN</div>

            {/* STATUS BADGE */}
            <div className="big-screen-status-row">
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
        )}

        {/* PAGE 2: GROUPS RACE VIEW (WITH MINI OVERALL ZONAL PROGRESS BAR) */}
        {activePage === 'groups' && (
          <div className="big-screen-page-groups" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* MINI PERSISTENT OVERALL ZONAL TARGET PROGRESS BAR */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={16} style={{ color: '#FFD700' }} />
                  <span>OVERALL ZONAL TARGET PROGRESS:</span>
                  <strong style={{ color: '#00ff87', fontSize: '1.05rem' }}>
                    {counterData.totalSoulsWon.toLocaleString()}
                  </strong>
                  <span style={{ color: '#94a3b8' }}>/ {counterData.zonalTarget.toLocaleString()} SOULS</span>
                </span>
                <span style={{ fontWeight: '900', color: '#FFD700', fontSize: '1.1rem' }}>
                  {counterData.percentageAchieved}% ACHIEVED
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div
                  style={{
                    width: `${Math.min(100, counterData.percentageAchieved)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #008751 0%, #00ff87 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>

            {/* DEDICATED GROUP BAR CHART */}
            <div className="big-screen-race-section">
              <UpwardRaceVisualization competitors={counterData.groupCompetitors} variant="barChart" />
            </div>
          </div>
        )}

        {/* PAGE 3: CHURCHES STANDINGS VIEW (WITH MINI OVERALL ZONAL PROGRESS BAR) */}
        {activePage === 'churches' && (
          <div className="big-screen-page-churches" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* MINI PERSISTENT OVERALL ZONAL TARGET PROGRESS BAR */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '14px 20px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Trophy size={16} style={{ color: '#FFD700' }} />
                  <span>OVERALL ZONAL TARGET PROGRESS:</span>
                  <strong style={{ color: '#00ff87', fontSize: '1.05rem' }}>
                    {counterData.totalSoulsWon.toLocaleString()}
                  </strong>
                  <span style={{ color: '#94a3b8' }}>/ {counterData.zonalTarget.toLocaleString()} SOULS</span>
                </span>
                <span style={{ fontWeight: '900', color: '#FFD700', fontSize: '1.1rem' }}>
                  {counterData.percentageAchieved}% ACHIEVED
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div
                  style={{
                    width: `${Math.min(100, counterData.percentageAchieved)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #008751 0%, #00ff87 100%)',
                    borderRadius: '6px',
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
            </div>            {/* CHURCHES STANDINGS GRID */}
            <div style={{ background: '#0d1913', padding: '24px', borderRadius: '16px', border: '1px solid rgba(80, 242, 142, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px dashed rgba(255, 255, 255, 0.15)', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Church size={22} style={{ color: '#00ff87' }} />
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                    CHURCHES STANDINGS LEADERBOARD
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* SEARCH INPUT */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search by church name..."
                      value={churchSearchQuery}
                      onChange={(e) => setChurchSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 32px 8px 36px',
                        borderRadius: '20px',
                        border: '1px solid rgba(0, 255, 135, 0.3)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {churchSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setChurchSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <span style={{ fontSize: '0.85rem', fontWeight: '800', padding: '4px 12px', borderRadius: '16px', background: 'rgba(0, 255, 135, 0.15)', color: '#00ff87', border: '1px solid rgba(0, 255, 135, 0.3)' }}>
                    {churchStandings.filter((c) => {
                      if (!churchSearchQuery.trim()) return true;
                      const q = churchSearchQuery.toLowerCase().trim();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        (c.code && c.code.toLowerCase().includes(q))
                      );
                    }).length} OF {churchStandings.length} CHURCHES
                  </span>
                </div>
              </div>

              {churchStandings.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  Loading church standings...
                </div>
              ) : (
                (() => {
                  const filtered = churchStandings.filter((c) => {
                    if (!churchSearchQuery.trim()) return true;
                    const q = churchSearchQuery.toLowerCase().trim();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      (c.code && c.code.toLowerCase().includes(q))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                        No churches found matching "{churchSearchQuery}".
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
                      {filtered.map((c, idx) => {
                        const originalIndex = churchStandings.findIndex((orig) => orig.id === c.id);
                        const cRank = originalIndex === 0 ? '🥇 1st' : originalIndex === 1 ? '🥈 2nd' : originalIndex === 2 ? '🥉 3rd' : `#${originalIndex + 1}`;
                        const rankColor = originalIndex === 0 ? '#FFD700' : originalIndex === 1 ? '#C0C0C0' : originalIndex === 2 ? '#CD7F32' : '#94a3b8';

                        return (
                          <div
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              padding: '12px 16px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: '0.88rem', fontWeight: '900', color: rankColor, minWidth: '42px' }}>
                                {cRank}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.name}
                                  </span>
                                  {c.code && (
                                    <span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '0.78rem' }}>
                                      ({c.code})
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
                                  {c.groupName}
                                </span>
                                <div className="child-progress-track" style={{ height: '6px', marginTop: '6px', width: '100%', maxWidth: '240px' }}>
                                  <div
                                    className="child-progress-fill"
                                    style={{ width: `${Math.min(100, c.percentage)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '85px' }}>
                              <span style={{ fontWeight: '900', color: '#00ff87', fontSize: '0.92rem' }}>
                                {c.displayPercentage}
                              </span>
                              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                {c.soulsWon.toLocaleString()} / {c.target > 0 ? c.target.toLocaleString() : 'Not Set'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

