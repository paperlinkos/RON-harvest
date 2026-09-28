import React, { useState } from 'react';
import { User, Phone, LogOut, Shield, CheckCircle2, Building2, Wrench, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assignSoulWinnerHierarchy } from '../../services/userService';

interface AccountViewProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onOpenAuth }) => {
  const {
    currentUser,
    userProfile,
    soulWinnerProfile,
    isAuthenticated,
    logout,
    refreshProfile,
  } = useAuth();

  const [isAssigningTest, setIsAssigningTest] = useState<boolean>(false);

  if (!isAuthenticated || !userProfile) {
    return (
      <div className="account-card empty-card">
        <div className="account-avatar-placeholder">
          <User size={32} />
        </div>
        <h3 className="account-title">Soul Winner Identity</h3>
        <p className="account-lead">
          Sign in or create an account so your soul-winning records are automatically linked to your PCF and Zone.
        </p>
        <div className="account-actions">
          <button onClick={() => onOpenAuth('login')} className="submit-button">
            Sign In
          </button>
          <button onClick={() => onOpenAuth('signup')} className="secondary-button">
            Register Account
          </button>
        </div>
      </div>
    );
  }

  const handleAssignTestHierarchy = async () => {
    if (!currentUser) return;
    setIsAssigningTest(true);
    try {
      await assignSoulWinnerHierarchy(currentUser.uid, {
        pcfId: 'pcf_grace_01',
        churchId: 'church_central_01',
        groupId: 'group_alpha_01',
        zoneId: 'zone_abuja_01',
        pcfName: 'Grace PCF',
        churchName: 'Central Church',
        groupName: 'Group Alpha',
        zoneName: 'Abuja Zone 1',
      });
      await refreshProfile();
    } catch (err) {
      console.error('Error assigning test hierarchy:', err);
    } finally {
      setIsAssigningTest(false);
    }
  };

  const getRoleLabel = (roleStr?: string) => {
    switch (roleStr) {
      case 'superAdmin':
        return 'Super Admin';
      case 'zoneManager':
        return 'Zonal Leader';
      case 'groupManager':
        return 'Group Leader';
      case 'churchManager':
        return 'Church Leader';
      case 'pcfLeader':
        return 'PCF Leader';
      case 'soulWinner':
      default:
        return 'Soul Winner';
    }
  };

  return (
    <div className="account-card">
      <div className="account-header-row">
        <div className="account-avatar">
          {userProfile.name.charAt(0).toUpperCase()}
        </div>
        <div className="account-title-group">
          <h3 className="account-name">{userProfile.name}</h3>
          <span className="account-email">{userProfile.email}</span>
        </div>
        <button onClick={() => logout()} className="logout-button" title="Sign Out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

      {/* STATUS BADGES & BANNERS */}
      {userProfile.status === 'active' && (
        <div className="banner banner-success" role="status">
          <CheckCircle2 size={18} />
          <div>
            <strong>Status: {getRoleLabel(userProfile.role)}</strong>
          </div>
        </div>
      )}

      {(userProfile.status === 'suspended' || userProfile.status === 'disabled') && (
        <div className="banner banner-error" role="status">
          <AlertTriangle size={18} />
          <div>
            <strong>Status: Account {userProfile.status}</strong>
            <p className="banner-subtext">Access is currently restricted for this account.</p>
          </div>
        </div>
      )}

      {/* USER DETAILS */}
      <div className="account-details-grid">
        <div className="detail-item">
          <Phone size={14} className="detail-icon" />
          <div>
            <span className="detail-label">Phone</span>
            <span className="detail-value">{userProfile.phone}</span>
          </div>
        </div>

        <div className="detail-item">
          <Shield size={14} className="detail-icon" />
          <div>
            <span className="detail-label">Role</span>
            <span className="detail-value">{getRoleLabel(userProfile.role)}</span>
          </div>
        </div>
      </div>

      {/* ORGANIZATIONAL HIERARCHY READOUT */}
      <div className="hierarchy-section">
        <h4 className="hierarchy-heading">
          <Building2 size={16} />
          Organizational Assignment
        </h4>

        {soulWinnerProfile?.churchId || soulWinnerProfile?.zoneId ? (
          <div className="hierarchy-tree">
            <div className="hierarchy-node">
              <span className="node-label">ZONE:</span>
              <span className="node-value">{soulWinnerProfile.zoneName || soulWinnerProfile.zoneId || 'Abuja Zone 1'}</span>
            </div>
            <div className="hierarchy-node">
              <span className="node-label">GROUP / SUB-GROUP:</span>
              <span className="node-value">{soulWinnerProfile.groupName || soulWinnerProfile.groupId || 'Gwarinpa Group'}</span>
            </div>
            <div className="hierarchy-node node-highlight">
              <span className="node-label">CHURCH:</span>
              <span className="node-value">{soulWinnerProfile.churchName || soulWinnerProfile.churchId || 'CE Gwarinpa 1'}</span>
            </div>
          </div>
        ) : (
          <div className="hierarchy-unassigned">
            <p>No Church assigned yet.</p>
            <button
              onClick={handleAssignTestHierarchy}
              disabled={isAssigningTest}
              className="dev-assign-button"
            >
              <Wrench size={14} />
              <span>{isAssigningTest ? 'Assigning...' : 'Assign Test Church (Dev Helper)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
