import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  getAllSoulWinnerProfiles,
  updateUserStatus,
  updateUserRole,
  assignSoulWinnerHierarchy,
} from '../../services/userService';
import {
  getZones,
  getGroups,
  getChurches,
  getPCFs,
  resolvePCFHierarchy,
} from '../../services/organizationService';
import type { UserProfile, SoulWinnerProfile, AccountStatus, UserRole } from '../../types/auth';
import type { Zone, Group, Church, PCF } from '../../types/organization';

export const UserManagementView: React.FC = () => {
  const { userProfile: currentUser, role } = useAuth();
  const isSuperAdmin = role === 'superAdmin';

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [swProfiles, setSwProfiles] = useState<SoulWinnerProfile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [pcfs, setPcfs] = useState<PCF[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Confirmation Modals State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'status' | 'role' | 'reassign' | null;
    user: UserProfile | null;
    newStatus?: AccountStatus;
    newRole?: UserRole;
  }>({ isOpen: false, type: null, user: null });

  // Reassignment selection states
  const [selZoneId, setSelZoneId] = useState<string>('');
  const [selGroupId, setSelGroupId] = useState<string>('');
  const [selChurchId, setSelChurchId] = useState<string>('');
  const [selPcfId, setSelPcfId] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const refreshUsersAndOrgs = async () => {
    setIsLoading(true);
    try {
      const [uList, swList, zList, gList, cList, pList] = await Promise.all([
        getAllUsers(),
        getAllSoulWinnerProfiles(),
        getZones(),
        getGroups(),
        getChurches(),
        getPCFs(),
      ]);
      setUsers(uList);
      setSwProfiles(swList);
      setZones(zList);
      setGroups(gList);
      setChurches(cList);
      setPcfs(pList);
    } catch (err) {
      console.warn('Error fetching users and orgs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUsersAndOrgs();
  }, []);

  if (!isSuperAdmin) {
    return (
      <div className="account-card empty-card">
        <ShieldAlert size={36} className="text-error" />
        <h3 className="account-title">Access Restricted</h3>
        <p className="account-lead">User management is restricted to authorized Super Administrators.</p>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getSwAssignment = (userId: string) => {
    return swProfiles.find((sw) => sw.userId === userId);
  };

  const handleExecuteAction = async () => {
    if (!actionModal.user || !actionModal.type) return;
    setIsProcessing(true);
    setError('');
    setSuccess('');

    const actorId = currentUser?.id || 'superAdmin';

    try {
      if (actionModal.type === 'status' && actionModal.newStatus) {
        await updateUserStatus(actionModal.user.id, actionModal.newStatus, actorId);
        setSuccess(`Updated account status for ${actionModal.user.name} to ${actionModal.newStatus}.`);
      } else if (actionModal.type === 'role' && actionModal.newRole) {
        await updateUserRole(actionModal.user.id, actionModal.newRole, actorId);
        setSuccess(`Changed role for ${actionModal.user.name} to ${actionModal.newRole}.`);
      } else if (actionModal.type === 'reassign' && selPcfId) {
        const { pcf, church, group, zone } = await resolvePCFHierarchy(selPcfId);
        await assignSoulWinnerHierarchy(
          actionModal.user.id,
          {
            pcfId: pcf.id,
            churchId: church.id,
            groupId: group.id,
            zoneId: zone.id,
            pcfName: pcf.name,
            churchName: church.name,
            groupName: group.name,
            zoneName: zone.name,
          },
          actorId
        );
        setSuccess(
          `Reassigned ${actionModal.user.name} to ${pcf.name} (${church.name}, ${group.name}, ${zone.name}). Future records will use this assignment; historical records remain preserved.`
        );
      }

      setActionModal({ isOpen: false, type: null, user: null });
      await refreshUsersAndOrgs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const availableGroups = groups.filter((g) => g.zoneId === selZoneId);
  const availableChurches = churches.filter((c) => c.groupId === selGroupId);
  const availablePcfs = pcfs.filter((p) => p.churchId === selChurchId);

  return (
    <div className="account-card">
      <div className="form-header">
        <h2 className="form-title">
          <Users size={24} className="inline-icon" /> User & Role Management
        </h2>
        <p className="form-lead">
          Manage registered Soul Winners, Pastor/Manager roles, account statuses, and organizational assignments.
        </p>
      </div>

      {error && (
        <div className="error-box">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-box">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="user-filter-bar">
        <div className="input-wrapper search-wrapper">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="form-input search-input"
          />
        </div>

        <div className="filter-group">
          <label className="form-label text-xs">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input select-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pendingAssignment">Pending Assignment</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <button onClick={refreshUsersAndOrgs} className="icon-button-light" title="Refresh List">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* USER LIST GRID */}
      {isLoading ? (
        <p className="loading-text">Loading registered users...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="empty-text">No users found matching current filters.</p>
      ) : (
        <div className="users-list-grid">
          {filteredUsers.map((u) => {
            const sw = getSwAssignment(u.id);

            return (
              <div key={u.id} className="user-management-card">
                <div className="user-card-header">
                  <div className="user-avatar-sm">{u.name.charAt(0).toUpperCase()}</div>
                  <div className="user-main-meta">
                    <h4 className="user-card-name">{u.name}</h4>
                    <span className="user-card-email">{u.email}</span>
                  </div>
                  <span className={`status-pill status-${u.status}`}>
                    {u.status === 'pendingAssignment' ? 'PENDING' : u.status.toUpperCase()}
                  </span>
                </div>

                <div className="user-card-details">
                  <div className="detail-row">
                    <span className="detail-lbl">ROLE:</span>
                    <span className="detail-val role-badge">{u.role}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-lbl">ASSIGNMENT:</span>
                    <span className="detail-val org-path">
                      {sw?.pcfName ? (
                        `${sw.pcfName} • ${sw.churchName || ''} • ${sw.groupName || ''} • ${sw.zoneName || ''}`
                      ) : (
                        <em className="text-dim">Unassigned</em>
                      )}
                    </span>
                  </div>
                </div>

                {/* USER MANAGEMENT ACTIONS */}
                <div className="user-card-actions">
                  <button
                    onClick={() => {
                      setSelZoneId(sw?.zoneId || '');
                      setSelGroupId(sw?.groupId || '');
                      setSelChurchId(sw?.churchId || '');
                      setSelPcfId(sw?.pcfId || '');
                      setActionModal({ isOpen: true, type: 'reassign', user: u });
                    }}
                    className="btn-xs btn-outline"
                  >
                    <UserCheck size={14} /> Assign / Reassign
                  </button>

                  <select
                    value={u.role}
                    onChange={(e) =>
                      setActionModal({
                        isOpen: true,
                        type: 'role',
                        user: u,
                        newRole: e.target.value as UserRole,
                      })
                    }
                    className="select-xs"
                  >
                    <option value="soulWinner">Role: Soul Winner</option>
                    <option value="pcfLeader">Role: PCF Leader</option>
                    <option value="churchManager">Role: Church Manager</option>
                    <option value="groupManager">Role: Group Manager</option>
                    <option value="zoneManager">Role: Zone Manager</option>
                    <option value="superAdmin">Role: Super Admin</option>
                  </select>

                  {u.status === 'active' && (
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'status',
                          user: u,
                          newStatus: 'suspended',
                        })
                      }
                      className="btn-xs btn-danger-outline"
                    >
                      Suspend
                    </button>
                  )}

                  {u.status === 'suspended' && (
                    <button
                      onClick={() =>
                        setActionModal({
                          isOpen: true,
                          type: 'status',
                          user: u,
                          newStatus: 'active',
                        })
                      }
                      className="btn-xs btn-success-outline"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {actionModal.isOpen && actionModal.user && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <AlertTriangle size={36} className="text-warning mx-auto" />
            <h3 className="modal-title text-center">
              {actionModal.type === 'reassign'
                ? 'REASSIGN USER?'
                : actionModal.type === 'role'
                ? 'CHANGE USER ROLE?'
                : `${actionModal.newStatus?.toUpperCase()} USER?`}
            </h3>

            <p className="modal-subtitle text-center">
              Target User: <strong>{actionModal.user.name}</strong> ({actionModal.user.email})
            </p>

            {/* REASSIGNMENT PICKER IF TYPE == REASSIGN */}
            {actionModal.type === 'reassign' && (
              <div className="reassign-picker-form">
                <div className="form-group">
                  <label className="form-label text-xs">1. Select Zone *</label>
                  <select
                    value={selZoneId}
                    onChange={(e) => {
                      setSelZoneId(e.target.value);
                      setSelGroupId('');
                      setSelChurchId('');
                      setSelPcfId('');
                    }}
                    className="form-input select-sm"
                  >
                    <option value="">-- Select Zone --</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">2. Select Group *</label>
                  <select
                    value={selGroupId}
                    onChange={(e) => {
                      setSelGroupId(e.target.value);
                      setSelChurchId('');
                      setSelPcfId('');
                    }}
                    disabled={!selZoneId}
                    className="form-input select-sm"
                  >
                    <option value="">-- Select Group --</option>
                    {availableGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">3. Select Church *</label>
                  <select
                    value={selChurchId}
                    onChange={(e) => {
                      setSelChurchId(e.target.value);
                      setSelPcfId('');
                    }}
                    disabled={!selGroupId}
                    className="form-input select-sm"
                  >
                    <option value="">-- Select Church --</option>
                    {availableChurches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-xs">4. Select PCF *</label>
                  <select
                    value={selPcfId}
                    onChange={(e) => setSelPcfId(e.target.value)}
                    disabled={!selChurchId}
                    className="form-input select-sm"
                  >
                    <option value="">-- Select PCF --</option>
                    {availablePcfs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="historical-notice-box">
                  <strong>CRITICAL RULE:</strong> Future soul submissions will use this new assignment. Historical soul-winning records will remain attributed to their original organization.
                </div>
              </div>
            )}

            <div className="modal-actions-row">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: null, user: null })}
                disabled={isProcessing}
                className="secondary-button"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isProcessing || (actionModal.type === 'reassign' && !selPcfId)}
                className="submit-button"
              >
                {isProcessing ? 'PROCESSING...' : 'CONFIRM ACTION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
