import type { LucideIcon } from 'lucide-react';

export type BadgeTone = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';

export type AvatarTone = 'blue' | 'yellow' | 'green' | 'gray';

export interface SegmentedBarSegment {
  color: string;
  width: number;
  label: string;
}

export interface ScoreLegendItem {
  id: string;
  label: string;
  records: string;
  sublabel?: string;
  dotClass: string;
}

export interface AiKpi {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  badge: string;
  badgeTone: BadgeTone;
  footer: string;
}

export interface AttentionItem {
  id: string;
  icon: LucideIcon;
  iconClass: string;
  title: string;
  subtitle: string;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

export interface SyncItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  status: SyncStatus;
}

export interface ActivityMeta {
  text: string;
  tone: BadgeTone;
}

export interface ActivityItem {
  id: string;
  avatar: string;
  avatarTone: AvatarTone;
  title: string;
  description: string;
  meta?: ActivityMeta;
  time: string;
}
