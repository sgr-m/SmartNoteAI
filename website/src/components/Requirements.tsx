import React from 'react';

export const Requirements: React.FC = () => {
  const specs = [
    {
      label: 'Operating System',
      min: 'Windows 10, 64-bit (build 1809 or higher)',
      rec: 'Windows 10 or Windows 11, 64-bit',
    },
    {
      label: 'Processor (CPU)',
      min: 'Intel Core i3 / AMD Ryzen 3 or equivalent',
      rec: 'Intel Core i5 / AMD Ryzen 5 or faster quad-core',
    },
    {
      label: 'System Memory (RAM)',
      min: '4 GB RAM',
      rec: '8 GB RAM or higher',
    },
    {
      label: 'Disk Space',
      min: '350 MB free disk space for app binary',
      rec: '1 GB or more for multi-page lesson files & PDFs',
    },
    {
      label: 'Input Device',
      min: 'Standard mouse or touchpad',
      rec: 'XP-Pen, Wacom, Huion graphics tablet or touch stylus',
    },
    {
      label: 'Display Resolution',
      min: '1280 × 720 (720p)',
      rec: '1920 × 1080 (1080p FHD) or higher',
    },
  ];

  return (
    <section className="section" id="requirements">
      <div className="container">
        <div className="section-header">
          <div className="section-kicker">Compatibility</div>
          <h2 className="section-title">System Requirements</h2>
          <p className="section-subtitle">
            SmartNoteAI is designed for lightweight efficiency, running smoothly on modern laptops, classroom podium PCs, and desktop workstations.
          </p>
        </div>

        <div className="specs-table-container">
          <table className="specs-table" aria-label="SmartNoteAI System Requirements">
            <thead>
              <tr>
                <th scope="col" style={{ width: '28%' }}>Specification</th>
                <th scope="col" style={{ width: '36%' }}>Minimum Requirement</th>
                <th scope="col" style={{ width: '36%' }}>Recommended for Teaching</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((row, idx) => (
                <tr key={idx}>
                  <th scope="row" style={{ color: 'var(--text-white)', fontWeight: 600 }}>{row.label}</th>
                  <td>{row.min}</td>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{row.rec}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Building from source? Requires </span>
          <code style={{ color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            Node.js 18.x or 20.x
          </code>
          <span>, </span>
          <code style={{ color: 'var(--accent-cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            npm 9+
          </code>
          <span>, and Git on Windows 10/11.</span>
        </div>
      </div>
    </section>
  );
};
