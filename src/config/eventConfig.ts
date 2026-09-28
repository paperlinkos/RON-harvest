export type EventStatus = 'upcoming' | 'live' | 'completed';

export interface EventConfig {
  id: string;
  name: string;
  eventDate: string;
  target: number;
  status: EventStatus;
  startAt?: string;
  endAt?: string;
  updatedAt: string;
  description?: string;
}

export interface EventAuditLog {
  id: string;
  eventId: string;
  action: 'event_started' | 'event_ended';
  actorId: string;
  timestamp: string;
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  id: 'ron-2026-oct1',
  name: 'Reach Out Nigeria',
  eventDate: '2026-10-01',
  target: 40000,
  status: 'upcoming',
  updatedAt: new Date().toISOString(),
  description: 'CEAZ1 Reachout Nigeria Soul Winning Campaign taking place on October 1st, 2026.',
};

export const REACH_OUT_NIGERIA_EVENT = {
  ...DEFAULT_EVENT_CONFIG,
  zonalTarget: 40000,
  nationalTarget: 40000, // Retain backward-compatible alias for existing imports
  campaignDate: '2026-10-01',
};
