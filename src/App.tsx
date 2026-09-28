import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { StatusBanner } from './components/StatusBanner';
import { SoulRecordForm } from './components/SoulRecordForm';
import { RecentSubmissions } from './components/RecentSubmissions';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { Navigation, type TabType } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { PublicHomeView } from './components/public/PublicHomeView';
import { UpwardRaceView } from './components/public/UpwardRaceView';
import { AboutView } from './components/public/AboutView';
import { AccountView } from './components/auth/AccountView';
import { AuthModal } from './components/auth/AuthModal';
import { OrganizationManager } from './components/admin/OrganizationManager';
import { SoulWinnerAssigner } from './components/admin/SoulWinnerAssigner';
import { UserManagementView } from './components/admin/UserManagementView';
import { RoleDashboardView } from './components/dashboard/RoleDashboardView';
import { EventControlView } from './components/admin/EventControlView';
import { BulkImportView } from './components/admin/BulkImportView';
import { LeaderSoulEntryView } from './components/leader/LeaderSoulEntryView';
import { useSoulRecords } from './hooks/useSoulRecords';
import { useEventConfig } from './hooks/useEventConfig';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import { Lock } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [adminTab, setAdminTab] = useState<'org' | 'users' | 'assign'>('org');
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({ isOpen: false, mode: 'login' });

  const [recordSubTab, setRecordSubTab] = useState<'form' | 'history'>('form');

  const {
    records,
    isLoading,
    isSubmitting,
    lastSubmissionStatus,
    pendingRecordsCount,
    syncedRecordsCount,
    submitRecord,
    manualSync,
  } = useSoulRecords();

  const { isAuthenticated, userProfile, isActiveSoulWinner, isPendingAssignment } = useAuth();

  const { eventConfig } = useEventConfig();

  const prevAuthRef = useRef<boolean>(isAuthenticated);

  // Automatically trigger Sign In modal whenever user logs out
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setAuthModalState({ isOpen: true, mode: 'login' });
      setActiveTab('home');
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Handle logout via reload (e.g. Dev Role Switcher)
  useEffect(() => {
    if (sessionStorage.getItem('ron_just_logged_out')) {
      sessionStorage.removeItem('ron_just_logged_out');
      setAuthModalState({ isOpen: true, mode: 'login' });
    }
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalState({ isOpen: true, mode });
  };

  const handleSelectTab = (tab: TabType) => {
    if (tab === 'record' && !isAuthenticated) {
      handleOpenAuth('signup');
      return;
    }
    if (tab === 'record') {
      setRecordSubTab('form');
    }
    setActiveTab(tab);
  };

  return (
    <div className="layout-shell">
      {/* Left Collapsible Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Stage Area */}
      <div className="main-stage">
        {/* App Header (Mobile & Device Bar) */}
        <div className="mobile-only-header">
          <Header
            pendingCount={pendingRecordsCount}
            syncedCount={syncedRecordsCount}
            onManualSync={manualSync}
          />
        </div>

        {/* Status Alert Banners */}
        <StatusBanner
          lastStatus={lastSubmissionStatus}
          pendingCount={pendingRecordsCount}
        />

        {/* Tab Content Stage */}
        <main className="stage-content">
          {activeTab === 'home' && (
            <PublicHomeView
              onNavigate={handleSelectTab}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {activeTab === 'race' && (
            <UpwardRaceView />
          )}

          {activeTab === 'about' && (
            <AboutView onOpenAuth={handleOpenAuth} />
          )}

          {activeTab === 'dashboard' && (
            <RoleDashboardView onNavigateTab={handleSelectTab} onOpenAuth={handleOpenAuth} />
          )}

          {activeTab === 'record' && (
            <>
              {!isAuthenticated ? (
                <div className="account-card empty-card">
                  <Lock size={32} className="text-gold" />
                  <h3 className="account-title">Sign In Required</h3>
                  <p className="account-lead">
                    Soul winning recording requires a registered and authenticated Soul Winner account. Anonymous soul submissions are forbidden.
                  </p>
                  <div className="account-actions">
                    <button onClick={() => handleOpenAuth('login')} className="submit-button">
                      Sign In
                    </button>
                    <button onClick={() => handleOpenAuth('signup')} className="secondary-button">
                      Register Account
                    </button>
                  </div>
                </div>
              ) : isPendingAssignment ? (
                <div className="account-card empty-card">
                  <Lock size={32} className="text-gold" />
                  <h3 className="account-title">Account Pending Assignment</h3>
                  <p className="account-lead">
                    Your registration is complete! An administrator or PCF Leader will assign your PCF, Church, Group, and Zone before recording souls is enabled.
                  </p>
                  <button onClick={() => setActiveTab('account')} className="submit-button">
                    View My Account Status
                  </button>
                </div>
              ) : isActiveSoulWinner ? (
                role === 'churchManager' || role === 'groupManager' || role === 'zoneManager' || role === 'superAdmin' || role === 'pcfLeader' ? (
                  <LeaderSoulEntryView />
                ) : (
                  <div className="record-container">
                    <div className="record-subnav">
                      <button
                        type="button"
                        onClick={() => setRecordSubTab('form')}
                        className={`subtab-btn ${recordSubTab === 'form' ? 'subtab-active' : ''}`}
                      >
                        RECORD SOUL
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecordSubTab('history')}
                        className={`subtab-btn ${recordSubTab === 'history' ? 'subtab-active' : ''}`}
                      >
                        MY SUBMISSIONS ({records.length})
                      </button>
                    </div>

                    {recordSubTab === 'form' ? (
                      <SoulRecordForm
                        onSubmit={submitRecord}
                        isSubmitting={isSubmitting}
                        mySoulsWon={records.length}
                        onViewHistory={() => setRecordSubTab('history')}
                        eventStatus={eventConfig.status}
                      />
                    ) : (
                      <RecentSubmissions records={records} isLoading={isLoading} />
                    )}
                  </div>
                )
              ) : (
                <div className="account-card empty-card">
                  <Lock size={32} className="text-error" />
                  <h3 className="account-title">Recording Unavailable</h3>
                  <p className="account-lead">
                    Your account is currently {userProfile?.status}. Recording is unavailable.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'eventControl' && userProfile?.role === 'superAdmin' && (
            <EventControlView />
          )}

          {activeTab === 'importData' && userProfile?.role === 'superAdmin' && (
            <BulkImportView />
          )}

          {activeTab === 'account' && (
            <AccountView onOpenAuth={handleOpenAuth} />
          )}

          {activeTab === 'org' && userProfile?.role === 'superAdmin' && (
            <div className="admin-container">
              <div className="admin-subtabs">
                <button
                  onClick={() => setAdminTab('org')}
                  className={`subtab-btn ${adminTab === 'org' ? 'subtab-active' : ''}`}
                >
                  Manage Structures & Tree
                </button>
                <button
                  onClick={() => setAdminTab('users')}
                  className={`subtab-btn ${adminTab === 'users' ? 'subtab-active' : ''}`}
                >
                  User & Role Management
                </button>
                <button
                  onClick={() => setAdminTab('assign')}
                  className={`subtab-btn ${adminTab === 'assign' ? 'subtab-active' : ''}`}
                >
                  Assign Soul Winners
                </button>
              </div>

              {adminTab === 'org' ? (
                <OrganizationManager />
              ) : adminTab === 'users' ? (
                <UserManagementView />
              ) : (
                <SoulWinnerAssigner />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Navigation (Mobile Viewports Only) */}
      <div className="mobile-only-nav">
        <Navigation activeTab={activeTab} onSelectTab={handleSelectTab} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
        initialMode={authModalState.mode}
      />

      {/* PWA Banner */}
      <PwaInstallPrompt />

      {/* Dev Role Switcher */}
      <DevRoleSwitcher />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
