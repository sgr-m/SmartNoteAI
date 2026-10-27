import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { METRICS_CONFIG } from '../data/metricsConfig';

interface MetricsContextType {
  visitors: number;
  downloads: number;
  isLoading: boolean;
  isLive: boolean;
  incrementDownloads: () => void;
  refreshMetrics: () => Promise<void>;
}

const MetricsContext = createContext<MetricsContextType>({
  visitors: 0,
  downloads: 0,
  isLoading: true,
  isLive: false,
  incrementDownloads: () => {},
  refreshMetrics: async () => {},
});

const CACHE_KEY_VISITORS = 'smartnoteai_cached_visitors';
const CACHE_KEY_DOWNLOADS = 'smartnoteai_cached_downloads';
const SESSION_VISITED_KEY = 'smartnoteai_session_visited_v1';

export const MetricsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached values if available to prevent layout jump
  const [visitors, setVisitors] = useState<number>(() => {
    const cached = localStorage.getItem(CACHE_KEY_VISITORS);
    return cached ? Math.max(Number(cached), METRICS_CONFIG.baseVisitors) : METRICS_CONFIG.baseVisitors;
  });

  const [downloads, setDownloads] = useState<number>(() => {
    const cached = localStorage.getItem(CACHE_KEY_DOWNLOADS);
    return cached ? Math.max(Number(cached), METRICS_CONFIG.baseDownloads) : METRICS_CONFIG.baseDownloads;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);

  const fetchMetrics = useCallback(async () => {
    let activeVisitors = visitors;
    let activeDownloads = downloads;
    let liveConnected = false;

    // 1. Handle Visitor Tracking
    try {
      const alreadyVisitedInSession = sessionStorage.getItem(SESSION_VISITED_KEY);
      const visitorEndpoint = alreadyVisitedInSession
        ? `https://countapi.mileshilliard.com/api/v1/get/${METRICS_CONFIG.visitorKey}`
        : `https://countapi.mileshilliard.com/api/v1/hit/${METRICS_CONFIG.visitorKey}`;

      const res = await fetch(visitorEndpoint);
      if (res.ok) {
        const data = await res.json();
        if (typeof data.value === 'number') {
          activeVisitors = METRICS_CONFIG.baseVisitors + data.value;
          setVisitors(activeVisitors);
          localStorage.setItem(CACHE_KEY_VISITORS, String(activeVisitors));
          sessionStorage.setItem(SESSION_VISITED_KEY, 'true');
          liveConnected = true;
        }
      }
    } catch (err) {
      console.warn('Metrics: Visitor API unavailable, using cached/fallback count.', err);
    }

    // 2. Handle GitHub Releases Downloads
    let githubDownloadsTotal = 0;
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${METRICS_CONFIG.githubRepo}/releases`);
      if (ghRes.ok) {
        const releases = await ghRes.json();
        if (Array.isArray(releases)) {
          for (const rel of releases) {
            if (Array.isArray(rel.assets)) {
              for (const asset of rel.assets) {
                if (typeof asset.download_count === 'number') {
                  githubDownloadsTotal += asset.download_count;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Metrics: GitHub releases API unavailable.', err);
    }

    // 3. Handle Web Click Download Counter
    let webDownloadsTotal = 0;
    try {
      const dlRes = await fetch(`https://countapi.mileshilliard.com/api/v1/get/${METRICS_CONFIG.downloadKey}`);
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        if (typeof dlData.value === 'number') {
          webDownloadsTotal = dlData.value;
          liveConnected = true;
        }
      }
    } catch (err) {
      console.warn('Metrics: Download counter API unavailable.', err);
    }

    // Combine all sources: GitHub release asset downloads + web clicks + base
    const combinedDownloads = METRICS_CONFIG.baseDownloads + githubDownloadsTotal + webDownloadsTotal;
    activeDownloads = Math.max(activeDownloads, combinedDownloads);
    setDownloads(activeDownloads);
    localStorage.setItem(CACHE_KEY_DOWNLOADS, String(activeDownloads));

    setIsLive(liveConnected);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // When a user clicks any download button on the site
  const incrementDownloads = useCallback(() => {
    // Optimistically update UI immediately
    setDownloads((prev) => {
      const next = prev + 1;
      localStorage.setItem(CACHE_KEY_DOWNLOADS, String(next));
      return next;
    });

    // Fire background hit request to CountAPI
    try {
      fetch(`https://countapi.mileshilliard.com/api/v1/hit/${METRICS_CONFIG.downloadKey}`, {
        method: 'GET',
        mode: 'cors',
        keepalive: true,
      }).catch((e) => console.warn('Could not record download hit', e));
    } catch (e) {
      console.warn('Could not increment download counter', e);
    }
  }, []);

  return (
    <MetricsContext.Provider
      value={{
        visitors,
        downloads,
        isLoading,
        isLive,
        incrementDownloads,
        refreshMetrics: fetchMetrics,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);
