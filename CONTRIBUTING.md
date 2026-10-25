# Contributing to SmartNoteAI

Thank you for your interest in contributing to **SmartNoteAI**! We welcome bug reports, feature suggestions, documentation enhancements, and pull requests from the community.

---

## Code of Conduct

By participating in this project, you agree to abide by the terms of our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Ways to Contribute

### 1. Reporting Bugs
- Before submitting an issue, search the [Issue Tracker](https://github.com/sgr-m/SmartNoteAI/issues) to verify if the bug has already been reported.
- When filing a bug report, include:
  - Your Windows operating system version (e.g., Windows 10 22H2, Windows 11).
  - Hardware details if applicable (e.g., XP-Pen Deco Mini 7, Wacom Intuos, touch monitor).
  - Clear step-by-step reproduction instructions.
  - Expected behavior vs. actual behavior.
  - Screenshots or screen recordings where helpful.

### 2. Suggesting Enhancements
- Feature requests and ideas are welcome! Please open an issue labeled as `enhancement`.
- Describe the problem you are solving, your suggested solution, and why it benefits teachers and presenters.

### 3. Submitting Pull Requests
1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/SmartNoteAI.git
   cd SmartNoteAI/smartboard-studio
   ```
3. **Create a descriptive feature branch**:
   ```bash
   git checkout -b feature/amazing-tool
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Develop and test**:
   - Run the development environment: `npm run dev`
   - Run the automated test suite: `npm test`
   - Ensure all 172+ tests pass cleanly before submitting your changes.
6. **Commit your changes**: Write clear, descriptive commit messages.
7. **Push to your fork** and open a Pull Request against the `main` branch of the official repository.

---

## Development Guidelines

- **Architecture**: The application is built with Electron (Main process in TypeScript) and Vite + React 19 (Renderer process).
- **Styling**: Vanilla CSS with curated color tokens and glassmorphism styling.
- **Testing**: We use [Vitest](https://vitest.dev/). Write unit tests in `tests/` for any new drawing tools, export formats, or window management features.
- **Type Safety**: Strictly adhere to TypeScript types. Run `npm run typecheck` to verify types.

---

## License Agreement

By contributing to SmartNoteAI, you agree that your contributions will be licensed under the project's open-source license.
