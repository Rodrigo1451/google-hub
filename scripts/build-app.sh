#!/bin/bash
# Rebuilds ~/Applications/Google Hub.app — a tiny launcher that opens ~/GoogleHub/index.html in Safari.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/Applications/Google Hub.app"

[ -f "$ROOT/logos/manifest.js" ] || bash "$ROOT/scripts/fetch-logos.sh"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$ROOT/assets/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/MacOS/GoogleHub" <<'SH'
#!/bin/bash
F="$HOME/GoogleHub/index.html"
if [ -f "$F" ]; then
  open -a Safari "$F"
else
  osascript -e 'display alert "Google Hub" message "Pasta ~/GoogleHub não encontrada."'
fi
SH
chmod +x "$APP/Contents/MacOS/GoogleHub"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Google Hub</string>
<key>CFBundleDisplayName</key><string>Google Hub</string>
<key>CFBundleIdentifier</key><string>com.rodrigogarcia.googlehub</string>
<key>CFBundleVersion</key><string>2.0</string>
<key>CFBundleShortVersionString</key><string>2.0</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleExecutable</key><string>GoogleHub</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>LSUIElement</key><true/>
</dict></plist>
PLIST

codesign --force --deep -s - "$APP" >/dev/null 2>&1
touch "$APP"
echo "$APP"
