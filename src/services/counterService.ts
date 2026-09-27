import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { getAllLocalRecords } from './indexedDbService';
import { subscribeToSyncStatus } from './syncService';
import { getGroups } from './organizationService';
import { getTargets, subscribeToTargets } from './targetService';
import { calculateOrganizationProgress, calculateGroupRaceProgress } from './targetProgressEngine';
import type { Group } from '../types/organization';
import type { OrganizationProgress } from '../types/target';

export interface GroupRaceCompetitor {
  id: string;
  name: string;
  code: string;
  soulsWon: number;
  percentage: number;
  normalizedProgress: number;
  target: number;
  hasTarget: boolean;
  isTargetExceeded: boolean;
  displayPercentage: string;
}

export interface ZonalCounterData {
  totalSoulsWon: number;
  zonalTarget: number;
  percentageAchieved: number;
  groupCompetitors: GroupRaceCompetitor[];
  groupProgresses: OrganizationProgress[];
  // Alias for backward compatibility
  nationalTarget: number;
}

export type NationalCounterData = ZonalCounterData;

type CounterListener = (data: ZonalCounterData) => void;

/** Subscribes to realtime zonal soul count, targets, and group race aggregations */
export function subscribeToZonalCounter(
  zonalTarget: number,
  onUpdate: CounterListener
): () => void {
  let isMounted = true;
  let currentFirestoreDocs: any[] | undefined = undefined;
  let currentTargets = getTargets();

  const calculateAggregates = async () => {
    try {
      // 1. Fetch local records (includes pending offline submissions)
      const localRecords = await getAllLocalRecords();

      // Combine local records and Firestore records by unique ID to prevent duplicates
      const recordMap = new Map<string, any>();

      if (currentFirestoreDocs) {
        currentFirestoreDocs.forEach((doc) => {
          const data = doc.data();
          recordMap.set(data.id || doc.id, data);
        });
      }

      localRecords.forEach((rec) => {
        if (!recordMap.has(rec.id)) {
          recordMap.set(rec.id, rec);
        }
      });

      const allRecords = Array.from(recordMap.values());
      const totalSoulsWon = allRecords.length;

      // Determine Zonal Target (from custom target if configured, else default)
      const targetsList = await currentTargets;
      const zoneTargetObj = targetsList.find((t) => t.level === 'zone' && t.status === 'active');
      const activeZoneTarget = zoneTargetObj ? zoneTargetObj.target : zonalTarget;

      const zoneProgress = calculateOrganizationProgress({
        organizationId: 'zone',
        organizationName: 'Reach Out Nigeria Zone',
        level: 'zone',
        actual: totalSoulsWon,
        target: activeZoneTarget,
      });

      // 2. Aggregate Group race progress using Target + Progress Engine
      const groupsList: Group[] = await getGroups();
      const groupProgresses = calculateGroupRaceProgress(allRecords, groupsList, targetsList);

      const groupCompetitors: GroupRaceCompetitor[] = groupProgresses.map((p) => ({
        id: p.organizationId,
        name: p.organizationName,
        code: p.organizationCode || p.organizationName,
        soulsWon: p.actual,
        percentage: p.percentage,
        normalizedProgress: p.normalizedProgress,
        target: p.target,
        hasTarget: p.hasTarget,
        isTargetExceeded: p.isTargetExceeded,
        displayPercentage: p.displayPercentage,
      }));

      if (isMounted) {
        onUpdate({
          totalSoulsWon,
          zonalTarget: activeZoneTarget,
          nationalTarget: activeZoneTarget,
          percentageAchieved: zoneProgress.percentage,
          groupCompetitors,
          groupProgresses,
        });
      }
    } catch (err) {
      console.warn('Error calculating zonal aggregates:', err);
    }
  };

  // Subscribe to local record & sync updates
  const unsubscribeSync = subscribeToSyncStatus(() => {
    calculateAggregates();
  });

  // Subscribe to Targets realtime changes
  const unsubscribeTargets = subscribeToTargets((newTargets) => {
    currentTargets = Promise.resolve(newTargets);
    calculateAggregates();
  });

  // Initial calculation
  calculateAggregates();

  // Firestore Realtime Listener for Records
  if (navigator.onLine) {
    try {
      const q = query(collection(db, 'soulWinningRecords'));
      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          currentFirestoreDocs = snapshot.docs;
          calculateAggregates();
        },
        (error) => {
          console.warn('Realtime counter snapshot error:', error);
          calculateAggregates();
        }
      );

      return () => {
        isMounted = false;
        unsubscribeSync();
        unsubscribeTargets();
        unsubscribeFirestore();
      };
    } catch (err) {
      console.warn('Failed to attach Firestore snapshot listener:', err);
    }
  }

  return () => {
    isMounted = false;
    unsubscribeSync();
    unsubscribeTargets();
  };
}

export const subscribeToNationalCounter = subscribeToZonalCounter;
