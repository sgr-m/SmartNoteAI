/**
 * UpdateService — Auto-update and version checking for SmartNoteAI
 * 
 * Supports:
 * - electron-updater (official differential autoUpdater with NSIS)
 * - GitHub Releases fallback checking and direct installer download
 * - Real-time progress events forwarded to renderer via IPC
 */

import { app, BrowserWindow, shell, net } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { spawn } from 'child_process';

export interface UpdateState {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadPercent?: number;
  downloadBytesPerSecond?: number;
  downloadTransferred?: number;
  downloadTotal?: number;
  downloadUrl?: string;
  installerPath?: string;
  error?: string;
}

export function isNewerVersion(latest: string, current: string): boolean {
  const clean = (v: string) => v.replace(/^v/i, '').trim();
  const lParts = clean(latest).split('.').map((p) => parseInt(p, 10) || 0);
  const cParts = clean(current).split('.').map((p) => parseInt(p, 10) || 0);
  const maxLen = Math.max(lParts.length, cParts.length);

  for (let i = 0; i < maxLen; i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export class UpdateService {
  private getMainWindow: () => BrowserWindow | null;
  private state: UpdateState;
  private isChecking = false;
  private isDownloading = false;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;
    this.state = {
      status: 'idle',
      currentVersion: app.getVersion() || '0.2.0',
    };

    this.initAutoUpdater();
  }

  public getState(): UpdateState {
    return { ...this.state };
  }

  private emitState(): void {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:status', this.getState());
    }
  }

  private initAutoUpdater(): void {
    // Disable auto download by default so the user controls when to download
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      this.state.status = 'checking';
      this.state.error = undefined;
      this.emitState();
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.state.status = 'available';
      this.state.latestVersion = info.version;
      this.state.releaseName = info.releaseName || `SmartNoteAI v${info.version}`;
      this.state.releaseNotes = typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((n) => (typeof n === 'string' ? n : n.note)).join('\n')
        : undefined;
      this.state.releaseDate = info.releaseDate;
      this.emitState();
    });

    autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
      this.state.status = 'not-available';
      this.emitState();
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.state.status = 'downloading';
      this.state.downloadPercent = Math.round(progressObj.percent);
      this.state.downloadBytesPerSecond = progressObj.bytesPerSecond;
      this.state.downloadTransferred = progressObj.transferred;
      this.state.downloadTotal = progressObj.total;
      this.emitState();
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.state.status = 'downloaded';
      this.state.latestVersion = info.version;
      this.isDownloading = false;
      this.emitState();
    });

    autoUpdater.on('error', (err) => {
      // If electron-updater errors (e.g. dev mode or missing yaml), we fall back gracefully to GitHub API
      console.warn('[UpdateService] autoUpdater notification:', err.message);
    });
  }

  /**
   * Check for updates using electron-updater with GitHub Releases API fallback
   */
  public async checkForUpdates(): Promise<UpdateState> {
    if (this.isChecking) return this.getState();
    this.isChecking = true;

    this.state = {
      ...this.state,
      status: 'checking',
      currentVersion: app.getVersion() || '0.2.0',
      error: undefined,
    };
    this.emitState();

    try {
      // 1. Try electron-updater in packaged environment
      if (app.isPackaged) {
        try {
          const result = await autoUpdater.checkForUpdates();
          if (result && result.updateInfo && isNewerVersion(result.updateInfo.version, this.state.currentVersion)) {
            this.state.status = 'available';
            this.state.latestVersion = result.updateInfo.version;
            this.state.releaseName = result.updateInfo.releaseName || `SmartNoteAI v${result.updateInfo.version}`;
            this.state.releaseDate = result.updateInfo.releaseDate;
            this.isChecking = false;
            this.emitState();
            return this.getState();
          }
        } catch (e: any) {
          console.warn('[UpdateService] autoUpdater.checkForUpdates failed, trying GitHub API directly:', e.message);
        }
      }

      // 2. Direct GitHub Releases API check
      const ghRelease = await this.fetchLatestGitHubRelease();
      if (ghRelease) {
        const remoteVersion = ghRelease.tag_name ? ghRelease.tag_name.replace(/^v/i, '') : '';
        const currentVersion = this.state.currentVersion;

        if (isNewerVersion(remoteVersion, currentVersion)) {
          this.state.status = 'available';
          this.state.latestVersion = remoteVersion;
          this.state.releaseName = ghRelease.name || `SmartNoteAI v${remoteVersion}`;
          this.state.releaseNotes = ghRelease.body || 'New features and improvements are available in this release.';
          this.state.releaseDate = ghRelease.published_at;

          // Find .exe asset if available
          const exeAsset = (ghRelease.assets || []).find(
            (a: any) => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.exe')
          );
          if (exeAsset) {
            this.state.downloadUrl = exeAsset.browser_download_url;
            this.state.downloadTotal = exeAsset.size;
          } else {
            this.state.downloadUrl = ghRelease.html_url;
          }
        } else {
          this.state.status = 'not-available';
          this.state.latestVersion = remoteVersion;
        }
      } else {
        this.state.status = 'not-available';
      }
    } catch (err: any) {
      console.error('[UpdateService] Error checking for updates:', err);
      this.state.status = 'error';
      this.state.error = err.message || 'Unable to connect to update server. Please check your internet connection.';
    } finally {
      this.isChecking = false;
      this.emitState();
    }

    return this.getState();
  }

  /**
   * Download the available update
   */
  public async downloadUpdate(): Promise<UpdateState> {
    if (this.state.status !== 'available' || this.isDownloading) {
      return this.getState();
    }

    this.isDownloading = true;
    this.state.status = 'downloading';
    this.state.downloadPercent = 0;
    this.emitState();

    try {
      // 1. If electron-updater has active update
      if (app.isPackaged) {
        try {
          await autoUpdater.downloadUpdate();
          return this.getState();
        } catch (e: any) {
          console.warn('[UpdateService] autoUpdater.downloadUpdate failed, attempting direct download:', e.message);
        }
      }

      // 2. Direct download of the GitHub installer
      if (this.state.downloadUrl && this.state.downloadUrl.endsWith('.exe')) {
        const tempDir = app.getPath('temp');
        const fileName = path.basename(this.state.downloadUrl);
        const destPath = path.join(tempDir, fileName);

        await this.downloadFile(this.state.downloadUrl, destPath, (percent, transferred, total, bps) => {
          this.state.downloadPercent = percent;
          this.state.downloadTransferred = transferred;
          this.state.downloadTotal = total;
          this.state.downloadBytesPerSecond = bps;
          this.emitState();
        });

        this.state.installerPath = destPath;
        this.state.status = 'downloaded';
        this.state.downloadPercent = 100;
        this.isDownloading = false;
        this.emitState();
        return this.getState();
      }

      // Fallback: Open release download page in browser
      if (this.state.downloadUrl) {
        await shell.openExternal(this.state.downloadUrl);
        this.state.status = 'idle';
        this.isDownloading = false;
        this.emitState();
      }
    } catch (err: any) {
      console.error('[UpdateService] Download failed:', err);
      this.state.status = 'error';
      this.state.error = err.message || 'Failed to download update.';
      this.isDownloading = false;
      this.emitState();
    }

    return this.getState();
  }

  /**
   * Install the downloaded update and restart the application
   */
  public async installUpdate(): Promise<void> {
    if (this.state.status !== 'downloaded') return;

    try {
      // 1. autoUpdater standard quitAndInstall
      if (app.isPackaged) {
        try {
          autoUpdater.quitAndInstall(false, true);
          return;
        } catch (e) {
          console.warn('[UpdateService] autoUpdater.quitAndInstall failed:', e);
        }
      }

      // 2. Direct installer execution
      if (this.state.installerPath && fs.existsSync(this.state.installerPath)) {
        const subprocess = spawn(this.state.installerPath, [], {
          detached: true,
          stdio: 'ignore',
        });
        subprocess.unref();
        app.quit();
      }
    } catch (err) {
      console.error('[UpdateService] Failed to launch installer:', err);
    }
  }

  /**
   * Fetches latest release metadata from GitHub API
   */
  private fetchLatestGitHubRelease(): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = 'https://api.github.com/repos/sgr-m/SmartNoteAI/releases/latest';
      const options: https.RequestOptions = {
        headers: {
          'User-Agent': 'SmartNoteAI-AutoUpdater',
          Accept: 'application/vnd.github.v3+json',
        },
      };

      https
        .get(url, options, (res) => {
          if (res.statusCode === 404) {
            return resolve(null);
          }
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Handle redirect
            return https.get(res.headers.location, options, (redirectRes) => {
              let body = '';
              redirectRes.on('data', (c) => (body += c));
              redirectRes.on('end', () => {
                try {
                  resolve(JSON.parse(body));
                } catch (e) {
                  reject(e);
                }
              });
            }).on('error', reject);
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(JSON.parse(data));
              } else {
                reject(new Error(`GitHub API returned status code ${res.statusCode}`));
              }
            } catch (err) {
              reject(err);
            }
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Helper to download file with progress reporting and redirect handling
   */
  private downloadFile(
    url: string,
    destPath: string,
    onProgress: (percent: number, transferred: number, total: number, bps: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(destPath);
      let startTime = Date.now();
      let lastBytes = 0;

      const request = (targetUrl: string) => {
        https
          .get(
            targetUrl,
            {
              headers: {
                'User-Agent': 'SmartNoteAI-AutoUpdater',
              },
            },
            (res) => {
              if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return request(res.headers.location);
              }

              if (res.statusCode !== 200) {
                fileStream.close();
                fs.unlink(destPath, () => {});
                return reject(new Error(`Server returned HTTP ${res.statusCode}`));
              }

              const total = parseInt(res.headers['content-length'] || '0', 10);
              let transferred = 0;

              res.on('data', (chunk) => {
                transferred += chunk.length;
                const elapsed = (Date.now() - startTime) / 1000;
                const bps = elapsed > 0 ? Math.round((transferred - lastBytes) / elapsed) : 0;
                const percent = total > 0 ? Math.round((transferred / total) * 100) : 0;
                onProgress(percent, transferred, total, bps);
              });

              res.pipe(fileStream);

              fileStream.on('finish', () => {
                fileStream.close();
                resolve();
              });
            }
          )
          .on('error', (err) => {
            fileStream.close();
            fs.unlink(destPath, () => {});
            reject(err);
          });
      };

      request(url);
    });
  }
}

