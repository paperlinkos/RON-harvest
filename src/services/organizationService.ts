import { collection, doc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Zone, Group, Church, PCF, EntityStatus } from '../types/organization';
import { generateUUID } from '../utils/uuid';
import { writeAdminAuditLog } from './userService';

const ORG_STORAGE_KEY = 'ron_organizations_cache';

interface LocalOrgCache {
  zones: Zone[];
  groups: Group[];
  churches: Church[];
  pcfs: PCF[];
}

export const DEFAULT_ZONES: Zone[] = [
  { id: 'zone-abuja-1', name: 'Abuja Zone 1', code: 'ABZ1', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }
];

export const DEFAULT_GROUPS: Group[] = [
  { id: 'grp-central', zoneId: 'zone-abuja-1', name: 'Central Group', code: 'CGP', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'grp-east', zoneId: 'zone-abuja-1', name: 'East Group', code: 'EGP', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }
];

export const DEFAULT_CHURCHES: Church[] = [
  { id: 'ch-cathedral', groupId: 'grp-central', name: 'Abuja Cathedral', code: 'ACH', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'ch-grace', groupId: 'grp-central', name: 'Grace Church', code: 'GCH', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }
];

function getLocalOrgCache(): LocalOrgCache {
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY);
    if (!raw) {
      const initial: LocalOrgCache = {
        zones: DEFAULT_ZONES,
        groups: DEFAULT_GROUPS,
        churches: DEFAULT_CHURCHES,
        pcfs: [],
      };
      saveLocalOrgCache(initial);
      return initial;
    }
    const parsed: LocalOrgCache = JSON.parse(raw);
    if (!parsed.zones || parsed.zones.length === 0) parsed.zones = DEFAULT_ZONES;
    if (!parsed.groups || parsed.groups.length === 0) parsed.groups = DEFAULT_GROUPS;
    if (!parsed.churches || parsed.churches.length === 0) parsed.churches = DEFAULT_CHURCHES;
    if (!parsed.pcfs) parsed.pcfs = [];
    return parsed;
  } catch {
    return {
      zones: DEFAULT_ZONES,
      groups: DEFAULT_GROUPS,
      churches: DEFAULT_CHURCHES,
      pcfs: [],
    };
  }
}

function saveLocalOrgCache(cache: LocalOrgCache) {
  try {
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Failed to save local org cache:', err);
  }
}

// ZONES
export async function getZones(): Promise<Zone[]> {
  if (!navigator.onLine) {
    return getLocalOrgCache().zones;
  }
  try {
    const snapshot = await getDocs(collection(db, 'zones'));
    const zones = snapshot.docs.map((d) => d.data() as Zone);
    const cache = getLocalOrgCache();
    cache.zones = zones;
    saveLocalOrgCache(cache);
    return zones;
  } catch (err) {
    console.warn('Error fetching zones from Firestore:', err);
    return getLocalOrgCache().zones;
  }
}

export async function createZone(name: string, code: string, actorId: string = 'superAdmin'): Promise<Zone> {
  const cleanCode = code.trim().toUpperCase();
  const existing = await getZones();
  if (existing.some((z) => z.code === cleanCode)) {
    throw new Error(`Zone code "${cleanCode}" already exists.`);
  }

  const nowIso = new Date().toISOString();
  const newZone: Zone = {
    id: `zone_${generateUUID()}`,
    name: name.trim(),
    code: cleanCode,
    status: 'active',
    createdAt: nowIso,
  };

  if (navigator.onLine) {
    await setDoc(doc(db, 'zones', newZone.id), newZone);
  }

  const cache = getLocalOrgCache();
  cache.zones.push(newZone);
  saveLocalOrgCache(cache);

  await writeAdminAuditLog('organization_created', actorId, newZone.id, `Created Zone ${newZone.name}`);

  return newZone;
}

export async function updateZoneStatus(zoneId: string, status: EntityStatus, actorId: string = 'superAdmin'): Promise<void> {
  if (navigator.onLine) {
    await updateDoc(doc(db, 'zones', zoneId), { status });
  }
  const cache = getLocalOrgCache();
  const target = cache.zones.find((z) => z.id === zoneId);
  if (target) target.status = status;
  saveLocalOrgCache(cache);

  await writeAdminAuditLog(
    status === 'inactive' ? 'organization_deactivated' : 'organization_updated',
    actorId,
    zoneId,
    `Set Zone status to ${status}`
  );
}

