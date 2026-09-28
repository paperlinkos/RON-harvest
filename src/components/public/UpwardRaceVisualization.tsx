import React from 'react';
import { ArrowUp, Trophy, Flag, Sparkles, BarChart2 } from 'lucide-react';
import type { GroupRaceCompetitor } from '../../services/counterService';

interface UpwardRaceVisualizationProps {
  competitors: GroupRaceCompetitor[];
  variant?: 'classic' | 'barChart';
}

/** Returns exact color config based on percentage rules: <50% Red, 50-74% Yellow, >=75% Bright Green */
export function getBarColorConfig(percentage: number) {
  if (percentage < 50) {
    return {
      // RED (< 50%)
      background: 'linear-gradient(180deg, #ff453a 0%, #b30000 100%)',
      glow: '0 0 12px rgba(255, 69, 58, 0.7), inset 0 2px 4px rgba(255,255,255,0.7)',
      textColor: '#ff453a',
      badgeBg: 'rgba(255, 69, 58, 0.15)',
      badgeBorder: 'rgba(255, 69, 58, 0.3)',
      tierName: 'BELOW 50%',
    };
  } else if (percentage < 75) {
    return {
      // YELLOW (50% - 74%)
      background: 'linear-gradient(180deg, #ffcc00 0%, #b38f00 100%)',
      glow: '0 0 12px rgba(255, 204, 0, 0.75), inset 0 2px 4px rgba(255,255,255,0.7)',
      textColor: '#ffd60a',
      badgeBg: 'rgba(255, 204, 0, 0.15)',
      badgeBorder: 'rgba(255, 204, 0, 0.3)',
      tierName: '50% - 74%',
    };
  } else {
    return {
      // BRIGHT GREEN (>= 75%)
      background: 'linear-gradient(180deg, #00ff87 0%, #00994d 100%)',
      glow: '0 0 14px rgba(0, 255, 135, 0.8), inset 0 2px 4px rgba(255,255,255,0.7)',
      textColor: '#00ff87',
      badgeBg: 'rgba(0, 255, 135, 0.15)',
      badgeBorder: 'rgba(0, 255, 135, 0.3)',
      tierName: '75%+',
    };
  }
}

