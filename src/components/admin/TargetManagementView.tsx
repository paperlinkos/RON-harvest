import React, { useState, useEffect } from 'react';
import { Target as TargetIcon, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTargets, saveTarget } from '../../services/targetService';
import { getGroups, getChurches, getPCFs } from '../../services/organizationService';
import { REACH_OUT_NIGERIA_EVENT } from '../../config/eventConfig';
import type { Target, TargetLevel, TargetFormData } from '../../types/target';
import type { Group, Church, PCF } from '../../types/organization';

export const TargetManagementView: React.FC = () => {
  const { userProfile, role } = useAuth();
  const isSuperAdmin = role === 'superAdmin';

  const [targets, setTargets] = useState<Target[]>([]);
  const [level, setLevel] = useState<TargetLevel>('zone');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [targetInput, setTargetInput] = useState<string>('40000');
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [pcfs, setPcfs] = useState<PCF[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, gList, cList, pList] = await Promise.all([
        getTargets(),
        getGroups(),
        getChurches(),
        getPCFs(),
      ]);
      setTargets(tList);
      setGroups(gList);
      setChurches(cList);
      setPcfs(pList);
    } catch (err) {
      console.warn('Error loading target data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill selection based on level change
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);

    if (level === 'zone') {
      setSelectedOrgId('default_zone');
      const existingZone = targets.find((t) => t.level === 'zone');
      setTargetInput(existingZone ? existingZone.target.toString() : REACH_OUT_NIGERIA_EVENT.nationalTarget.toString());
    } else if (level === 'group') {
      if (groups.length > 0) {
        setSelectedOrgId(groups[0].id);
        const existing = targets.find((t) => t.level === 'group' && t.organizationId === groups[0].id);
        setTargetInput(existing ? existing.target.toString() : '5000');
      } else {
        setSelectedOrgId('');
        setTargetInput('5000');
      }
    } else if (level === 'church') {
      if (churches.length > 0) {
        setSelectedOrgId(churches[0].id);
        const existing = targets.find((t) => t.level === 'church' && t.organizationId === churches[0].id);
        setTargetInput(existing ? existing.target.toString() : '1000');
      } else {
        setSelectedOrgId('');
        setTargetInput('1000');
      }
    } else if (level === 'pcf') {
      if (pcfs.length > 0) {
        setSelectedOrgId(pcfs[0].id);
        const existing = targets.find((t) => t.level === 'pcf' && t.organizationId === pcfs[0].id);
        setTargetInput(existing ? existing.target.toString() : '200');
      } else {
        setSelectedOrgId('');
        setTargetInput('200');
      }
    }
  }, [level, groups, churches, pcfs, targets]);

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const existing = targets.find((t) => t.level === level && t.organizationId === orgId);
    if (existing) {
      setTargetInput(existing.target.toString());
    }
  };

  const handleSubmitTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isSuperAdmin) {
      setError('Unauthorized: Target management is restricted to SuperAdmin.');
      return;
    }

    const numTarget = parseInt(targetInput, 10);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Target must be a valid positive number greater than zero.');
      return;
    }

    if (!selectedOrgId && level !== 'zone') {
      setError('Please select an organization.');
      return;
    }

    setIsSaving(true);
    try {
      const formData: TargetFormData = {
        level,
        organizationId: level === 'zone' ? 'default_zone' : selectedOrgId,
        target: numTarget,
      };

      const saved = await saveTarget(formData, userProfile?.id || 'superadmin');
      
      // Update targets in local state
      setTargets((prev) => {
        const filtered = prev.filter((t) => !(t.level === level && t.organizationId === formData.organizationId));
        return [...filtered, saved];
      });

      setSuccessMsg(`Successfully saved target of ${numTarget.toLocaleString()} souls for ${level.toUpperCase()}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to save target.');
    } finally {
      setIsSaving(false);
    }
  };

  const getOrgName = (t: Target): string => {
    if (t.level === 'zone') return 'Reach Out Nigeria Zone';
    if (t.level === 'group') return groups.find((g) => g.id === t.organizationId)?.name || t.organizationId;
    if (t.level === 'church') return churches.find((c) => c.id === t.organizationId)?.name || t.organizationId;
    if (t.level === 'pcf') return pcfs.find((p) => p.id === t.organizationId)?.name || t.organizationId;
    return t.organizationId;
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

  return (
    <div className="account-card">
      <div className="form-header">
        <TargetIcon size={24} className="text-green-accent" />
        <div>
          <h2 className="form-title">TARGET MANAGEMENT</h2>
          <p className="form-lead">Configure target soul-winning goals for Zone, Groups, Churches, and PCFs.</p>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-box">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Target Setting Form */}
      <form onSubmit={handleSubmitTarget} className="modal-form">
        <div className="form-group">
          <label className="form-label">ORGANIZATION LEVEL</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as TargetLevel)}
            className="form-input"
          >
            <option value="zone">ZONE (Zonal / Campaign Level)</option>
            <option value="group">GROUP LEVEL</option>
            <option value="church">CHURCH LEVEL</option>
            <option value="pcf">PCF LEVEL</option>
          </select>
        </div>

        {level !== 'zone' && (
          <div className="form-group">
            <label className="form-label">SELECT {level.toUpperCase()}</label>
            <select
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="form-input"
            >
              {level === 'group' &&
                groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              {level === 'church' &&
                churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              {level === 'pcf' &&
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
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="e.g. 40000"
            className="form-input"
            required
          />
        </div>

        <button type="submit" disabled={isSaving} className="btn-green-accent btn-large">
          <Save size={18} />
          <span>{isSaving ? 'SAVING TARGET...' : 'SAVE TARGET'}</span>
        </button>
      </form>

      {/* Existing Configured Targets Table */}
      <div className="submissions-section">
        <h3 className="submissions-title">CONFIGURED TARGETS</h3>
        {loading ? (
          <p className="text-muted">Loading targets...</p>
        ) : targets.length === 0 ? (
          <p className="text-muted">No custom targets saved yet. Using system default targets.</p>
        ) : (
          <div className="records-list">
            {targets.map((t) => (
              <div key={t.id} className="record-item">
                <div className="record-main">
                  <span className="record-name">{getOrgName(t)}</span>
                  <span className="hero-badge">{t.level.toUpperCase()}</span>
                </div>
                <div className="record-sub">
                  <span className="stat-value stat-green">{t.target.toLocaleString()} SOULS</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
