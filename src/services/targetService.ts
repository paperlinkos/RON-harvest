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

function getDefaultInitialTargets(): Target[] {
  return [
    {
      id: `${REACH_OUT_NIGERIA_EVENT.id}_zone_default`,
      eventId: REACH_OUT_NIGERIA_EVENT.id,
      level: 'zone',
      organizationId: 'default_zone',
      target: REACH_OUT_NIGERIA_EVENT.nationalTarget, // 40,000 SOULS
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
      status: 'active',
    },
  ];
}
