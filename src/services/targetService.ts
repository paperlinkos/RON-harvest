import { collection, doc, getDocs, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { REACH_OUT_NIGERIA_EVENT } from '../config/eventConfig';
import type { Target, TargetFormData } from '../types/target';

const TARGETS_COLLECTION = 'targets';

/** Fetches all active targets from Firestore */
export async function getTargets(): Promise<Target[]> {
  try {
    if (!navigator.onLine) {
      return getCachedLocalTargets();
    }
    const q = query(collection(db, TARGETS_COLLECTION), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    const targets: Target[] = [];
    snapshot.forEach((d) => {
      targets.push({ id: d.id, ...d.data() } as Target);
    });
    setCachedLocalTargets(targets);
    return targets;
  } catch (err) {
    console.warn('Error fetching targets from Firestore:', err);
    return getCachedLocalTargets();
  }
}

/** Saves or updates an organization target */
export async function saveTarget(
  formData: TargetFormData,
  userId: string
): Promise<Target> {
  if (formData.target <= 0 || isNaN(formData.target)) {
    throw new Error('Target must be a positive number greater than zero.');
  }

  const targetId = `${REACH_OUT_NIGERIA_EVENT.id}_${formData.level}_${formData.organizationId}`;
  const now = new Date().toISOString();

  const targetData: Target = {
    id: targetId,
    eventId: REACH_OUT_NIGERIA_EVENT.id,
    level: formData.level,
    organizationId: formData.organizationId,
    target: Math.round(formData.target),
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
    status: 'active',
  };

  if (navigator.onLine) {
    try {
      const docRef = doc(db, TARGETS_COLLECTION, targetId);
      await setDoc(docRef, targetData, { merge: true });
    } catch (err) {
      console.warn('Error saving target to Firestore:', err);
    }
  }

  // Update local cache
  const local = getCachedLocalTargets();
  const idx = local.findIndex((t) => t.id === targetId);
  if (idx >= 0) {
    local[idx] = targetData;
  } else {
    local.push(targetData);
  }
  setCachedLocalTargets(local);

  return targetData;
}

/** Saves or updates multiple organization targets in batch */
export async function saveMultipleTargets(
  targetsList: TargetFormData[],
  userId: string
): Promise<Target[]> {
  const now = new Date().toISOString();
  const savedTargets: Target[] = [];
  const local = getCachedLocalTargets();

  for (const item of targetsList) {
    if (item.target <= 0 || isNaN(item.target)) continue;

    const targetId = `${REACH_OUT_NIGERIA_EVENT.id}_${item.level}_${item.organizationId}`;
    const targetData: Target = {
      id: targetId,
      eventId: REACH_OUT_NIGERIA_EVENT.id,
      level: item.level,
      organizationId: item.organizationId,
      target: Math.round(item.target),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      status: 'active',
    };

    savedTargets.push(targetData);

    const idx = local.findIndex((t) => t.id === targetId);
    if (idx >= 0) {
      local[idx] = targetData;
    } else {
      local.push(targetData);
    }
  }

  // Update local cache
  setCachedLocalTargets(local);

  // Sync to Firestore if online
  if (navigator.onLine) {
    try {
      const promises = savedTargets.map((td) => {
        const docRef = doc(db, TARGETS_COLLECTION, td.id);
        return setDoc(docRef, td, { merge: true });
      });
      await Promise.all(promises);
    } catch (err) {
      console.warn('Error saving batch targets to Firestore:', err);
    }
  }

  return savedTargets;
}


/** Subscribes to realtime updates on targets */
export function subscribeToTargets(onUpdate: (targets: Target[]) => void): () => void {
  if (!navigator.onLine) {
    onUpdate(getCachedLocalTargets());
    return () => {};
  }

  try {
    const q = query(collection(db, TARGETS_COLLECTION), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const targets: Target[] = [];
        snapshot.forEach((d) => {
          targets.push({ id: d.id, ...d.data() } as Target);
        });
        setCachedLocalTargets(targets);
        onUpdate(targets);
      },
      (err) => {
        console.warn('Target subscription error:', err);
        onUpdate(getCachedLocalTargets());
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to subscribe to targets:', err);
    onUpdate(getCachedLocalTargets());
    return () => {};
  }
}

// Local cache helpers for offline resiliency
const LOCAL_TARGETS_KEY = 'ron_cached_targets';

function getCachedLocalTargets(): Target[] {
  try {
    const data = localStorage.getItem(LOCAL_TARGETS_KEY);
    return data ? JSON.parse(data) : getDefaultInitialTargets();
  } catch {
    return getDefaultInitialTargets();
  }
}

function setCachedLocalTargets(targets: Target[]): void {
  try {
    localStorage.setItem(LOCAL_TARGETS_KEY, JSON.stringify(targets));
  } catch (err) {
    console.warn('Failed to cache targets in localStorage:', err);
  }
}

const OFFICIAL_TARGET_MAP: { orgId: string; level: 'zone' | 'group' | 'church'; target: number }[] = [
  { orgId: 'zone-abuja-1', level: 'zone', target: 40000 },
  { orgId: 'default_zone', level: 'zone', target: 40000 },

  // Groups
  { orgId: 'grp-wuye-1', level: 'group', target: 1000 },
  { orgId: 'grp-wuye-2', level: 'group', target: 1000 },
  { orgId: 'grp-karmo', level: 'group', target: 500 },
  { orgId: 'grp-gwarinpa', level: 'group', target: 2000 },
  { orgId: 'grp-fruitful-vine', level: 'group', target: 500 },
  { orgId: 'grp-kubwa-1', level: 'group', target: 3000 },
  { orgId: 'grp-kubwa-2', level: 'group', target: 500 },
  { orgId: 'grp-bwari', level: 'group', target: 2000 },
  { orgId: 'grp-new-horizon', level: 'group', target: 2000 },
  { orgId: 'grp-gwagwalada-1', level: 'group', target: 2000 },
  { orgId: 'grp-gwagwalada-2', level: 'group', target: 2000 },
  { orgId: 'grp-kuje', level: 'group', target: 2000 },
  { orgId: 'grp-lokogoma', level: 'group', target: 2000 },
  { orgId: 'grp-dei-dei', level: 'group', target: 2000 },
  { orgId: 'grp-airport-road', level: 'group', target: 1000 },
  { orgId: 'grp-dutse-makaranta', level: 'group', target: 1000 },
  { orgId: 'grp-city-church', level: 'group', target: 1000 },
  { orgId: 'grp-teens-church', level: 'group', target: 1500 },

  // Churches
  { orgId: 'ch-ce-kbs', level: 'church', target: 400 },
  { orgId: 'ch-ce-lighthouse', level: 'church', target: 280 },
  { orgId: 'ch-ce-koinonia', level: 'church', target: 260 },
  { orgId: 'ch-ce-kbs-2', level: 'church', target: 30 },
  { orgId: 'ch-ce-kbs-3', level: 'church', target: 30 },
  { orgId: 'ch-ce-express', level: 'church', target: 530 },
  { orgId: 'ch-ce-livingspring', level: 'church', target: 240 },
  { orgId: 'ch-ce-pacesetters', level: 'church', target: 230 },
  { orgId: 'ch-ce-karmo', level: 'church', target: 330 },
  { orgId: 'ch-ce-dape', level: 'church', target: 20 },
  { orgId: 'ch-ce-karmo-2', level: 'church', target: 20 },
  { orgId: 'ch-ce-kagini', level: 'church', target: 130 },
  { orgId: 'ch-ce-gwarinpa-1', level: 'church', target: 1350 },
  { orgId: 'ch-ce-precious-place', level: 'church', target: 260 },
  { orgId: 'ch-ce-word-arena', level: 'church', target: 110 },
  { orgId: 'ch-ce-kagini-2', level: 'church', target: 100 },
  { orgId: 'ch-ce-flourish', level: 'church', target: 130 },
  { orgId: 'ch-ce-karsana', level: 'church', target: 50 },
  { orgId: 'ch-ce-solution-arena', level: 'church', target: 100 },
  { orgId: 'ch-ce-jahi', level: 'church', target: 200 },
  { orgId: 'ch-ce-kado-2', level: 'church', target: 200 },
  { orgId: 'ch-ce-kubwa', level: 'church', target: 1550 },
  { orgId: 'ch-ce-katampe-ext', level: 'church', target: 500 },
  { orgId: 'ch-ce-kubwa-3', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-4', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-5', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-6', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-8', level: 'church', target: 50 },
  { orgId: 'ch-ce-kubwa-9', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-10', level: 'church', target: 150 },
  { orgId: 'ch-ce-mpape', level: 'church', target: 50 },
  { orgId: 'ch-ce-mabuchi', level: 'church', target: 100 },
  { orgId: 'ch-ce-kaba', level: 'church', target: 100 },
  { orgId: 'ch-ce-kubwa-ext', level: 'church', target: 100 },
  { orgId: 'ch-ce-channel-8', level: 'church', target: 100 },
  { orgId: 'ch-ce-guidna', level: 'church', target: 100 },
  { orgId: 'ch-ce-grace-and-glory', level: 'church', target: 100 },
  { orgId: 'ch-ce-obasanjo-road', level: 'church', target: 100 },
  { orgId: 'ch-ce-bwari-main', level: 'church', target: 1000 },
  { orgId: 'ch-ce-kuchiko', level: 'church', target: 200 },
  { orgId: 'ch-ce-piawe', level: 'church', target: 100 },
  { orgId: 'ch-ce-peyi', level: 'church', target: 200 },
  { orgId: 'ch-ce-scc', level: 'church', target: 50 },
  { orgId: 'ch-ce-kogo', level: 'church', target: 250 },
  { orgId: 'ch-ce-lambent', level: 'church', target: 100 },
  { orgId: 'ch-ce-garam', level: 'church', target: 100 },
  { orgId: 'ch-ce-ushafa', level: 'church', target: 1350 },
  { orgId: 'ch-ce-kogo-3', level: 'church', target: 150 },
  { orgId: 'ch-ce-dutse-zone-3', level: 'church', target: 150 },
  { orgId: 'ch-ce-dutse', level: 'church', target: 250 },
  { orgId: 'ch-ce-guto', level: 'church', target: 100 },
  { orgId: 'ch-ce-gwagwalada-1', level: 'church', target: 1000 },
  { orgId: 'ch-ce-zuba', level: 'church', target: 100 },
  { orgId: 'ch-ce-gwagwalada-4', level: 'church', target: 50 },
  { orgId: 'ch-ce-gwagwalada-7', level: 'church', target: 50 },
  { orgId: 'ch-ce-tunga-maje', level: 'church', target: 750 },
  { orgId: 'ch-ce-kwali', level: 'church', target: 50 },
  { orgId: 'ch-ce-gwagwalada-2', level: 'church', target: 1000 },
  { orgId: 'ch-ce-gwagwalada-3', level: 'church', target: 400 },
  { orgId: 'ch-ce-anagada', level: 'church', target: 250 },
  { orgId: 'ch-ce-gwagwalada-6', level: 'church', target: 250 },
  { orgId: 'ch-ce-chukunku', level: 'church', target: 100 },
  { orgId: 'ch-ce-kuje', level: 'church', target: 880 },
  { orgId: 'ch-ce-kuje-2', level: 'church', target: 380 },
  { orgId: 'ch-ce-kuje-3', level: 'church', target: 130 },
  { orgId: 'ch-ce-kuje-4', level: 'church', target: 150 },
  { orgId: 'ch-ce-kuje-5', level: 'church', target: 130 },
  { orgId: 'ch-ce-iddo-sarki', level: 'church', target: 110 },
  { orgId: 'ch-ce-kuje-6', level: 'church', target: 120 },
  { orgId: 'ch-ce-kuje-7', level: 'church', target: 50 },
  { orgId: 'ch-ce-kuje-8', level: 'church', target: 50 },
  { orgId: 'ch-ce-lokogoma', level: 'church', target: 1100 },
  { orgId: 'ch-ce-kabusa', level: 'church', target: 100 },
  { orgId: 'ch-ce-durumi', level: 'church', target: 100 },
  { orgId: 'ch-ce-apo', level: 'church', target: 100 },
  { orgId: 'ch-ce-apo-dutse', level: 'church', target: 100 },
  { orgId: 'ch-ce-wumba', level: 'church', target: 50 },
  { orgId: 'ch-ce-gbuduwyi', level: 'church', target: 100 },
  { orgId: 'ch-ce-damagaza', level: 'church', target: 100 },
  { orgId: 'ch-ce-pigbakasa', level: 'church', target: 100 },
  { orgId: 'ch-ce-city-of-david', level: 'church', target: 100 },
  { orgId: 'ch-ce-citadel-of-grace', level: 'church', target: 50 },
  { orgId: 'ch-ce-deidei-2', level: 'church', target: 2000 },
  { orgId: 'ch-ce-airport-road', level: 'church', target: 420 },
  { orgId: 'ch-ce-airport-road-2', level: 'church', target: 290 },
  { orgId: 'ch-ce-airport-road-4', level: 'church', target: 30 },
  { orgId: 'ch-ce-kapwa', level: 'church', target: 260 },
  { orgId: 'ch-ce-dutse-makaranta', level: 'church', target: 740 },
  { orgId: 'ch-ce-garki-1', level: 'church', target: 100 },
  { orgId: 'ch-ce-springtime', level: 'church', target: 80 },
  { orgId: 'ch-ce-new-jerusalem', level: 'church', target: 50 },
  { orgId: 'ch-ce-mbuko', level: 'church', target: 30 },
  { orgId: 'ch-ce-city-church', level: 'church', target: 1000 },
  { orgId: 'ch-teens-church', level: 'church', target: 1500 },
  { orgId: 'ch-ce-byazhin', level: 'church', target: 500 },
  { orgId: 'ch-ce-wealthy-place', level: 'church', target: 500 },
];

function getDefaultInitialTargets(): Target[] {
  const now = new Date().toISOString();
  return OFFICIAL_TARGET_MAP.map((item) => ({
    id: `${REACH_OUT_NIGERIA_EVENT.id}_${item.level}_${item.orgId}`,
    eventId: REACH_OUT_NIGERIA_EVENT.id,
    level: item.level,
    organizationId: item.orgId,
    target: item.target,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    updatedBy: 'system',
    status: 'active',
  }));
}
