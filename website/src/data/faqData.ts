export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    id: 'what-is',
    question: 'What is SmartNoteAI?',
    answer:
      'SmartNoteAI is a high-performance, open-source interactive digital whiteboard and teaching application built natively for Windows 10 & 11 (64-bit). Engineered for educators, STEM instructors, tutors, and content creators, it delivers ultra-low-latency stylus drawing, hardware digitizer pressure dynamics, native offline LaTeX mathematical typography, live desktop screen annotation, and STEM geometry instruments.',
  },
  {
    id: 'is-free',
    question: 'Is SmartNoteAI completely free to use?',
    answer:
      'Yes. SmartNoteAI is 100% free software released under the GNU General Public License version 3.0 (GPLv3). There are no locked features, no trial periods, no subscription tiers, and no advertisements. You are legally free to use it for personal teaching, academic institutions, and commercial tutoring.',
  },
  {
    id: 'windows-support',
    question: 'Which versions of Windows are supported?',
    answer:
      'SmartNoteAI is fully supported on 64-bit editions of Windows 10 (version 1809 or later) and Windows 11. It is optimized for standard PCs, laptops, and touch-enabled convertible 2-in-1 devices.',
  },
  {
    id: 'offline-capability',
    question: 'Does SmartNoteAI require an internet connection?',
    answer:
      'No. SmartNoteAI operates 100% offline. All vector drawing, LaTeX equation rendering (via bundled KaTeX and SIL Open Font License vector fonts), PDF parsing (via bundled local PDF.js), and lesson storage function completely on your local PC without requiring internet connectivity or mandatory cloud logins.',
  },
  {
    id: 'graphics-tablets',
    question: 'Which graphics tablets and styluses are compatible?',
    answer:
      'SmartNoteAI features deep hardware integration with precision digitizers using Chromium DirectManipulationStylus. It is tested and verified with XP-Pen (Deco Mini 7, Deco series, Artist series), Wacom (One, Intuos, Cintiq), Huion (Inspiroy, Kamvas), and Windows Ink active pens, providing pressure sensitivity and touch palm rejection.',
  },
  {
    id: 'desktop-annotation',
    question: 'Can I annotate directly over other desktop applications?',
    answer:
      'Yes! By clicking "Desktop Mode" from the bottom dock or pressing the shortcut, SmartNoteAI activates a live transparent overlay on your Windows desktop. You can write, draw diagrams, and highlight content directly over VS Code, PowerPoint slides, web browsers, or video players, and use the Area Screen Snip tool to paste any portion back onto your whiteboard canvas.',
  },
  {
    id: 'pdf-import-export',
    question: 'Can I import PDF textbooks and export my lecture notes?',
    answer:
      'Yes. You can import multi-page PDF textbooks, homework worksheets, or slides directly onto whiteboard canvas pages. When your lesson is complete, you can export it to high-resolution PDF documents, PNG images, vector SVG files, or save it as an editable native SmartNoteAI lesson file (.sbl).',
  },
  {
    id: 'smartscreen-warning',
    question: 'What should I do if Windows SmartScreen displays a warning upon installation?',
    answer:
      'Because SmartNoteAI is an independent, newly published open-source project without a costly enterprise commercial signing certificate, Windows Defender SmartScreen may display an "Unrecognized app" prompt. Click "More info" and then select "Run anyway". You can verify the integrity of the downloaded file by comparing its SHA-256 checksum against the officially published hash on our GitHub Releases page.',
  },
  {
    id: 'source-code',
    question: 'Where can I find the source code or report bugs?',
    answer:
      'The entire source code is publicly accessible on GitHub at https://github.com/sgr-m/SmartNoteAI under the GNU GPLv3 license. You can report bugs, submit feature requests, or contribute code via the official GitHub Issues tracker at https://github.com/sgr-m/SmartNoteAI/issues.',
  },
  {
    id: 'support-project',
    question: 'How can I support the continued development of SmartNoteAI?',
    answer:
      'SmartNoteAI is sustained entirely by community feedback and voluntary donations. If the application helps you teach better, you can voluntarily support ongoing maintenance, testing, and hardware compatibility via UPI (for educators in India) or PayPal (international). See the Donation section on this website or in the repository for details.',
  },
];
