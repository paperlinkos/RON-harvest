import React, { useState, useEffect, useMemo } from 'react';
import {
  Target as TargetIcon,
  Save,
  AlertCircle,
  CheckCircle2,
  Search,
  Building,
  Users,
  Check,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTargets, saveTarget, saveMultipleTargets } from '../../services/targetService';
import { getGroups, getChurches, getPCFs } from '../../services/organizationService';
import { getAllLocalRecords } from '../../services/indexedDbService';
import { REACH_OUT_NIGERIA_EVENT } from '../../config/eventConfig';
import { useEventConfig } from '../../hooks/useEventConfig';
import type { Target, TargetLevel, TargetFormData } from '../../types/target';
import type { Group, Church, PCF } from '../../types/organization';
import type { SoulWinningRecord } from '../../types/record';

type ActiveMatrixTab = 'groups' | 'churches' | 'pcfs' | 'single';

export const TargetManagementView: React.FC = () => {
  const { userProfile, role } = useAuth();
  const isSuperAdmin = role === 'superAdmin';
  const { eventConfig } = useEventConfig();

  const [activeTab, setActiveTab] = useState<ActiveMatrixTab>('groups');
  const [targets, setTargets] = useState<Target[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [pcfs, setPcfs] = useState<PCF[]>([]);
  const [records, setRecords] = useState<SoulWinningRecord[]>([]);

  // Draft inputs for fast inline editing
  const [groupDrafts, setGroupDrafts] = useState<Record<string, number>>({});
  const [churchDrafts, setChurchDrafts] = useState<Record<string, number>>({});
  const [pcfDrafts, setPcfDrafts] = useState<Record<string, number>>({});

  // Single target state
  const [singleLevel, setSingleLevel] = useState<TargetLevel>('zone');
  const [singleOrgId, setSingleOrgId] = useState<string>('default_zone');
  const [singleTargetInput, setSingleTargetInput] = useState<string>('40000');

  // Filters & Search
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [churchSearch, setChurchSearch] = useState<string>('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [pcfChurchFilter, setPcfChurchFilter] = useState<string>('all');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedRowIds, setSavedRowIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, gList, cList, pList, rList] = await Promise.all([
        getTargets(),
        getGroups(),
        getChurches(),
        getPCFs(),
        getAllLocalRecords(),
      ]);
      setTargets(tList);
      setGroups(gList);
      setChurches(cList);
      setPcfs(pList);
      setRecords(rList);

      // Populate initial drafts from active targets
      const gDrafts: Record<string, number> = {};
      gList.forEach((g) => {
        const found = tList.find((t) => t.level === 'group' && t.organizationId === g.id && t.status === 'active');
        gDrafts[g.id] = found ? found.target : 1000;
      });
      setGroupDrafts(gDrafts);

      const cDrafts: Record<string, number> = {};
      cList.forEach((c) => {
        const found = tList.find((t) => t.level === 'church' && t.organizationId === c.id && t.status === 'active');
        cDrafts[c.id] = found ? found.target : 250;
      });
      setChurchDrafts(cDrafts);

      const pDrafts: Record<string, number> = {};
      pList.forEach((p) => {
        const found = tList.find((t) => t.level === 'pcf' && t.organizationId === p.id && t.status === 'active');
        pDrafts[p.id] = found ? found.target : 50;
      });
      setPcfDrafts(pDrafts);

      // Pre-fill single form
      const existingZone = tList.find((t) => t.level === 'zone' && t.status === 'active');
      setSingleTargetInput(existingZone ? existingZone.target.toString() : (eventConfig.target || 40000).toString());
    } catch (err) {
      console.warn('Error loading target data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventConfig.target]);

  // Actual souls calculation maps
  const groupSoulsWon = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.groupId) {
        map[r.groupId] = (map[r.groupId] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  const churchSoulsWon = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.churchId) {
        map[r.churchId] = (map[r.churchId] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  const pcfSoulsWon = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      if (r.pcfId) {
        map[r.pcfId] = (map[r.pcfId] || 0) + 1;
      }
    });
    return map;
  }, [records]);

  // Summaries
  const zonalTargetGoal = useMemo(() => {
    const zoneTarget = targets.find((t) => t.level === 'zone' && t.status === 'active');
    return zoneTarget ? zoneTarget.target : eventConfig.target || REACH_OUT_NIGERIA_EVENT.zonalTarget;
  }, [targets, eventConfig.target]);

  const totalGroupTargetAllocated = useMemo(() => {
    return Object.values(groupDrafts).reduce((acc, val) => acc + (val || 0), 0);
  }, [groupDrafts]);

  const totalChurchTargetAllocated = useMemo(() => {
    return Object.values(churchDrafts).reduce((acc, val) => acc + (val || 0), 0);
  }, [churchDrafts]);

  // Handler: Change single target level
  const handleSingleLevelChange = (lvl: TargetLevel) => {
    setSingleLevel(lvl);
    setError(null);
    setSuccessMsg(null);
    if (lvl === 'zone') {
      setSingleOrgId('default_zone');
      setSingleTargetInput(zonalTargetGoal.toString());
    } else if (lvl === 'group') {
      if (groups.length > 0) {
        setSingleOrgId(groups[0].id);
        setSingleTargetInput((groupDrafts[groups[0].id] || 1000).toString());
      }
    } else if (lvl === 'church') {
      if (churches.length > 0) {
        setSingleOrgId(churches[0].id);
        setSingleTargetInput((churchDrafts[churches[0].id] || 250).toString());
      }
    } else if (lvl === 'pcf') {
      if (pcfs.length > 0) {
        setSingleOrgId(pcfs[0].id);
        setSingleTargetInput((pcfDrafts[pcfs[0].id] || 50).toString());
      }
    }
  };

  // Handler: Save Individual Target Row
  const handleSaveSingleRow = async (level: TargetLevel, orgId: string, targetVal: number) => {
    if (!isSuperAdmin) return;
    if (targetVal <= 0 || isNaN(targetVal)) {
      setError('Target must be greater than zero.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    try {
      const saved = await saveTarget(
        { level, organizationId: orgId, target: targetVal },
        userProfile?.id || 'superAdmin'
      );
      setTargets((prev) => {
        const filtered = prev.filter((t) => !(t.level === level && t.organizationId === orgId));
        return [...filtered, saved];
      });
      setSavedRowIds((prev) => ({ ...prev, [orgId]: true }));
      setTimeout(() => {
        setSavedRowIds((prev) => ({ ...prev, [orgId]: false }));
      }, 2500);
      setSuccessMsg(`Target of ${targetVal.toLocaleString()} saved successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  // Handler: Batch Save All Group Targets
  const handleSaveAllGroups = async () => {
    if (!isSuperAdmin) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const items: TargetFormData[] = Object.entries(groupDrafts).map(([orgId, val]) => ({
        level: 'group',
        organizationId: orgId,
        target: val,
      }));

      const saved = await saveMultipleTargets(items, userProfile?.id || 'superAdmin');
      setTargets((prev) => {
        const savedIds = new Set(saved.map((s) => s.id));
        const filtered = prev.filter((t) => !savedIds.has(t.id));
        return [...filtered, ...saved];
      });

      setSuccessMsg(`Successfully saved all ${saved.length} group targets! Total: ${totalGroupTargetAllocated.toLocaleString()} souls.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Batch Save All Church Targets
  const handleSaveAllChurches = async () => {
    if (!isSuperAdmin) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const items: TargetFormData[] = Object.entries(churchDrafts).map(([orgId, val]) => ({
        level: 'church',
        organizationId: orgId,
        target: val,
      }));

      const saved = await saveMultipleTargets(items, userProfile?.id || 'superAdmin');
      setTargets((prev) => {
        const savedIds = new Set(saved.map((s) => s.id));
        const filtered = prev.filter((t) => !savedIds.has(t.id));
        return [...filtered, ...saved];
      });

      setSuccessMsg(`Successfully saved all ${saved.length} church targets! Total: ${totalChurchTargetAllocated.toLocaleString()} souls.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Single Target Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(singleTargetInput, 10);
    if (isNaN(num) || num <= 0) {
      setError('Target must be a valid positive number.');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await saveTarget(
        { level: singleLevel, organizationId: singleOrgId, target: num },
        userProfile?.id || 'superAdmin'
      );
      setTargets((prev) => {
        const filtered = prev.filter((t) => !(t.level === singleLevel && t.organizationId === singleOrgId));
        return [...filtered, saved];
      });

      if (singleLevel === 'group') {
        setGroupDrafts((prev) => ({ ...prev, [singleOrgId]: num }));
      } else if (singleLevel === 'church') {
        setChurchDrafts((prev) => ({ ...prev, [singleOrgId]: num }));
      } else if (singleLevel === 'pcf') {
        setPcfDrafts((prev) => ({ ...prev, [singleOrgId]: num }));
      }

      setSuccessMsg(`Saved target of ${num.toLocaleString()} souls for ${singleLevel.toUpperCase()}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="account-card empty-card">
        <AlertCircle size={32} className="text-gold" />
        <h3 className="account-title">Target Management Restricted</h3>
        <p className="account-lead">
          Managing organizational targets is reserved for SuperAdmin accounts only.
        </p>
      </div>
    );
  }

  // Filtered lists
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
      g.code.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredChurches = churches.filter((c) => {
    const matchesGroup = selectedGroupFilter === 'all' || c.groupId === selectedGroupFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(churchSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(churchSearch.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const filteredPcfs = pcfs.filter((p) => {
    return pcfChurchFilter === 'all' || p.churchId === pcfChurchFilter;
  });

  return (
    <div className="account-card" style={{ maxWidth: '1150px', margin: '0 auto' }}>
      {/* Header */}
      <div className="form-header" style={{ marginBottom: '20px' }}>
        <TargetIcon size={26} className="text-green-accent" />
        <div>
          <h2 className="form-title">TARGET CONFIGURATION MATRIX</h2>
          <p className="form-lead">
            Manage target soul-winning goals for the Zone, Groups, Churches, and PCFs with live progress tracking and bulk editing.
          </p>
        </div>
      </div>

      {/* TOP SUMMARY STATS BAR */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>TOTAL ZONAL TARGET</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#00ff87' }}>
            {zonalTargetGoal.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SOULS</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>SUM OF GROUP TARGETS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffd60a' }}>
            {totalGroupTargetAllocated.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SOULS</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: totalGroupTargetAllocated >= zonalTargetGoal ? '#4ade80' : '#f87171' }}>
            {((totalGroupTargetAllocated / zonalTargetGoal) * 100).toFixed(1)}% of Zonal Target
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>SUM OF CHURCH TARGETS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#60a5fa' }}>
            {totalChurchTargetAllocated.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SOULS</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            Across {churches.length} active churches
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>TOTAL SOULS WON (LIVE)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>
            {records.length.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#00ff87' }}>SOULS</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>
            {((records.length / zonalTargetGoal) * 100).toFixed(1)}% achieved
          </span>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-box" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MATRIX SUBTABS */}
      <div className="admin-subtabs" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('groups'); setError(null); setSuccessMsg(null); }}
          className={`subtab-btn ${activeTab === 'groups' ? 'subtab-active' : ''}`}
        >
          <Users size={15} className="inline-icon" /> GROUPS TARGETS ({groups.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('churches'); setError(null); setSuccessMsg(null); }}
          className={`subtab-btn ${activeTab === 'churches' ? 'subtab-active' : ''}`}
        >
          <Building size={15} className="inline-icon" /> CHURCHES TARGETS ({churches.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('pcfs'); setError(null); setSuccessMsg(null); }}
          className={`subtab-btn ${activeTab === 'pcfs' ? 'subtab-active' : ''}`}
        >
          PCFs TARGETS ({pcfs.length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('single'); setError(null); setSuccessMsg(null); }}
          className={`subtab-btn ${activeTab === 'single' ? 'subtab-active' : ''}`}
        >
          <TargetIcon size={15} className="inline-icon" /> QUICK SINGLE SETTER
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading targets and organizational units...
        </div>
      ) : activeTab === 'groups' ? (
        /* ================= TAB 1: GROUPS TARGET MATRIX ================= */
        <div>
          {/* Actions & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
              <input
                type="text"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="Search Group by name or code..."
                className="form-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveAllGroups}
              disabled={isSaving}
              className="btn-green-accent"
              style={{ padding: '10px 20px', fontWeight: '800' }}
            >
              <Save size={18} />
              <span>{isSaving ? 'SAVING GROUPS...' : 'SAVE ALL GROUP TARGETS'}</span>
            </button>
          </div>

          {/* Groups Table */}
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 16px' }}>GROUP NAME & CODE</th>
                  <th style={{ padding: '12px 16px' }}>CHURCHES</th>
                  <th style={{ padding: '12px 16px' }}>SOULS WON</th>
                  <th style={{ padding: '12px 16px' }}>TARGET GOAL (SOULS)</th>
                  <th style={{ padding: '12px 16px' }}>PROGRESS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((g) => {
                  const currentTarget = groupDrafts[g.id] || 0;
                  const actual = groupSoulsWon[g.id] || 0;
                  const pct = currentTarget > 0 ? Math.round((actual / currentTarget) * 100) : 0;
                  const churchCount = churches.filter((c) => c.groupId === g.id).length;
                  const isSaved = savedRowIds[g.id];

                  return (
                    <tr
                      key={g.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isSaved ? 'rgba(0, 255, 135, 0.08)' : 'transparent',
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{g.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code: {g.code}</span>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                        {churchCount} Churches
                      </td>

                      <td style={{ padding: '12px 16px', color: '#00ff87', fontWeight: '800' }}>
                        {actual.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={currentTarget}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setGroupDrafts((prev) => ({ ...prev, [g.id]: val }));
                          }}
                          className="form-input"
                          style={{ maxWidth: '140px', padding: '6px 10px', fontWeight: '700' }}
                        />
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            background: pct >= 75 ? 'rgba(0, 255, 135, 0.2)' : pct >= 50 ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                            color: pct >= 75 ? '#00ff87' : pct >= 50 ? '#ffd60a' : '#ff453a',
                          }}
                        >
                          {pct}%
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow('group', g.id, currentTarget)}
                          className={isSaved ? 'btn-green-accent' : 'secondary-button'}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Save this group's target"
                        >
                          {isSaved ? <Check size={14} /> : <Save size={14} />}
                          <span style={{ marginLeft: '4px' }}>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'churches' ? (
        /* ================= TAB 2: CHURCHES TARGET MATRIX ================= */
        <div>
          {/* Filters & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={churchSearch}
                  onChange={(e) => setChurchSearch(e.target.value)}
                  placeholder="Search Church name..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={16} className="text-gold" />
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '220px' }}
                >
                  <option value="all">All Groups ({churches.length} churches)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveAllChurches}
              disabled={isSaving}
              className="btn-green-accent"
              style={{ padding: '10px 20px', fontWeight: '800' }}
            >
              <Save size={18} />
              <span>{isSaving ? 'SAVING CHURCHES...' : 'SAVE ALL CHURCH TARGETS'}</span>
            </button>
          </div>

          {/* Churches Table */}
          <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 16px' }}>CHURCH NAME</th>
                  <th style={{ padding: '12px 16px' }}>PARENT GROUP</th>
                  <th style={{ padding: '12px 16px' }}>SOULS WON</th>
                  <th style={{ padding: '12px 16px' }}>TARGET GOAL (SOULS)</th>
                  <th style={{ padding: '12px 16px' }}>PROGRESS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredChurches.map((c) => {
                  const currentTarget = churchDrafts[c.id] || 0;
                  const actual = churchSoulsWon[c.id] || 0;
                  const pct = currentTarget > 0 ? Math.round((actual / currentTarget) * 100) : 0;
                  const parentGroup = groups.find((g) => g.id === c.groupId);
                  const isSaved = savedRowIds[c.id];

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        background: isSaved ? 'rgba(0, 255, 135, 0.08)' : 'transparent',
                        transition: 'background 0.3s ease',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{c.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code: {c.code}</span>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#ffd60a' }}>
                        {parentGroup?.name || 'Unassigned'}
                      </td>

                      <td style={{ padding: '12px 16px', color: '#00ff87', fontWeight: '800' }}>
                        {actual.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={currentTarget}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setChurchDrafts((prev) => ({ ...prev, [c.id]: val }));
                          }}
                          className="form-input"
                          style={{ maxWidth: '140px', padding: '6px 10px', fontWeight: '700' }}
                        />
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            background: pct >= 75 ? 'rgba(0, 255, 135, 0.2)' : pct >= 50 ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                            color: pct >= 75 ? '#00ff87' : pct >= 50 ? '#ffd60a' : '#ff453a',
                          }}
                        >
                          {pct}%
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow('church', c.id, currentTarget)}
                          className={isSaved ? 'btn-green-accent' : 'secondary-button'}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          title="Save this church's target"
                        >
                          {isSaved ? <Check size={14} /> : <Save size={14} />}
                          <span style={{ marginLeft: '4px' }}>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'pcfs' ? (
        /* ================= TAB 3: PCF TARGET MATRIX ================= */
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <Filter size={16} className="text-gold" />
            <select
              value={pcfChurchFilter}
              onChange={(e) => setPcfChurchFilter(e.target.value)}
              className="form-input"
              style={{ maxWidth: '300px' }}
            >
              <option value="all">All Churches ({pcfs.length} PCFs)</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 16px' }}>PCF NAME & CODE</th>
                  <th style={{ padding: '12px 16px' }}>CHURCH</th>
                  <th style={{ padding: '12px 16px' }}>SOULS WON</th>
                  <th style={{ padding: '12px 16px' }}>TARGET GOAL (SOULS)</th>
                  <th style={{ padding: '12px 16px' }}>PROGRESS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredPcfs.map((p) => {
                  const currentTarget = pcfDrafts[p.id] || 0;
                  const actual = pcfSoulsWon[p.id] || 0;
                  const pct = currentTarget > 0 ? Math.round((actual / currentTarget) * 100) : 0;
                  const parentChurch = churches.find((c) => c.id === p.churchId);
                  const isSaved = savedRowIds[p.id];

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{p.name}</div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code: {p.code}</span>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#4ade80' }}>
                        {parentChurch?.name || 'Unassigned'}
                      </td>

                      <td style={{ padding: '12px 16px', color: '#00ff87', fontWeight: '800' }}>
                        {actual.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={currentTarget}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setPcfDrafts((prev) => ({ ...prev, [p.id]: val }));
                          }}
                          className="form-input"
                          style={{ maxWidth: '120px', padding: '6px 10px', fontWeight: '700' }}
                        />
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: '800',
                            background: pct >= 75 ? 'rgba(0, 255, 135, 0.2)' : pct >= 50 ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                            color: pct >= 75 ? '#00ff87' : pct >= 50 ? '#ffd60a' : '#ff453a',
                          }}
                        >
                          {pct}%
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveSingleRow('pcf', p.id, currentTarget)}
                          className={isSaved ? 'btn-green-accent' : 'secondary-button'}
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          {isSaved ? <Check size={14} /> : <Save size={14} />}
                          <span style={{ marginLeft: '4px' }}>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= TAB 4: QUICK SINGLE SETTER ================= */
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ color: '#ffffff', fontSize: '1.1rem', marginBottom: '16px', fontWeight: '700' }}>
            SET INDIVIDUAL TARGET
          </h3>
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">ORGANIZATION LEVEL</label>
              <select
                value={singleLevel}
                onChange={(e) => handleSingleLevelChange(e.target.value as TargetLevel)}
                className="form-input"
              >
                <option value="zone">ZONE (Zonal Campaign Overall)</option>
                <option value="group">GROUP LEVEL</option>
                <option value="church">CHURCH LEVEL</option>
                <option value="pcf">PCF LEVEL</option>
              </select>
            </div>

            {singleLevel !== 'zone' && (
              <div className="form-group">
                <label className="form-label">SELECT {singleLevel.toUpperCase()}</label>
                <select
                  value={singleOrgId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSingleOrgId(id);
                    if (singleLevel === 'group') {
                      setSingleTargetInput((groupDrafts[id] || 1000).toString());
                    } else if (singleLevel === 'church') {
                      setSingleTargetInput((churchDrafts[id] || 250).toString());
                    } else if (singleLevel === 'pcf') {
                      setSingleTargetInput((pcfDrafts[id] || 50).toString());
                    }
                  }}
                  className="form-input"
                >
                  {singleLevel === 'group' &&
                    groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  {singleLevel === 'church' &&
                    churches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  {singleLevel === 'pcf' &&
                    pcfs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">TARGET SOUL GOAL</label>
              <input
                type="number"
                min="1"
                step="1"
                value={singleTargetInput}
                onChange={(e) => setSingleTargetInput(e.target.value)}
                placeholder="e.g. 5000"
                className="form-input"
                required
              />
            </div>

            <button type="submit" disabled={isSaving} className="btn-green-accent btn-large" style={{ width: '100%' }}>
              <Save size={18} />
              <span>{isSaving ? 'SAVING TARGET...' : 'SAVE TARGET'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