// GROUPS
export async function getGroups(zoneId?: string): Promise<Group[]> {
  if (!navigator.onLine) {
    const all = getLocalOrgCache().groups;
    return zoneId ? all.filter((g) => g.zoneId === zoneId) : all;
  }
  try {
    const colRef = collection(db, 'groups');
    const q = zoneId ? query(colRef, where('zoneId', '==', zoneId)) : colRef;
    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map((d) => d.data() as Group);
    
    const cache = getLocalOrgCache();
    if (!zoneId) cache.groups = groups;
    saveLocalOrgCache(cache);
    return groups;
  } catch (err) {
    console.warn('Error fetching groups from Firestore:', err);
    const all = getLocalOrgCache().groups;
    return zoneId ? all.filter((g) => g.zoneId === zoneId) : all;
  }
}

export async function createGroup(name: string, code: string, zoneId: string, actorId: string = 'superAdmin'): Promise<Group> {
  const zones = await getZones();
  const parentZone = zones.find((z) => z.id === zoneId);
  if (!parentZone) {
    throw new Error('Hierarchy Error: Selected Zone does not exist.');
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await getGroups();
  if (existing.some((g) => g.code === cleanCode && g.zoneId === zoneId)) {
    throw new Error(`Group code "${cleanCode}" already exists in this Zone.`);
  }

  const nowIso = new Date().toISOString();
  const newGroup: Group = {
    id: `group_${generateUUID()}`,
    name: name.trim(),
    code: cleanCode,
    zoneId,
    status: 'active',
    createdAt: nowIso,
  };

  if (navigator.onLine) {
    await setDoc(doc(db, 'groups', newGroup.id), newGroup);
  }

  const cache = getLocalOrgCache();
  cache.groups.push(newGroup);
  saveLocalOrgCache(cache);

  await writeAdminAuditLog('organization_created', actorId, newGroup.id, `Created Group ${newGroup.name}`);

  return newGroup;
}

export async function updateGroupStatus(groupId: string, status: EntityStatus, actorId: string = 'superAdmin'): Promise<void> {
  if (navigator.onLine) {
    await updateDoc(doc(db, 'groups', groupId), { status });
  }
  const cache = getLocalOrgCache();
  const target = cache.groups.find((g) => g.id === groupId);
  if (target) target.status = status;
  saveLocalOrgCache(cache);

  await writeAdminAuditLog(
    status === 'inactive' ? 'organization_deactivated' : 'organization_updated',
    actorId,
    groupId,
    `Set Group status to ${status}`
  );
}

// CHURCHES
export async function getChurches(groupId?: string): Promise<Church[]> {
  if (!navigator.onLine) {
    const all = getLocalOrgCache().churches;
    return groupId ? all.filter((c) => c.groupId === groupId) : all;
  }
  try {
    const colRef = collection(db, 'churches');
    const q = groupId ? query(colRef, where('groupId', '==', groupId)) : colRef;
    const snapshot = await getDocs(q);
    const churches = snapshot.docs.map((d) => d.data() as Church);
    
    const cache = getLocalOrgCache();
    if (!groupId) cache.churches = churches;
    saveLocalOrgCache(cache);
    return churches;
  } catch (err) {
    console.warn('Error fetching churches from Firestore:', err);
    const all = getLocalOrgCache().churches;
    return groupId ? all.filter((c) => c.groupId === groupId) : all;
  }
}

export async function createChurch(name: string, code: string, groupId: string, actorId: string = 'superAdmin'): Promise<Church> {
  const groups = await getGroups();
  const parentGroup = groups.find((g) => g.id === groupId);
  if (!parentGroup) {
    throw new Error('Hierarchy Error: Selected Group does not exist.');
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await getChurches();
  if (existing.some((c) => c.code === cleanCode && c.groupId === groupId)) {
    throw new Error(`Church code "${cleanCode}" already exists in this Group.`);
  }

  const nowIso = new Date().toISOString();
  const newChurch: Church = {
    id: `church_${generateUUID()}`,
    name: name.trim(),
    code: cleanCode,
    groupId,
    status: 'active',
    createdAt: nowIso,
  };

  if (navigator.onLine) {
    await setDoc(doc(db, 'churches', newChurch.id), newChurch);
  }

  const cache = getLocalOrgCache();
  cache.churches.push(newChurch);
  saveLocalOrgCache(cache);

  await writeAdminAuditLog('organization_created', actorId, newChurch.id, `Created Church ${newChurch.name}`);

  return newChurch;
}

export async function updateChurchStatus(churchId: string, status: EntityStatus, actorId: string = 'superAdmin'): Promise<void> {
  if (navigator.onLine) {
    await updateDoc(doc(db, 'churches', churchId), { status });
  }
  const cache = getLocalOrgCache();
  const target = cache.churches.find((c) => c.id === churchId);
  if (target) target.status = status;
  saveLocalOrgCache(cache);

  await writeAdminAuditLog(
    status === 'inactive' ? 'organization_deactivated' : 'organization_updated',
    actorId,
    churchId,
    `Set Church status to ${status}`
  );
}

// PCFs
export async function getPCFs(churchId?: string): Promise<PCF[]> {
  if (!navigator.onLine) {
    const all = getLocalOrgCache().pcfs;
    return churchId ? all.filter((p) => p.churchId === churchId) : all;
  }
  try {
    const colRef = collection(db, 'pcfs');
    const q = churchId ? query(colRef, where('churchId', '==', churchId)) : colRef;
    const snapshot = await getDocs(q);
    const pcfs = snapshot.docs.map((d) => d.data() as PCF);
    
    const cache = getLocalOrgCache();
    if (!churchId) cache.pcfs = pcfs;
    saveLocalOrgCache(cache);
    return pcfs;
  } catch (err) {
    console.warn('Error fetching PCFs from Firestore:', err);
    const all = getLocalOrgCache().pcfs;
    return churchId ? all.filter((p) => p.churchId === churchId) : all;
  }
}

export async function createPCF(name: string, code: string, churchId: string, actorId: string = 'superAdmin'): Promise<PCF> {
  const churches = await getChurches();
  const parentChurch = churches.find((c) => c.id === churchId);
  if (!parentChurch) {
    throw new Error('Hierarchy Error: Selected Church does not exist.');
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await getPCFs();
  if (existing.some((p) => p.code === cleanCode && p.churchId === churchId)) {
    throw new Error(`PCF code "${cleanCode}" already exists in this Church.`);
  }

  const nowIso = new Date().toISOString();
  const newPCF: PCF = {
    id: `pcf_${generateUUID()}`,
    name: name.trim(),
    code: cleanCode,
    churchId,
    status: 'active',
    createdAt: nowIso,
  };

  if (navigator.onLine) {
    await setDoc(doc(db, 'pcfs', newPCF.id), newPCF);
  }

  const cache = getLocalOrgCache();
  cache.pcfs.push(newPCF);
  saveLocalOrgCache(cache);

  await writeAdminAuditLog('organization_created', actorId, newPCF.id, `Created PCF ${newPCF.name}`);

  return newPCF;
}

export async function updatePCFStatus(pcfId: string, status: EntityStatus, actorId: string = 'superAdmin'): Promise<void> {
  if (navigator.onLine) {
    await updateDoc(doc(db, 'pcfs', pcfId), { status });
  }
  const cache = getLocalOrgCache();
  const target = cache.pcfs.find((p) => p.id === pcfId);
  if (target) target.status = status;
  saveLocalOrgCache(cache);

  await writeAdminAuditLog(
    status === 'inactive' ? 'organization_deactivated' : 'organization_updated',
    actorId,
    pcfId,
    `Set PCF status to ${status}`
  );
}

export async function resolvePCFHierarchy(pcfId: string): Promise<{
  pcf: PCF;
  church: Church;
  group: Group;
  zone: Zone;
}> {
  const [pcfs, churches, groups, zones] = await Promise.all([
    getPCFs(),
    getChurches(),
    getGroups(),
    getZones(),
  ]);

  const pcf = pcfs.find((p) => p.id === pcfId);
  if (!pcf) throw new Error(`Hierarchy Validation Error: PCF "${pcfId}" not found.`);

  const church = churches.find((c) => c.id === pcf.churchId);
  if (!church) throw new Error(`Hierarchy Validation Error: Parent Church for PCF "${pcf.name}" not found.`);

  const group = groups.find((g) => g.id === church.groupId);
  if (!group) throw new Error(`Hierarchy Validation Error: Parent Group for Church "${church.name}" not found.`);

  const zone = zones.find((z) => z.id === group.zoneId);
  if (!zone) throw new Error(`Hierarchy Validation Error: Parent Zone for Group "${group.name}" not found.`);

  return { pcf, church, group, zone };
}
