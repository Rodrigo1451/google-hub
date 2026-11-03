// Google Hub — native macOS shell.
// A real window with system vibrancy (NSVisualEffectView) hosting the bundled web dashboard
// in a transparent WKWebView. Every web link leaves the window and opens in Safari.
//
// Build: scripts/build-app.sh   Self-test: "Google Hub.app/Contents/MacOS/GoogleHub" --selftest

import AppKit
import WebKit

// MARK: - Link routing (pure, self-tested)

enum Route: Equatable { case stayInApp, openInSafari, ignore }

/// Bundled pages stay in the window; web links go to Safari; anything else is ignored.
func route(for url: URL?) -> Route {
    guard let url, let scheme = url.scheme?.lowercased() else { return .ignore }
    switch scheme {
    case "file", "about": return .stayInApp
    case "http", "https", "mailto": return .openInSafari
    default: return .ignore
    }
}

func openInSafari(_ url: URL) {
    let ws = NSWorkspace.shared
    let config = NSWorkspace.OpenConfiguration()
    config.activates = true
    if let safari = ws.urlForApplication(withBundleIdentifier: "com.apple.Safari") {
        ws.open([url], withApplicationAt: safari, configuration: config)
    } else {
        ws.open(url)
    }
}

// MARK: - Title-bar drag strip
// The web view covers the whole window (full-size content), so this transparent strip
// restores dragging the window by its title bar. It forwards double-clicks to zoom.

final class DragStrip: NSView {
    override func mouseDown(with event: NSEvent) {
        if event.clickCount == 2 { window?.performZoom(nil) } else { window?.performDrag(with: event) }
    }
    override var mouseDownCanMoveWindow: Bool { true }
}

// MARK: - Window controller

final class HubController: NSObject, WKNavigationDelegate, WKUIDelegate {
    let window: NSWindow
    let webView: WKWebView
    let selfTest: Bool

    init(selfTest: Bool) {
        self.selfTest = selfTest
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1180, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered, defer: false)
        window.title = "Google Hub"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isOpaque = false
        window.backgroundColor = .clear
        window.minSize = NSSize(width: 720, height: 520)
        window.setFrameAutosaveName("GoogleHubMain")
        window.tabbingMode = .disallowed

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default() // favorites (localStorage) persist between launches
        webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        webView.underPageBackgroundColor = .clear
        webView.allowsMagnification = true
        super.init()
        webView.navigationDelegate = self
        webView.uiDelegate = self

        // Real macOS glass behind the page.
        let glass = NSVisualEffectView()
        glass.material = .underWindowBackground
        glass.blendingMode = .behindWindow
        glass.state = .followsWindowActiveState

        let strip = DragStrip()
        for v in [glass, webView, strip] as [NSView] { v.translatesAutoresizingMaskIntoConstraints = false }
        let root = NSView()
        root.addSubview(glass)
        root.addSubview(webView)
        root.addSubview(strip)
        NSLayoutConstraint.activate([
            glass.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            glass.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            glass.topAnchor.constraint(equalTo: root.topAnchor),
            glass.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: root.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            webView.topAnchor.constraint(equalTo: root.topAnchor),
            webView.bottomAnchor.constraint(equalTo: root.bottomAnchor),
            // leave the traffic lights (≈ first 80pt) clickable
            strip.leadingAnchor.constraint(equalTo: root.leadingAnchor, constant: 80),
            strip.trailingAnchor.constraint(equalTo: root.trailingAnchor),
            strip.topAnchor.constraint(equalTo: root.topAnchor),
            strip.heightAnchor.constraint(equalToConstant: 28),
        ])
        window.contentView = root
        if !window.setFrameUsingName("GoogleHubMain") { window.center() }
    }

    func load() {
        guard let web = Bundle.main.url(forResource: "web", withExtension: nil) else {
            fail("web resources missing from the app bundle"); return
        }
        let index = web.appendingPathComponent("index.html")
        var parts = URLComponents(url: index, resolvingAgainstBaseURL: false)!
        parts.query = "host=app"
        webView.loadFileURL(parts.url!, allowingReadAccessTo: web)
    }

    // Links clicked or window.open(...) with target=_blank arrive here.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = action.request.url, route(for: url) == .openInSafari { openInSafari(url) }
        return nil
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        switch route(for: action.request.url) {
        case .stayInApp: decisionHandler(.allow)
        case .openInSafari: openInSafari(action.request.url!); decisionHandler(.cancel)
        case .ignore: decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard selfTest else { return }
        let js = """
        JSON.stringify({ host: document.documentElement.dataset.host || null,
          tiles: document.querySelectorAll('.section:not(#sec-favoritos) .tile').length,
          logos: Object.keys(window.GH && GH.logos || {}).length,
          bg: getComputedStyle(document.body).backgroundColor })
        """
        // give the page's DOMContentLoaded render a beat
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            webView.evaluateJavaScript(js) { result, error in
                guard let s = result as? String,
                      let d = try? JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any] else {
                    self.fail("page did not evaluate: \(String(describing: error))"); return
                }
                print("page:", s)
                var ok = true
                func check(_ c: Bool, _ msg: String) { print(c ? "  ok  " : "  FAIL", msg); ok = ok && c }
                check(d["host"] as? String == "app", "host flag is app")
                check(d["tiles"] as? Int == 37, "37 app tiles rendered")
                check((d["logos"] as? Int ?? 0) >= 30, "logos manifest loaded")
                check(d["bg"] as? String == "rgba(0, 0, 0, 0)", "page is transparent over vibrancy")
                exit(ok && runRouteTests() ? 0 : 1)
            }
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail("\(error)") }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail("\(error)") }

    private func fail(_ msg: String) {
        if selfTest { print("  FAIL", msg); exit(1) }
        NSLog("Google Hub: %@", msg)
    }
}

