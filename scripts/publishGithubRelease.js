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
  const releaseName = 'SmartBoard Studio v0.1.0 — Windows Initial Release';
  const releaseBody = `## SmartBoard Studio v0.1.0 (Windows Initial Release) 🎓🚀

Welcome to the first official release of **SmartBoard Studio**!

SmartBoard Studio is a high-performance interactive digital smartboard and teaching suite built for Windows 10 & 11.

---

### ✨ Highlights & Features in this Release:

- **🖊️ Precision Stylus & Hardware Tablet Support**:
  - Full support for **XP-Pen Deco Mini 7**, **Wacom One / Intuos**, **Huion**, and Windows Ink digitizers.
  - Natural pressure sensitivity with zero lag.
  - Seamless dual mouse & stylus handling without dropped strokes or pointer lock conflicts.
  - Palm rejection for multi-touch finger gestures.

- **🖥️ Live Desktop Annotation Mode**:
  - Annotate directly over any external application (VS Code, PowerPoint, browser, video players) with a floating desktop toolbar.
  - Area Screen Snip tool to capture any rectangular region and instantly paste it onto your active whiteboard.

- **📺 True Fullscreen Presentation Mode**:
  - Immersive borderless presentation mode with instant restoration and single-click full-screen toggling.
  - Floating whiteboard teaching dock with quick tool flyouts.

- **📐 Intelligent Geometric & Shape Recognition**:
  - Automatically identifies and snaps rough hand-drawn shapes (triangles, circles, rectangles, polygons, straight lines) into clean geometric figures.

- **🧮 Mathematical Typography (LaTeX / KaTeX)**:
  - Built-in math formula editor with offline bundled KaTeX fonts.

- **📑 Document Import & Export**:
  - PDF document import onto canvas pages.
  - High-resolution export to **PDF**, **PNG**, and vector **SVG**.

---

### 📦 Installation:
Download \`SmartBoard.Studio.Setup.0.1.0.exe\` below and run the installer on Windows 10 or 11.
`;

  console.log('Checking for existing release for tag:', tag);
  const existingRelease = await apiRequest(`/repos/${repo}/releases/tags/${tag}`, 'GET', token);

  let release;
  if (existingRelease && existingRelease.id) {
    console.log(`Release already exists with ID ${existingRelease.id}.`);
    release = existingRelease;
  } else {
    console.log('Creating new GitHub release...');
    release = await apiRequest(`/repos/${repo}/releases`, 'POST', token, {
      tag_name: tag,
      target_commitish: 'main',
      name: releaseName,
      body: releaseBody,
      draft: false,
      prerelease: false,
    });
    console.log(`Release created successfully! ID: ${release.id}`);
  }

  const installerPath = path.resolve(__dirname, '..', 'release', 'SmartBoard Studio Setup 0.1.0.exe');
  const blockmapPath = path.resolve(__dirname, '..', 'release', 'SmartBoard Studio Setup 0.1.0.exe.blockmap');

  if (fs.existsSync(installerPath)) {
    console.log('Uploading installer binary asset...');
    await uploadAsset(release, installerPath, 'SmartBoard.Studio.Setup.0.1.0.exe', 'application/vnd.microsoft.portable-executable', token);
  } else {
    console.warn('Installer file not found at:', installerPath);
  }

  if (fs.existsSync(blockmapPath)) {
    console.log('Uploading blockmap asset...');
    await uploadAsset(release, blockmapPath, 'SmartBoard.Studio.Setup.0.1.0.exe.blockmap', 'application/octet-stream', token);
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
        'User-Agent': 'SmartBoard-Studio-Release-Uploader',
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
    const uploadUrlTemplate = release.upload_url; // e.g. https://uploads.github.com/repos/.../releases/1234/assets{?name,label}
    const cleanUploadUrl = uploadUrlTemplate.replace(/\{.*?\}/, '');
    const uploadUrl = new URL(`${cleanUploadUrl}?name=${encodeURIComponent(assetName)}`);

    console.log(`Uploading ${assetName} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)...`);

    const options = {
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'SmartBoard-Studio-Release-Uploader',
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

main().catch((err) => {
  console.error('Release failed:', err);
  process.exit(1);
});
