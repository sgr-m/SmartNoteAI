; Custom NSIS hooks for SmartNoteAI
; 1. Registers .sbl file association with quoted executable paths & SmartNoteAI icon
; 2. Registers Default Programs Capabilities so SmartNoteAI appears in Windows Settings > Apps > Default apps
; 3. Registers Applications\SmartNoteAI.exe SupportedTypes for Windows Explorer "Open with" menu
; 4. Refreshes desktop/Start Menu shortcut icons & shell icon cache on fresh install and upgrade

!macro customInstall
  ; Ensure .sbl extension metadata and OpenWithProgids are populated
  WriteRegStr SHELL_CONTEXT "Software\Classes\.sbl" "" "SmartNoteAI.Lesson"
  WriteRegStr SHELL_CONTEXT "Software\Classes\.sbl" "Content Type" "application/vnd.smartnoteai.lesson"
  WriteRegStr SHELL_CONTEXT "Software\Classes\.sbl" "PerceivedType" "document"
  WriteRegStr SHELL_CONTEXT "Software\Classes\.sbl\OpenWithProgids" "SmartNoteAI.Lesson" ""

  ; Ensure ProgId uses quoted "$appExe" so paths with spaces (e.g. C:\Program Files\...) work cleanly
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson" "" "SmartNoteAI Lesson File"
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson" "FriendlyTypeName" "SmartNoteAI Lesson File"
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson\DefaultIcon" "" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson\shell" "" "open"
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson\shell\open" "" "Open with SmartNoteAI"
  WriteRegStr SHELL_CONTEXT "Software\Classes\SmartNoteAI.Lesson\shell\open\command" "" "$\"$appExe$\" $\"%1$\""

  ; Register Applications\SmartNoteAI.exe for Windows Explorer "Open with" menu
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe" "FriendlyAppName" "SmartNoteAI"
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe\DefaultIcon" "" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe\SupportedTypes" ".sbl" ""
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe\shell\open" "FriendlyAppName" "SmartNoteAI"
  WriteRegStr SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe\shell\open\command" "" "$\"$appExe$\" $\"%1$\""

  ; Register Default Programs Capabilities so SmartNoteAI displays in Windows Settings > Apps > Default apps
  WriteRegStr SHELL_CONTEXT "Software\RegisteredApplications" "SmartNoteAI" "Software\SmartNoteAI\Capabilities"
  WriteRegStr SHELL_CONTEXT "Software\SmartNoteAI\Capabilities" "ApplicationName" "SmartNoteAI"
  WriteRegStr SHELL_CONTEXT "Software\SmartNoteAI\Capabilities" "ApplicationDescription" "${APP_DESCRIPTION}"
  WriteRegStr SHELL_CONTEXT "Software\SmartNoteAI\Capabilities" "ApplicationIcon" "$appExe,0"
  WriteRegStr SHELL_CONTEXT "Software\SmartNoteAI\Capabilities\FileAssociations" ".sbl" "SmartNoteAI.Lesson"

  ; Register App Paths so Windows Run / ShellExecute resolves SmartNoteAI.exe cleanly
  WriteRegStr SHELL_CONTEXT "Software\Microsoft\Windows\CurrentVersion\App Paths\SmartNoteAI.exe" "" "$appExe"
  WriteRegStr SHELL_CONTEXT "Software\Microsoft\Windows\CurrentVersion\App Paths\SmartNoteAI.exe" "Path" "$INSTDIR"

  ; Refresh Start Menu & Desktop shortcuts on update so Windows drops any previously cached icon
  ${if} ${FileExists} "$newStartMenuLink"
    Delete "$newStartMenuLink"
    CreateShortCut "$newStartMenuLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
    ClearErrors
    WinShell::SetLnkAUMI "$newStartMenuLink" "${APP_ID}"
    System::Call 'shell32::SHChangeNotify(i 0x00002000, i 0x0005, t "$newStartMenuLink", p 0)'
  ${endIf}

  ${ifNot} ${isNoDesktopShortcut}
    ${if} ${FileExists} "$newDesktopLink"
      Delete "$newDesktopLink"
      CreateShortCut "$newDesktopLink" "$appExe" "" "$appExe" 0 "" "" "${APP_DESCRIPTION}"
      ClearErrors
      WinShell::SetLnkAUMI "$newDesktopLink" "${APP_ID}"
      System::Call 'shell32::SHChangeNotify(i 0x00002000, i 0x0005, t "$newDesktopLink", p 0)'
    ${endIf}
  ${endIf}

  ; Point Add/Remove Programs DisplayIcon directly to the stamped SmartNoteAI.exe icon
  WriteRegStr SHELL_CONTEXT "${UNINSTALL_REGISTRY_KEY}" "DisplayIcon" "$appExe,0"

  ; Notify Windows Shell to refresh file associations, Default Apps registry, and icon cache immediately
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  DeleteRegValue SHELL_CONTEXT "Software\RegisteredApplications" "SmartNoteAI"
  DeleteRegKey SHELL_CONTEXT "Software\SmartNoteAI"
  DeleteRegKey SHELL_CONTEXT "Software\Classes\Applications\SmartNoteAI.exe"
  DeleteRegValue SHELL_CONTEXT "Software\Classes\.sbl\OpenWithProgids" "SmartNoteAI.Lesson"
  DeleteRegKey SHELL_CONTEXT "Software\Microsoft\Windows\CurrentVersion\App Paths\SmartNoteAI.exe"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