func runRouteTests() -> Bool {
    let cases: [(String?, Route)] = [
        ("https://mail.google.com/", .openInSafari),
        ("http://example.com", .openInSafari),
        ("https://docs.new", .openInSafari),
        ("mailto:someone@example.com", .openInSafari),
        ("file:///Applications/Google%20Hub.app/Contents/Resources/web/index.html?host=app", .stayInApp),
        ("about:blank", .stayInApp),
        ("javascript:alert(1)", .ignore),
        ("ftp://example.com", .ignore),
        (nil, .ignore),
    ]
    var ok = true
    for (s, want) in cases {
        let got = route(for: s.flatMap(URL.init(string:)))
        let pass = got == want
        print(pass ? "  ok  " : "  FAIL", "route(\(s ?? "nil")) == \(want)", pass ? "" : "got \(got)")
        ok = ok && pass
    }
    return ok
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate {
    var hub: HubController!
    let selfTest = CommandLine.arguments.contains("--selftest")

    func applicationDidFinishLaunching(_ note: Notification) {
        buildMenu()
        hub = HubController(selfTest: selfTest)
        hub.load()
        hub.window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        if selfTest { DispatchQueue.main.asyncAfter(deadline: .now() + 15) { print("  FAIL timeout"); exit(1) } }
    }

    func applicationShouldHandleReopen(_ app: NSApplication, hasVisibleWindows: Bool) -> Bool {
        if !hasVisibleWindows { hub.window.makeKeyAndOrderFront(nil) }
        return true
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool { false }

    @objc func reload(_ sender: Any?) { hub.webView.reload() }
    @objc func find(_ sender: Any?) {
        hub.window.makeKeyAndOrderFront(nil)
        hub.webView.evaluateJavaScript("GH.palette && GH.palette.open()")
    }

    private func buildMenu() {
        let main = NSMenu()
        func item(_ title: String, _ action: Selector?, _ key: String = "", _ mods: NSEvent.ModifierFlags = .command, target: AnyObject? = nil) -> NSMenuItem {
            let i = NSMenuItem(title: title, action: action, keyEquivalent: key)
            i.keyEquivalentModifierMask = mods
            i.target = target
            return i
        }
        func submenu(_ title: String, _ items: [NSMenuItem]) {
            let top = NSMenuItem(); let m = NSMenu(title: title)
            items.forEach(m.addItem); top.submenu = m; main.addItem(top)
        }
        submenu("Google Hub", [
            item("Sobre o Google Hub", #selector(NSApplication.orderFrontStandardAboutPanel(_:))),
            .separator(),
            item("Ocultar Google Hub", #selector(NSApplication.hide(_:)), "h"),
            item("Ocultar Outros", #selector(NSApplication.hideOtherApplications(_:)), "h", [.command, .option]),
            item("Mostrar Todos", #selector(NSApplication.unhideAllApplications(_:))),
            .separator(),
            item("Encerrar Google Hub", #selector(NSApplication.terminate(_:)), "q"),
        ])
        submenu("Editar", [
            item("Desfazer", Selector(("undo:")), "z"),
            item("Refazer", Selector(("redo:")), "z", [.command, .shift]),
            .separator(),
            item("Recortar", #selector(NSText.cut(_:)), "x"),
            item("Copiar", #selector(NSText.copy(_:)), "c"),
            item("Colar", #selector(NSText.paste(_:)), "v"),
            item("Selecionar Tudo", #selector(NSText.selectAll(_:)), "a"),
            .separator(),
            item("Buscar Apps…", #selector(find(_:)), "f", target: self),
        ])
        submenu("Visualizar", [
            item("Recarregar", #selector(reload(_:)), "r", target: self),
            .separator(),
            item("Entrar em Tela Cheia", #selector(NSWindow.toggleFullScreen(_:)), "f", [.command, .control]),
        ])
        submenu("Janela", [
            item("Minimizar", #selector(NSWindow.performMiniaturize(_:)), "m"),
            item("Zoom", #selector(NSWindow.performZoom(_:))),
            item("Fechar", #selector(NSWindow.performClose(_:)), "w"),
        ])
        NSApp.mainMenu = main
        NSApp.windowsMenu = main.items.last?.submenu
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
