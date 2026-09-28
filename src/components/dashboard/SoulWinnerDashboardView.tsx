import React, { useState, useEffect } from 'react';
import {
  User,
  HeartHandshake,
  Trophy,
  Church,
  Building2,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Search,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAllLocalRecords } from '../../services/indexedDbService';
import { subscribeToSyncStatus } from '../../services/syncService';
import type { SoulWinningRecord } from '../../types/record';

interface SoulWinnerDashboardViewProps {
  onNavigateTab: (tab: 'home' | 'record' | 'account' | 'org' | 'race' | 'about') => void;
}

export const SoulWinnerDashboardView: React.FC<SoulWinnerDashboardViewProps> = ({ onNavigateTab }) => {
  const { userProfile, soulWinnerProfile } = useAuth();

  const [myRecords, setMyRecords] = useState<SoulWinningRecord[]>([]);
  const [churchRecordsCount, setChurchRecordsCount] = useState<number>(0);
  const [groupRecordsCount, setGroupRecordsCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const allRecords = await getAllLocalRecords();

      const userUid = userProfile?.id;
      const churchId = soulWinnerProfile?.churchId || 'ch-ce-gwarinpa-1';
      const groupId = soulWinnerProfile?.groupId || 'grp-gwarinpa';

      // Filter personal records
      const mine = allRecords.filter(
        (r) => r.soulWinnerId === userUid || (userProfile?.email && r.phone.includes(userProfile.email))
      );
      setMyRecords(mine.length > 0 ? mine : allRecords);

      // Filter church & group totals
      const churchRecs = allRecords.filter((r) => r.churchId === churchId || r.churchName === soulWinnerProfile?.churchName);
      const groupRecs = allRecords.filter((r) => r.groupId === groupId || r.groupName === soulWinnerProfile?.groupName);

      setChurchRecordsCount(Math.max(churchRecs.length, mine.length));
      setGroupRecordsCount(Math.max(groupRecs.length, churchRecs.length, mine.length));
    } catch (err) {
      console.warn('Error loading soul winner dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToSyncStatus(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [userProfile, soulWinnerProfile]);

  const mySoulsCount = myRecords.length;
  const personalTarget = 20; // Personal target default
  const personalPct = Math.min(100, Math.round((mySoulsCount / personalTarget) * 100));

  const churchContribPct = churchRecordsCount > 0 ? ((mySoulsCount / churchRecordsCount) * 100).toFixed(1) : '0.0';
  const groupContribPct = groupRecordsCount > 0 ? ((mySoulsCount / groupRecordsCount) * 100).toFixed(1) : '0.0';

  // Badges calculation
  const badges = [
    {
      id: 'badge-starter',
      title: 'Soul Starter',
      desc: 'Recorded 1+ Souls Won',
      icon: '🌱',
      unlocked: mySoulsCount >= 1,
    },
    {
      id: 'badge-warrior',
      title: 'Harvest Warrior',
      desc: 'Recorded 5+ Souls Won',
      icon: '⚔️',
      unlocked: mySoulsCount >= 5,
    },
    {
      id: 'badge-bearer',
      title: 'Flame Bearer',
      desc: 'Recorded 10+ Souls Won',
      icon: '🔥',
      unlocked: mySoulsCount >= 10,
    },
    {
      id: 'badge-pillar',
      title: 'Kingdom Pillar',
      desc: 'Recorded 25+ Souls Won',
      icon: '🏆',
      unlocked: mySoulsCount >= 25,
    },
    {
      id: 'badge-legend',
      title: 'Legendary Winner',
      desc: 'Recorded 50+ Souls Won',
      icon: '👑',
      unlocked: mySoulsCount >= 50,
    },
    {
      id: 'badge-church-pillar',
      title: 'Church Pillar',
      desc: 'Contributed 10%+ to Church',
      icon: '⛪',
      unlocked: parseFloat(churchContribPct) >= 10.0 && mySoulsCount >= 1,
    },
    {
      id: 'badge-group-pace',
      title: 'Group Pace Setter',
      desc: 'Contributed 5%+ to Group',
      icon: '🏢',
      unlocked: parseFloat(groupContribPct) >= 5.0 && mySoulsCount >= 1,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const filteredMyRecords = myRecords.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
      {/* HERO CARD */}
      <div
        className="account-card dashboard-hero-card"
        style={{
          background: 'linear-gradient(135deg, #071710 0%, #0d2a1d 100%)',
          color: '#ffffff',
          border: '1px solid rgba(0, 135, 81, 0.4)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="hero-badge" style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#FFD700' }}>
              <HeartHandshake size={14} />
              <span>SOUL WINNER DASHBOARD</span>
            </div>
            <h1 className="dashboard-org-title" style={{ fontSize: '1.8rem', color: '#ffffff', margin: '8px 0 4px 0' }}>
              {userProfile?.name || 'Soul Winner'}
            </h1>
            <p className="dashboard-org-subtitle" style={{ color: '#94a3b8', margin: 0 }}>
              Church: <strong style={{ color: '#4ade80' }}>{soulWinnerProfile?.churchName || 'CE Gwarinpa 1'}</strong> • Group:{' '}
              <strong style={{ color: '#FFD700' }}>{soulWinnerProfile?.groupName || 'Gwarinpa Group'}</strong>
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('record')}
            className="submit-button"
            style={{ padding: '12px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Zap size={18} />
            <span>QUICK RECORD A SOUL</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS & IMPACT STATS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* Card 1: My Souls Won */}
        <div
          style={{
            background: 'rgba(13, 31, 24, 0.8)',
            border: '1px solid rgba(0, 135, 81, 0.5)',
            borderRadius: '14px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <Trophy size={16} color="#FFD700" />
            <span>MY SOULS WON</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#4ade80', margin: '6px 0' }}>
            {mySoulsCount.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            Personal Goal: {mySoulsCount} / {personalTarget} souls ({personalPct}%)
          </div>
        </div>

        {/* Card 2: Church Contribution */}
        <div
          style={{
            background: 'rgba(13, 31, 24, 0.8)',
            border: '1px solid rgba(0, 135, 81, 0.5)',
            borderRadius: '14px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <Church size={16} color="#4ade80" />
            <span>CHURCH CONTRIBUTION</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#FFD700', margin: '6px 0' }}>
            {churchContribPct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            {mySoulsCount} of {churchRecordsCount} souls won in {soulWinnerProfile?.churchName || 'Church'}
          </div>
        </div>

        {/* Card 3: Group Contribution */}
        <div
          style={{
            background: 'rgba(13, 31, 24, 0.8)',
            border: '1px solid rgba(0, 135, 81, 0.5)',
            borderRadius: '14px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <Building2 size={16} color="#38bdf8" />
            <span>GROUP CONTRIBUTION</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#38bdf8', margin: '6px 0' }}>
            {groupContribPct}%
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            {mySoulsCount} of {groupRecordsCount} souls won in {soulWinnerProfile?.groupName || 'Group'}
          </div>
        </div>

        {/* Card 4: Achievement Badges */}
        <div
          style={{
            background: 'rgba(13, 31, 24, 0.8)',
            border: '1px solid rgba(0, 135, 81, 0.5)',
            borderRadius: '14px',
            padding: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <Award size={16} color="#a855f7" />
            <span>BADGES UNLOCKED</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#c084fc', margin: '6px 0' }}>
            {unlockedCount} / {badges.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            {unlockedCount > 0 ? 'Keep winning souls to earn more!' : 'Record your first soul to unlock!'}
          </div>
        </div>
      </div>

      {/* PROGRESS BARS COMPARISON */}
      <div className="account-card" style={{ marginBottom: '24px' }}>
        <h3 className="form-title" style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} className="text-green-accent" />
          <span>IMPACT & CONTRIBUTION COMPARISON</span>
        </h3>

        {/* 1. Personal Goal Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 'bold' }}>
            <span style={{ color: '#ffffff' }}>👤 Personal Target ({mySoulsCount} / {personalTarget} Souls)</span>
            <span style={{ color: '#4ade80' }}>{personalPct}%</span>
          </div>
          <div style={{ background: '#1e3a2f', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${personalPct}%`,
                background: 'linear-gradient(90deg, #008751 0%, #4ade80 100%)',
                height: '100%',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* 2. Church Contribution Progress */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 'bold' }}>
            <span style={{ color: '#ffffff' }}>⛪ Contribution to {soulWinnerProfile?.churchName || 'Church'} Total ({mySoulsCount} / {churchRecordsCount} Souls)</span>
            <span style={{ color: '#FFD700' }}>{churchContribPct}%</span>
          </div>
          <div style={{ background: '#1e3a2f', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, parseFloat(churchContribPct))}%`,
                background: 'linear-gradient(90deg, #d97706 0%, #FFD700 100%)',
                height: '100%',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* 3. Group Contribution Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', fontWeight: 'bold' }}>
            <span style={{ color: '#ffffff' }}>🏢 Contribution to {soulWinnerProfile?.groupName || 'Group'} Total ({mySoulsCount} / {groupRecordsCount} Souls)</span>
            <span style={{ color: '#38bdf8' }}>{groupContribPct}%</span>
          </div>
          <div style={{ background: '#1e3a2f', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, parseFloat(groupContribPct))}%`,
                background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                height: '100%',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* MILESTONE & ACHIEVEMENT BADGES GRID */}
      <div className="account-card" style={{ marginBottom: '24px' }}>
        <h3 className="form-title" style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="#FFD700" />
          <span>ACHIEVEMENT & RECOGNITION BADGES</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
          {badges.map((b) => (
            <div
              key={b.id}
              style={{
                background: b.unlocked ? 'rgba(0, 135, 81, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                border: b.unlocked ? '1px solid #008751' : '1px solid #1e3a2f',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                opacity: b.unlocked ? 1 : 0.45,
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{b.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: b.unlocked ? '#FFD700' : '#94a3b8' }}>
                {b.title}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px' }}>{b.desc}</div>
              <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: 'bold', color: b.unlocked ? '#4ade80' : '#64748b' }}>
                {b.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PERSONAL SOULS WON DATA TABLE */}
      <div className="account-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h3 className="form-title" style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} className="text-green-accent" />
            <span>MY RECORDED SOULS ({myRecords.length})</span>
          </h3>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search my souls..."
              className="form-input"
              style={{ paddingLeft: '32px', padding: '6px 12px 6px 32px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {myRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
            <HeartHandshake size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>You haven't recorded any souls yet.</p>
            <button
              onClick={() => onNavigateTab('record')}
              className="submit-button"
              style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.8rem' }}
            >
              Start Recording Now
            </button>
          </div>
        ) : (
          <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #1e3a2f', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#142920', color: '#FFD700', borderBottom: '1px solid #1e3a2f' }}>
                  <th style={{ padding: '10px 14px' }}>SOUL NAME</th>
                  <th style={{ padding: '10px 14px' }}>PHONE</th>
                  <th style={{ padding: '10px 14px' }}>LOCATION</th>
                  <th style={{ padding: '10px 14px' }}>DATE RECORDED</th>
                  <th style={{ padding: '10px 14px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMyRecords.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1e3a2f' }}>
                    <td style={{ padding: '10px 14px', color: '#ffffff', fontWeight: 'bold' }}>{r.name}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{r.phone}</td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>{r.location}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {r.syncStatus === 'synced' ? (
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>✓ Synced</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⏳ Saved Locally</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
