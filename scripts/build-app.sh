#!/bin/bash
# Rebuilds ~/Applications/Google Hub.app — a native window (system glass) hosting the dashboard;
# every Google link opens in Safari.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$HOME/Applications/Google Hub.app"

[ -f "$ROOT/logos/manifest.js" ] || bash "$ROOT/scripts/fetch-logos.sh"

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$ROOT/assets/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"

# Native shell: compile the Swift app (AppKit + WebKit) for this Mac.
swiftc -O -swift-version 5 -framework AppKit -framework WebKit \
  -o "$APP/Contents/MacOS/GoogleHub" "$ROOT/native/GoogleHub.swift"

# Bundle the web dashboard so the app is self-contained.
mkdir -p "$APP/Contents/Resources/web"
cp -R "$ROOT/index.html" "$ROOT/css" "$ROOT/js" "$ROOT/logos" "$APP/Contents/Resources/web/"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Google Hub</string>
<key>CFBundleDisplayName</key><string>Google Hub</string>
<key>CFBundleIdentifier</key><string>com.rodrigogarcia.googlehub</string>
<key>CFBundleVersion</key><string>3.0</string>
<key>CFBundleShortVersionString</key><string>3.0</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleExecutable</key><string>GoogleHub</string>
<key>CFBundleIconFile</key><string>AppIcon</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSHumanReadableCopyright</key><string>Uso pessoal</string>
</dict></plist>
PLIST

codesign --force --deep -s - "$APP" >/dev/null 2>&1
touch "$APP"
echo "$APP"
