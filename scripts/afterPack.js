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
    console.warn(`[afterPack] Icon not found at ${iconPath}`);
    return;
  }

  // Find rcedit-x64.exe from electron-builder cache or local tools
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData/Local');
  const winCodeSignDir = path.join(localAppData, 'electron-builder/Cache/winCodeSign');
  let rceditPath = null;

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

  if (!rceditPath) {
    console.warn('[afterPack] rcedit-x64.exe not found in electron-builder cache, skipping.');
    return;
  }

  console.log(`[afterPack] Applying SmartNoteAI icon and metadata to ${exeName}...`);

  const args = [
    exePath,
    '--set-icon', iconPath,
    '--set-version-string', 'ProductName', 'SmartNoteAI',
    '--set-version-string', 'FileDescription', 'SmartNoteAI — Intelligent Digital Whiteboard & Teaching Application',
    '--set-version-string', 'CompanyName', 'SmartNoteAI Team',
    '--set-version-string', 'LegalCopyright', 'Copyright © 2026 SmartNoteAI Team',
    '--set-version-string', 'OriginalFilename', exeName,
    '--set-version-string', 'InternalName', 'SmartNoteAI',
    '--set-file-version', context.packager.appInfo.version || '0.2.0',
    '--set-product-version', `${context.packager.appInfo.version || '0.2.0'}.0`,
  ];

  // Try with up to 5 retries and a delay to overcome any momentary OneDrive/antivirus lock
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        execFile(rceditPath, args, (err, stdout, stderr) => {
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
        console.error(`[afterPack] Failed to stamp icon after 5 attempts:`, err);
      }
    }
  }
};

