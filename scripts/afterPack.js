const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'win32') return;

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);

  if (!fs.existsSync(exePath)) {
    console.warn(`[afterPack] Executable not found at ${exePath}`);
    return;
  }

  const iconPath = path.resolve(context.packager.projectDir, 'assets/icons/icon.ico');
  if (!fs.existsSync(iconPath)) {
    throw new Error(`[afterPack] Icon not found at ${iconPath}`);
  }

  // Primary: use app-builder-bin bundled in node_modules (guaranteed available in CI and local builds)
  let appBuilderPath = null;
  try {
    appBuilderPath = require('app-builder-bin').appBuilderPath;
  } catch {
    // ignore if package unavailable
  }

  // Fallback: locate rcedit-x64.exe from local electron-builder cache
  let rceditPath = null;
  if (!appBuilderPath || !fs.existsSync(appBuilderPath)) {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData/Local');
    const winCodeSignDir = path.join(localAppData, 'electron-builder/Cache/winCodeSign');

    if (fs.existsSync(winCodeSignDir)) {
      const subdirs = fs.readdirSync(winCodeSignDir);
      for (const sub of subdirs) {
        const candidate = path.join(winCodeSignDir, sub, 'rcedit-x64.exe');
        if (fs.existsSync(candidate)) {
          rceditPath = candidate;
          break;
        }
      }
    }
  }

  if ((!appBuilderPath || !fs.existsSync(appBuilderPath)) && !rceditPath) {
    throw new Error('[afterPack] Neither app-builder-bin nor rcedit-x64.exe found; cannot stamp Windows executable icon.');
  }

  const version = context.packager.appInfo.version || '2.1.0';
  const runnerLabel = appBuilderPath && fs.existsSync(appBuilderPath) ? 'app-builder rcedit' : 'rcedit-x64';
  console.log(`[afterPack] Applying SmartNoteAI icon and metadata to ${exeName} using ${runnerLabel}...`);

  const rceditArgs = [
    exePath,
    '--set-icon', iconPath,
    '--set-version-string', 'ProductName', 'SmartNoteAI',
    '--set-version-string', 'FileDescription', 'SmartNoteAI — Intelligent Digital Whiteboard & Teaching Application',
    '--set-version-string', 'CompanyName', 'SmartNoteAI Team',
    '--set-version-string', 'LegalCopyright', 'Copyright © 2026 SmartNoteAI Team',
    '--set-version-string', 'OriginalFilename', exeName,
    '--set-version-string', 'InternalName', 'SmartNoteAI',
    '--set-file-version', version,
    '--set-product-version', `${version}.0`,
  ];

  const execTarget = appBuilderPath && fs.existsSync(appBuilderPath) ? appBuilderPath : rceditPath;
  const execArgs =
    appBuilderPath && fs.existsSync(appBuilderPath)
      ? ['rcedit', '--args', JSON.stringify(rceditArgs)]
      : rceditArgs;

  // Try with up to 5 retries and a delay to overcome any momentary OneDrive/antivirus lock
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        execFile(execTarget, execArgs, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || err.message));
          resolve(stdout);
        });
      });
      console.log(`[afterPack] ✓ Successfully stamped SmartNoteAI icon and metadata onto ${exeName}!`);
      return;
    } catch (err) {
      if (attempt < 5) {
        console.warn(`[afterPack] Attempt ${attempt} failed (${err.message.trim()}). Retrying in 1s...`);
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        throw new Error(`[afterPack] Failed to stamp icon onto ${exeName} after 5 attempts: ${err.message}`);
      }
    }
  }
};

