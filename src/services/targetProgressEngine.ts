import type { Target, TargetLevel, OrganizationProgress } from '../types/target';
import type { Group } from '../types/organization';

export interface CalculateProgressInput {
  organizationId: string;
  organizationName: string;
  organizationCode?: string;
  level: TargetLevel;
  actual: number;
  target?: number;
}

/**
 * Core Target + Progress Engine
 * Computes actual, target, uncapped percentage, normalized progress (0.0-1.0), and target exceeded status.
 */
export function calculateOrganizationProgress(input: CalculateProgressInput): OrganizationProgress {
  const { organizationId, organizationName, organizationCode, level, actual, target } = input;

  const validActual = Math.max(0, Math.floor(actual || 0));

  if (target === undefined || target === null || target <= 0 || isNaN(target)) {
    return {
      organizationId,
      organizationName,
      organizationCode,
      level,
      actual: validActual,
      target: 0,
      percentage: 0,
      normalizedProgress: 0,
      isTargetExceeded: false,
      hasTarget: false,
      displayPercentage: 'TARGET NOT SET',
    };
  }

  const rawPercentage = (validActual / target) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const normalizedProgress = Math.min(1.0, validActual / target);
  const isTargetExceeded = validActual > target;

  return {
    organizationId,
    organizationName,
    organizationCode,
    level,
    actual: validActual,
    target,
    percentage,
    normalizedProgress,
    isTargetExceeded,
    hasTarget: true,
    displayPercentage: `${percentage}%`,
  };
}

/**
 * Calculates aggregate progress across groups for the Upward Race
 */
export function calculateGroupRaceProgress(
  records: Array<{ groupId?: string }>,
  groups: Group[],
  targetsList: Target[],
  defaultGroupTarget: number = 5000
): OrganizationProgress[] {
  // 1. Calculate actual soul count per group ID from valid records
  const groupActualCounts = new Map<string, number>();

  records.forEach((rec) => {
    if (rec.groupId) {
      groupActualCounts.set(rec.groupId, (groupActualCounts.get(rec.groupId) || 0) + 1);
    }
  });

  // 2. Map targets by group organization ID
  const targetsMap = new Map<string, number>();
  targetsList.forEach((t) => {
    if (t.level === 'group' && t.status === 'active') {
      targetsMap.set(t.organizationId, t.target);
    }
  });

  // 3. Calculate progress for each group
  const results: OrganizationProgress[] = groups.map((g) => {
    const actual = groupActualCounts.get(g.id) || 0;
    const groupTarget = targetsMap.get(g.id) ?? defaultGroupTarget;

    return calculateOrganizationProgress({
      organizationId: g.id,
      organizationName: g.name,
      organizationCode: g.code,
      level: 'group',
      actual,
      target: groupTarget,
    });
  });

  // Sort competitors by percentage / actual souls descending
  results.sort((a, b) => b.percentage - a.percentage || b.actual - a.actual);

  return results;
}
