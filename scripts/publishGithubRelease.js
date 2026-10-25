const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

async function main() {
  console.log('Retrieving GitHub credentials from Git Credential Manager...');
  const credsRaw = execSync('git credential fill', {
    input: 'protocol=https\nhost=github.com\n\n',
  }).toString();

  const tokenMatch = credsRaw.match(/password=(.+)/);
  if (!tokenMatch) {
    throw new Error('Unable to find GitHub OAuth token in Git Credential Manager');
  }
  const token = tokenMatch[1].trim();

  const repo = 'sgr-m/SmartNoteAI';
  const tag = 'v0.1.0';
  const releaseName = 'SmartNoteAI v0.1.0 — Windows Release';
  const releaseBody = `## SmartNoteAI v0.1.0 (Windows Release) 🎓🚀

Welcome to the official public release of **SmartNoteAI**!

SmartNoteAI is a high-performance interactive digital whiteboard and teaching suite designed specifically for Windows 10 & 11.

---

### ✨ Highlights & Features in this Release:

- **🖊️ Precision Stylus & Hardware Tablet Support**:
  - Full support for **XP-Pen Deco Mini 7**, Deco Series, **Wacom One / Intuos**, **Huion Inspiroy**, and Windows Ink digitizers via Chromium \`DirectManipulationStylus\`.
  - Continuous pressure sensitivity adapting stroke widths smoothly without lag.
  - Seamless dual mouse & stylus handling without dropped strokes or pointer lock conflicts.
  - Palm rejection for multi-touch finger gestures.

- **🖥️ Live Desktop Annotation & Screen Snip**:
  - Annotate directly over any external application (VS Code, PowerPoint, browser, video players) with a floating desktop toolbar.
  - Area Screen Snip tool to capture any rectangular region and instantly paste it onto your active whiteboard.

- **📺 True Fullscreen Presentation Mode**:
  - Immersive borderless presentation mode with instant restoration and single-click full-screen toggling.
  - Floating whiteboard teaching dock with quick tool flyouts.

- **📐 Intelligent Geometric & Shape Recognition**:
  - Automatically identifies and snaps rough hand-drawn shapes (triangles, circles, rectangles, polygons, straight lines) into clean geometric figures.

- **🧮 Mathematical Typography (LaTeX / KaTeX)**:
  - Built-in math formula editor with offline bundled KaTeX vector fonts.

- **📑 Document Import & Export**:
  - PDF document import onto canvas pages with local PDF.js worker parsing.
  - High-resolution export to **PDF**, **PNG**, and vector **SVG**.
  - Versioned native editable lesson format (\`.sbl\`).

---

### 💻 System Requirements:
- **OS**: Windows 10 / Windows 11 (64-bit)
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk**: 350 MB free disk space

---

### 📦 Release Artifacts & SHA-256 Checksums:

| File | Size | SHA-256 Checksum |
| :--- | :--- | :--- |
| **\`SmartNoteAI.Setup.0.1.0.exe\`** | ~102 MB | \`9F51BABB3F2D6D255E0A5BCC60FD207C4669D0584E30F5CA403C7E2546607139\` |
| **\`SmartNoteAI.Setup.0.1.0.exe.blockmap\`** | ~114 KB | \`CED28A9F5370DF255C0D6A8558890DA1065A742C0F16338D289801FA3741A34B\` |

---

### ⚠️ Installation Note (Windows SmartScreen):
As this is a newly published open-source binary, Windows Defender SmartScreen may display an unrecognized app notice. Click **"More info"** and then **"Run anyway"** to proceed. You can verify the executable SHA-256 checksum against the table above.

---

### 🔗 Documentation Links:
- [Source Code](https://github.com/sgr-m/SmartNoteAI)
- [Changelog](https://github.com/sgr-m/SmartNoteAI/blob/main/CHANGELOG.md)
- [Trademark & Branding Policy](https://github.com/sgr-m/SmartNoteAI/blob/main/TRADEMARKS.md)
- [Voluntary Donations (UPI & PayPal)](https://github.com/sgr-m/SmartNoteAI/blob/main/DONATE.md)
`;

  console.log('Checking for existing releases in repo...');
  const existingReleases = await apiRequest(`/repos/${repo}/releases`, 'GET', token);

  if (Array.isArray(existingReleases)) {
    for (const rel of existingReleases) {
      if (rel.tag_name === tag || rel.name.includes('SmartBoard Studio')) {
        console.log(`Deleting previous release ${rel.id} (${rel.name})...`);
        await apiRequest(`/repos/${repo}/releases/${rel.id}`, 'DELETE', token);
        console.log(`✓ Deleted old release ${rel.id}`);
      }
    }
  }

  console.log('Creating clean GitHub release for SmartNoteAI...');
  const release = await apiRequest(`/repos/${repo}/releases`, 'POST', token, {
    tag_name: tag,
    target_commitish: 'main',
    name: releaseName,
    body: releaseBody,
    draft: false,
    prerelease: false,
  });
  console.log(`Release created successfully! ID: ${release.id}`);

  const installerPath = path.resolve(__dirname, '..', 'release', 'SmartNoteAI Setup 0.1.0.exe');
  const blockmapPath = path.resolve(__dirname, '..', 'release', 'SmartNoteAI Setup 0.1.0.exe.blockmap');

  if (fs.existsSync(installerPath)) {
    console.log('Uploading installer binary asset...');
    await uploadAsset(release, installerPath, 'SmartNoteAI.Setup.0.1.0.exe', 'application/vnd.microsoft.portable-executable', token);
  } else {
    console.warn('Installer file not found at:', installerPath);
  }

  if (fs.existsSync(blockmapPath)) {
    console.log('Uploading blockmap asset...');
    await uploadAsset(release, blockmapPath, 'SmartNoteAI.Setup.0.1.0.exe.blockmap', 'application/octet-stream', token);
  }

  console.log('\n🎉 Windows Release v0.1.0 is published and live at:');
  console.log(release.html_url);
}

function apiRequest(endpoint, method, token, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'SmartNoteAI-Release-Uploader',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : null);
        } else if (res.statusCode === 404 && method === 'GET') {
          resolve(null);
        } else {
          reject(new Error(`GitHub API HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function uploadAsset(release, filePath, assetName, contentType, token) {
  return new Promise((resolve, reject) => {
    const stats = fs.statSync(filePath);
    const uploadUrlTemplate = release.upload_url;
    const cleanUploadUrl = uploadUrlTemplate.replace(/\{.*?\}/, '');
    const uploadUrl = new URL(`${cleanUploadUrl}?name=${encodeURIComponent(assetName)}`);

    console.log(`Uploading ${assetName} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)...`);

    const options = {
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'SmartNoteAI-Release-Uploader',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': contentType,
        'Content-Length': stats.size,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ ${assetName} uploaded successfully!`);
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`Asset upload HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    const stream = fs.createReadStream(filePath);
    let uploadedBytes = 0;
    let lastPercent = 0;
    stream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const percent = Math.floor((uploadedBytes / stats.size) * 100);
      if (percent >= lastPercent + 20) {
        lastPercent = percent;
        console.log(`  Progress: ${percent}% (${(uploadedBytes / (1024 * 1024)).toFixed(1)} / ${(stats.size / (1024 * 1024)).toFixed(1)} MB)`);
      }
    });

    stream.pipe(req);
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Release failed:', err);
    process.exit(1);
  });
}