export const UpwardRaceVisualization: React.FC<UpwardRaceVisualizationProps> = ({
  competitors,
  variant = 'classic',
}) => {
  if (variant === 'barChart') {
    const displayCompetitors = competitors;

    return (
      <div className="race-container bar-chart-variant">
        <div className="race-header">
          <div className="race-title-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={20} className="text-green-accent" />
              <h3 className="race-title" style={{ color: '#ffffff', fontWeight: '900', margin: 0 }}>
                GROUP PERFORMANCE BAR CHART
              </h3>
            </div>

            {/* Color Threshold Legend Pill beside Heading */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.06)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)', fontSize: '0.74rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ff453a', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff453a' }} /> &lt;50% Red
              </span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd60a', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffd60a' }} /> 50-74% Yellow
              </span>
              <span style={{ color: '#64748b' }}>|</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#00ff87', fontWeight: '800' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff87' }} /> 75%+ Green
              </span>
            </div>
          </div>
        </div>

        {displayCompetitors.length === 0 ? (
          <div className="race-empty-box">
            <span className="race-empty-badge">THE RACE IS BEGINNING</span>
            <p className="race-empty-text">
              Groups will appear here on the bar chart as soul-winning activity is recorded during the campaign.
            </p>
          </div>
        ) : (
          <div className="barchart-wrapper" style={{ position: 'relative', marginTop: '16px', width: '100%', overflowX: 'auto' }}>
            {/* Target 100% Line Banner */}
            <div
              className="barchart-target-line"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '8px',
                borderBottom: '2px dashed #00ff87',
                marginBottom: '16px',
              }}
            >
              <Flag size={14} style={{ color: '#00ff87' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#00ff87', letterSpacing: '0.05em' }}>
                FINISH LINE • 100% TARGET GOAL
              </span>
            </div>

            {/* Grid Chart Columns Area for ALL Groups */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${displayCompetitors.length}, minmax(42px, 1fr))`,
                gap: '6px',
                alignItems: 'flex-end',
                minHeight: '260px',
                paddingBottom: '8px',
                width: '100%',
              }}
            >
              {displayCompetitors.map((comp, idx) => {
                const heightPct = Math.max(
                  5,
                  Math.min(100, (comp.normalizedProgress ?? comp.percentage / 100) * 100)
                );
                const displayPct = comp.displayPercentage || `${comp.percentage}%`;
                const colorConfig = getBarColorConfig(comp.percentage);

                const rankColor =
                  idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#94a3b8';

                return (
                  <div
                    key={comp.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justify: 'flex-end',
                      gap: '8px',
                    }}
                    title={`${comp.name} (${comp.code || 'No Code'}): ${comp.soulsWon.toLocaleString()} / ${comp.target > 0 ? comp.target.toLocaleString() : 'Not Set'} souls (${displayPct}) - ${colorConfig.tierName}`}
                  >
                    {/* Vertical Bar Track Column */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '22px',
                        height: '180px',
                        background: 'rgba(0, 0, 0, 0.45)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)',
                      }}
                    >
                      {/* Entire Bar Filled with Threshold Color */}
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          background: colorConfig.background,
                          borderRadius: '3px 3px 0 0',
                          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: colorConfig.glow,
                          borderTop: '2px solid #ffffff',
                        }}
                      />
                    </div>

                    {/* ALL LABELS PLACED UNDER THE BAR */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        width: '100%',
                        gap: '2px',
                      }}
                    >
                      {/* Rank */}
                      <span style={{ fontSize: '0.72rem', fontWeight: '900', color: rankColor }}>
                        #{idx + 1}
                      </span>

                      {/* Group Code / Name */}
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '52px',
                          display: 'block',
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}
                      >
                        {comp.code ? comp.code.replace(/^GRP-/, '') : comp.name}
                      </span>

                      {/* Percentage Pill in Threshold Color */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '900',
                          color: colorConfig.textColor,
                          lineHeight: '1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '1px',
                        }}
                      >
                        {displayPct}
                        {comp.percentage >= 100 && <Sparkles size={8} style={{ color: '#FFD700' }} />}
                      </span>

                      {/* Souls Count Readout */}
                      <span
                        style={{
                          fontSize: '0.62rem',
                          color: '#94a3b8',
                          fontWeight: '700',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {comp.soulsWon.toLocaleString()}/{comp.target >= 1000 ? `${(comp.target / 1000).toFixed(0)}k` : comp.target}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="race-container">
      <div className="race-header">
        <div className="race-title-group">
          <Trophy size={20} className="text-green-accent" />
          <h3 className="race-title">UPWARD RACE TO TARGET</h3>
        </div>
        <p className="race-subtitle">
          Groups climbing vertically toward their target line. Higher percentage achievement rises closer to the finish line!
        </p>
      </div>

      {competitors.length === 0 ? (
        <div className="race-empty-box">
          <span className="race-empty-badge">THE RACE IS BEGINNING</span>
          <p className="race-empty-text">
            Groups will appear here as soul-winning activity is recorded during the campaign.
          </p>
        </div>
      ) : (
        <div className="race-track-wrapper">
          {/* Target / Finish Line at Top */}
          <div className="finish-line-banner">
            <div className="finish-line-title">
              <Flag size={14} className="text-green-accent" />
              <span>FINISH LINE • 100% TARGET</span>
            </div>
            <div className="finish-line-bar" />
          </div>

          {/* Vertical Columns Track */}
          <div className="race-columns-grid">
            {competitors.slice(0, 8).map((comp, idx) => {
              // Calculate visual height from normalized progress (0.0 to 1.0 -> 0% to 100%, min 6% for visibility)
              const visualHeightPct = Math.max(6, Math.min(100, (comp.normalizedProgress ?? (comp.percentage / 100)) * 100));
              const displayPct = comp.displayPercentage || `${comp.percentage}%`;

              return (
                <div key={comp.id} className="race-competitor-column">
                  {/* Floating Stat Badge at top of column */}
                  <div className="competitor-top-badge">
                    <div className="comp-pct">
                      {displayPct}
                      {comp.isTargetExceeded && (
                        <span title="Target Exceeded!">
                          <Sparkles size={11} className="inline-icon text-gold" />
                        </span>
                      )}
                    </div>
                    <div className="comp-souls">
                      {comp.soulsWon.toLocaleString()}{comp.hasTarget ? ` / ${comp.target.toLocaleString()}` : ''}
                    </div>
                    <ArrowUp size={12} className="comp-arrow-up" />
                  </div>

                  {/* Vertical Track Tube */}
                  <div className="vertical-track-tube">
                    <div
                      className={`vertical-progress-fill ${comp.isTargetExceeded ? 'progress-exceeded' : ''}`}
                      style={{ height: `${visualHeightPct}%` }}
                    />
                  </div>

                  {/* Base Label */}
                  <div className="competitor-base-label">
                    <span className="comp-rank">#{idx + 1}</span>
                    <span className="comp-name" title={comp.name}>
                      {comp.code || comp.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


