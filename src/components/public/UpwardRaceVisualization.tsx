import React from 'react';
import { ArrowUp, Trophy, Flag, Sparkles } from 'lucide-react';
import type { GroupRaceCompetitor } from '../../services/counterService';

interface UpwardRaceVisualizationProps {
  competitors: GroupRaceCompetitor[];
}

export const UpwardRaceVisualization: React.FC<UpwardRaceVisualizationProps> = ({ competitors }) => {
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
