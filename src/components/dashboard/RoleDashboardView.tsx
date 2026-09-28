import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Users,
  Building,
  HeartHandshake,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardViewData, type DashboardViewData, type BreadcrumbItem } from '../../services/dashboardService';
import type { TargetLevel } from '../../types/target';

interface RoleDashboardViewProps {
  onNavigateTab: (tab: 'home' | 'record' | 'account' | 'org' | 'race' | 'about') => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const RoleDashboardView: React.FC<RoleDashboardViewProps> = ({ onNavigateTab, onOpenAuth }) => {
  const { userProfile, soulWinnerProfile, isAuthenticated } = useAuth();
  
  const [data, setData] = useState<DashboardViewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<TargetLevel | undefined>(undefined);

  useEffect(() => {
    loadDashboard();
  }, [userProfile, soulWinnerProfile, selectedOrgId, selectedLevel]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getDashboardViewData(
        userProfile,
        soulWinnerProfile,
        selectedOrgId,
        selectedLevel
      );
      setData(res);
    } catch (err) {
      console.warn('Failed to load dashboard view data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (childId: string, childLevel: TargetLevel) => {
    setSelectedOrgId(childId);
    setSelectedLevel(childLevel);
  };

  const handleBreadcrumbClick = (crumb: BreadcrumbItem) => {
    setSelectedOrgId(crumb.id);
    setSelectedLevel(crumb.level);
  };

  if (!isAuthenticated) {
    return (
      <div className="account-card empty-card">
        <ShieldAlert size={36} className="text-gold" />
        <h3 className="account-title">Sign In Required</h3>
        <p className="account-lead">
          Management and progress monitoring dashboards require an authenticated Pastor or Leader account.
        </p>
        <div className="sidebar-auth-btns" style={{ width: '220px', marginTop: '12px' }}>
          <button onClick={() => onOpenAuth('login')} className="btn-green-accent btn-large">
            Sign In to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="account-card empty-card">
        <p className="loading-text">Loading dashboard progress...</p>
      </div>
    );
  }

  // Soul Winner Individual View
  if (data.userScope.level === 'soulWinner' && data.activeLevel === 'pcf' && data.soulWinners) {
    const myContribution = data.soulWinners.find((w) => w.id === userProfile?.id) || {
      id: userProfile?.id || '',
      name: userProfile?.name || 'Soul Winner',
      soulsWon: data.actual,
    };

    return (
      <div className="dashboard-container">
        {/* SOUL WINNER PERSONAL HERO */}
        <div className="account-card dashboard-hero-card">
          <div className="hero-badge">
            <HeartHandshake size={14} />
            <span>MY SOUL WINNING PROGRESS</span>
          </div>

          <div className="dashboard-hero-header">
            <h2 className="dashboard-org-title">{myContribution.name}</h2>
            <p className="dashboard-org-subtitle">
              Connected Church: {soulWinnerProfile?.churchName || 'Abuja Cathedral'}
            </p>
          </div>

          <div className="dashboard-stats-grid">
            <div className="dash-stat-box">
              <span className="stat-label">MY SOULS WON</span>
              <span className="stat-value text-green">{myContribution.soulsWon.toLocaleString()}</span>
            </div>

            <div className="dash-stat-divider" />

            <div className="dash-stat-box">
              <span className="stat-label">MY TARGET</span>
              <span className="stat-value">{data.target > 0 ? data.target.toLocaleString() : '10'}</span>
            </div>

            <div className="dash-stat-divider" />

            <div className="dash-stat-box">
              <span className="stat-label">MY PROGRESS</span>
              <span className="stat-value text-green">{data.displayPercentage}</span>
            </div>
          </div>

          <button onClick={() => onNavigateTab('record')} className="btn-green-accent btn-large" style={{ marginTop: '16px' }}>
            <span>RECORD A SOUL NOW</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* INTERACTIVE BREADCRUMBS */}
      <nav className="breadcrumbs-bar" aria-label="Hierarchy Breadcrumbs">
        {data.breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id}>
            {idx > 0 && <ChevronRight size={14} className="breadcrumb-arrow" />}
            <button
              onClick={() => handleBreadcrumbClick(crumb)}
              className={`breadcrumb-item ${crumb.id === data.activeOrgId ? 'breadcrumb-active' : ''}`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* LEADER DASHBOARD HERO CARD */}
      <div className="account-card dashboard-hero-card">
        <div className="dashboard-hero-top">
          <div className="hero-badge">
            <Building size={14} />
            <span>{data.activeLevel.toUpperCase()} MONITORING DASHBOARD</span>
          </div>
          <div className="live-status-pill">
            <span className="live-dot" />
            <span>LIVE MONITORING</span>
          </div>
        </div>

        <div className="dashboard-hero-header">
          <h1 className="dashboard-org-title">{data.activeOrgName}</h1>
          <p className="dashboard-org-subtitle">
            Real-time soul-winning progress for assigned {data.activeLevel.toUpperCase()} hierarchy.
          </p>
        </div>

        {/* Hero Progress Metrics */}
        <div className="dashboard-metrics-container">
          <div className="dashboard-stat-row">
            <div className="dash-metric-big">
              <span className="metric-label">SOULS WON / TARGET</span>
              <div className="metric-number-group">
                <span className="metric-actual">{data.actual.toLocaleString()}</span>
                <span className="metric-slash">/</span>
                <span className="metric-target">{data.target.toLocaleString()} SOULS</span>
              </div>
            </div>

            <div className="dash-percentage-badge">
              <span className="dash-pct-text">{data.displayPercentage}</span>
              {data.isTargetExceeded && (
                <span className="exceeded-tag" title="Target Exceeded!">
                  <span>EXCEEDED</span>
                </span>
              )}
            </div>
          </div>

          {/* Full Width Progress Bar */}
          <div className="national-progress-track" style={{ height: '14px', borderRadius: '8px' }}>
            <div
              className={`national-progress-fill ${data.isTargetExceeded ? 'progress-exceeded' : ''}`}
              style={{ width: `${Math.min(100, (data.normalizedProgress || 0) * 100)}%`, borderRadius: '8px' }}
            />
          </div>

          <div className="dash-remaining-row">
            <span className="remaining-text">
              <strong>{data.remainingTarget.toLocaleString()}</strong> SOULS REMAINING TO REACH TARGET
            </span>
            <span className="target-status-badge">
              {data.isTargetExceeded ? (
                <span className="text-green-accent flex-inline-gap">
                  <CheckCircle2 size={14} /> TARGET EXCEEDED!
                </span>
              ) : (
                <span className="text-muted flex-inline-gap">
                  <TrendingUp size={14} /> IN PROGRESS
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* CHILDREN ORGANIZATIONS DRILL-DOWN LIST */}
      <div className="account-card dashboard-children-card">
        <div className="children-header">
          <h3 className="children-title">
            {data.activeLevel === 'zone'
              ? 'GROUPS UNDER ZONE'
              : data.activeLevel === 'group'
              ? 'CHURCHES UNDER GROUP'
              : 'SOUL WINNERS IN CHURCH'}
          </h3>
          <span className="text-muted text-sm">
            {data.activeLevel === 'church' ? `${data.soulWinners?.length || 0} Soul Winners` : `${data.children.length} Entities`}
          </span>
        </div>

        {/* Children Rows */}
        {data.activeLevel === 'church' ? (
          <div className="soul-winners-grid">
            {data.soulWinners?.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '20px' }}>
                No Soul Winner submissions recorded under this Church yet.
              </p>
            ) : (
              data.soulWinners?.map((sw, idx) => (
                <div key={sw.id} className="soul-winner-row-card">
                  <div className="sw-rank">#{idx + 1}</div>
                  <div className="sw-info">
                    <span className="sw-name">{sw.name}</span>
                  </div>
                  <div className="sw-souls">
                    <span className="sw-count">{sw.soulsWon.toLocaleString()}</span>
                    <span className="sw-unit">SOULS</span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="children-list-grid">
            {data.children.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: '20px' }}>
                No sub-organizations configured under this {data.activeLevel.toUpperCase()} yet.
              </p>
            ) : (
              data.children.map((child) => (
                <div
                  key={child.organizationId}
                  onClick={() => handleDrillDown(child.organizationId, child.level)}
                  className="child-entity-card"
                >
                  <div className="child-card-top">
                    <div className="child-name-group">
                      <span className="child-name">{child.organizationName}</span>
                      {child.organizationCode && <span className="child-code">({child.organizationCode})</span>}
                    </div>
                    <div className="child-pct-pill">
                      <span>{child.displayPercentage}</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  <div className="child-card-middle">
                    <div className="child-progress-track">
                      <div
                        className="child-progress-fill"
                        style={{ width: `${Math.min(100, (child.normalizedProgress || 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="child-card-bottom">
                    <span className="child-stat-text">
                      <strong>{child.actual.toLocaleString()}</strong> / {child.target.toLocaleString()} SOULS
                    </span>
                    {child.childCount !== undefined && (
                      <span className="child-count-tag">
                        <Users size={12} /> {child.childCount} {child.level === 'group' ? 'Churches' : child.level === 'church' ? 'PCFs' : 'Members'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
