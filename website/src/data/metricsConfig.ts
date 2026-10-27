/**
 * Configuration for SmartNoteAI live website metrics & adoption counter
 */
export interface MetricsConfig {
  /** Optional base offset for visitors (e.g. if migrating from another host or pre-launch traffic) */
  baseVisitors: number;
  /** Optional base offset for downloads (e.g. offline distribution, manual installations) */
  baseDownloads: number;
  /** GitHub repository for releases API */
  githubRepo: string;
  /** CountAPI endpoint key for visitors */
  visitorKey: string;
  /** CountAPI endpoint key for downloads */
  downloadKey: string;
}

export const METRICS_CONFIG: MetricsConfig = {
  // Set any baseline counts if desired (e.g. 500 visitors, 100 downloads)
  baseVisitors: 0,
  baseDownloads: 0,
  githubRepo: 'sgr-m/SmartNoteAI',
  visitorKey: 'smartnoteai-visitors',
  downloadKey: 'smartnoteai-downloads',
};
