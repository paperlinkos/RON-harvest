import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { seedDemoData } from '../utils/demoDataSeeder';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import type { UserRole } from '../types/auth';

export const DevRoleSwitcher: React.FC = () => {
  const { setDevRole, role, status } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<boolean>(false);

  const handleRoleSelect = (targetRole: UserRole | 'pending' | 'logout') => {
    if (targetRole === 'logout') {
      sessionStorage.setItem('ron_just_logged_out', 'true');
    }
    setDevRole(targetRole);
    // Reload window to ensure fresh state across all hooks and services
    window.location.reload();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      window.location.reload();
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const currentRoleLabel =
    status === 'pendingAssignment'
      ? 'Pending Assignment'
      : role === 'superAdmin'
      ? 'Super Admin'
      : role === 'zoneManager'
      ? 'Zonal Manager'
      : role === 'groupManager'
      ? 'Group Manager'
      : role === 'churchManager'
      ? 'Church Manager'
      : role === 'pcfLeader'
      ? 'PCF Leader'
      : role === 'soulWinner'
      ? 'Active Soul Winner'
      : 'Observer (Logged Out)';

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999,
      fontFamily: 'sans-serif',
    }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #008751 0%, #005a36 100%)',
            color: '#ffffff',
            padding: '10px 16px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 215, 0, 0.4)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Shield size={16} color="#FFD700" />
          <span>ROLE: {currentRoleLabel}</span>
          <ChevronUp size={16} />
        </button>
      ) : (
        <div
          style={{
            background: '#0d1f18',
            border: '1px solid rgba(0, 135, 81, 0.6)',
            borderRadius: '16px',
            padding: '16px',
            width: '320px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            color: '#e2e8f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #1e3a2f', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px', color: '#FFD700' }}>
              <Shield size={18} />
              <span>TEST ROLE SWITCHER</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
            Switch active account role to test dashboards & permissions:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
            <button
              onClick={() => handleRoleSelect('superAdmin')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: role === 'superAdmin' ? '#008751' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🛡️ Super Admin
            </button>
            <button
              onClick={() => handleRoleSelect('zoneManager')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: role === 'zoneManager' ? '#008751' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🏛️ Zonal Manager
            </button>
            <button
              onClick={() => handleRoleSelect('groupManager')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: role === 'groupManager' ? '#008751' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🏢 Group Manager
            </button>
            <button
              onClick={() => handleRoleSelect('churchManager')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: role === 'churchManager' ? '#008751' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ⛪ Church Manager
            </button>
            <button
              onClick={() => handleRoleSelect('soulWinner')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: role === 'soulWinner' && status === 'active' ? '#008751' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Active Winner
            </button>
            <button
              onClick={() => handleRoleSelect('logout')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #1e3a2f',
                background: !role ? '#c53030' : '#142920',
                color: '#fff',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🌐 Observer Mode
            </button>
          </div>

          <div style={{ borderTop: '1px solid #1e3a2f', paddingTop: '10px' }}>
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #FFD700',
                background: seedSuccess ? '#008751' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSeeding ? 'Seeding Demo Data...' : seedSuccess ? 'Demo Data Seeded!' : '⚡ Seed Demo Data & Hierarchy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
