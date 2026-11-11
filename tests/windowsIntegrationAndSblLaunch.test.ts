import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { extractSblFilePathFromArgv, normalizeSblCandidate, isSblFilePath } from '../src/main/utils/fileLaunchUtils';
import { deserializeLesson } from '../src/renderer/store/documentStore';

const ROOT = path.resolve(__dirname, '..');

describe('Windows Integration, Icon Stamping, and .sbl File Opening', () => {
  describe('CLI & Second-Instance .sbl Extraction (fileLaunchUtils)', () => {
    it('identifies .sbl paths case-insensitively', () => {
      expect(isSblFilePath('lesson.sbl')).toBe(true);
      expect(isSblFilePath('C:\\Notes\\Physics.SBL')).toBe(true);
      expect(isSblFilePath('notes.pdf')).toBe(false);
    });

    it('normalizes quoted Windows paths and ignores CLI switches', () => {
      expect(normalizeSblCandidate('--updated')).toBeNull();
      expect(normalizeSblCandidate('-allow-file-access')).toBeNull();
      expect(normalizeSblCandidate('lesson.pdf')).toBeNull();

      const expected = path.normalize('C:\\Users\\Teacher\\Desktop\\My Lesson.sbl');
      expect(normalizeSblCandidate('"C:\\Users\\Teacher\\Desktop\\My Lesson.sbl"')).toBe(expected);
    });

    it('extracts existing .sbl path while skipping Chromium flags and executable arg', () => {
      const targetPath = path.resolve('C:\\Lessons\\Chapter 1.sbl');
      const result = extractSblFilePathFromArgv(
        ['C:\\Program Files\\SmartNoteAI\\SmartNoteAI.exe', '--allow-file-access-from-files', '--updated', `"${targetPath}"`],
        (p) => path.normalize(p) === path.normalize(targetPath)
      );
      expect(result).toBe(path.normalize(targetPath));
    });

    it('resolves relative .sbl paths against second-instance workingDirectory', () => {
      const wd = path.resolve('C:\\ClassNotes');
      const resolvedTarget = path.resolve(wd, 'algebra.sbl');
      const result = extractSblFilePathFromArgv(
        ['SmartNoteAI.exe', '.\\algebra.sbl'],
        (p) => path.normalize(p) === path.normalize(resolvedTarget),
        wd
      );
      expect(result).toBe(path.normalize(resolvedTarget));
    });

    it('returns null when no existing .sbl file is passed in argv', () => {
      const result = extractSblFilePathFromArgv(
        ['SmartNoteAI.exe', '--updated', 'C:\\missing.sbl'],
        () => false
      );
      expect(result).toBeNull();
    });
  });

  describe('.sbl Lesson Deserialization', () => {
    it('parses BOM-prefixed .sbl lesson JSON exported with extra metadata', () => {
      const rawJson = `\uFEFF${JSON.stringify({
        schemaVersion: 1,
        exportedAt: '2026-11-11T10:00:00.000Z',
        meta: {
          id: 'lesson-123',
          title: 'Optics',
          tags: [],
          createdAt: 1,
          updatedAt: 2,
          version: 1,
        },
        pages: [{ id: 'p1', title: 'Page 1', width: 1920, height: 1080, objects: [] }],
      })}`;

      const parsed = deserializeLesson(rawJson);
      expect(parsed.meta.id).toBe('lesson-123');
      expect(parsed.meta.title).toBe('Optics');
      expect(parsed.pages).toHaveLength(1);
    });

    it('throws on invalid .sbl JSON missing meta.id or pages', () => {
      expect(() => deserializeLesson('{"hello":"world"}')).toThrow(/Invalid lesson file/);
    });
  });

  describe('Packaging, Icon Stamping, Default Apps, and Preload Contracts', () => {
    it('configures .sbl file association and NSIS include script in package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
      const associations = pkg.build?.fileAssociations || [];
      expect(associations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ext: 'sbl',
            name: 'SmartNoteAI.Lesson',
          }),
        ])
      );
      expect(pkg.build?.nsis?.include).toBe('build/installer.nsh');
      expect(pkg.build?.afterPack).toBe('scripts/afterPack.js');
    });

    it('registers Capabilities, RegisteredApplications, SupportedTypes, and SHChangeNotify in build/installer.nsh', () => {
      const nsh = fs.readFileSync(path.join(ROOT, 'build', 'installer.nsh'), 'utf8');
      expect(nsh).toContain('Software\\RegisteredApplications');
      expect(nsh).toContain('Software\\SmartNoteAI\\Capabilities\\FileAssociations');
      expect(nsh).toContain('Software\\Classes\\Applications\\SmartNoteAI.exe');
      expect(nsh).toContain('SupportedTypes');
      expect(nsh).toContain('OpenWithProgids');
      expect(nsh).toContain('$\\"$appExe$\\" $\\"%1$\\"');
      expect(nsh).toContain('SHChangeNotify');
    });

    it('uses bundled node_modules/rcedit binary in scripts/afterPack.js without silent skip', () => {
      const afterPack = fs.readFileSync(path.join(ROOT, 'scripts', 'afterPack.js'), 'utf8');
      expect(afterPack).toContain('node_modules/rcedit/bin/rcedit-x64.exe');
      expect(afterPack).toContain('--set-icon');
      expect(afterPack).toContain('throw new Error');
    });

    it('whitelists app:consumePendingOpenFile and app:open-file in preload.ts', () => {
      const preload = fs.readFileSync(path.join(ROOT, 'src', 'preload', 'preload.ts'), 'utf8');
      expect(preload).toContain("'app:consumePendingOpenFile'");
      expect(preload).toContain("'app:open-file'");
    });
  });
});
