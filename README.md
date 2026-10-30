# Juicy Rush 🍉 — Fruit Slice Arcade

**Juicy Rush** is a complete, production-ready browser-based fruit slicing arcade game built using plain **HTML5, CSS3, JavaScript (ES6+), Canvas API, and Web Audio API**. It requires zero external dependencies, no backend, no build steps, and no copyrighted assets.

---

## 🎮 Gameplay Features

1. **Parabolic Fruit Physics & Realistic Launch Trajectories**:
   - Fruits launch from below the play arena with realistic gravitational arcs, randomized rotations, and varying heights.
   - 5 handcrafted vector fruits: **Watermelon**, **Orange**, **Strawberry**, **Banana**, and **Kiwi**.
2. **Dynamic Fruit Slicing & Halves**:
   - Slicing a fruit cuts it into two distinct halves with custom vector cross-sections that tumble and fall with independent physics and rotation.
3. **Accurate Swipe & Pointer Gestures**:
   - Continuous line-segment-to-circle collision detection for mouse drag, touch swipe, and stylus inputs.
   - Luminous glowing blade trail with white-hot core and spark effects.
4. **60-Second Countdown & Scoring**:
   - Fast-paced 60-second round timer with an urgent warning pulse when under 10 seconds.
   - Dynamic combo multiplier: chain consecutive slices within 0.85s for combo bonuses (`2×`, `3×`, `4×`, `5× JUICY FRENZY!`).
   - Persistent personal best score stored locally in browser `localStorage`.
5. **Menacing Bombs**:
   - Slicing a bomb causes an instant explosion with screen shake, particle blast, and immediate game over.
6. **Pure Web Audio API Sound Synthesizer**:
   - 100% procedural sound effects generated directly in real-time (no MP3/WAV files needed):
     - Fast aerodynamic blade swish on quick swipes.
     - Squelchy, crisp knife slice and fruit squish sounds.
     - Pentatonic ascending musical chime arpeggios for combos.
     - Subterranean rumble and explosion blast for bomb detonation.
     - UI clicks, fanfare on high scores, and game over jingle.
   - Working mute/unmute button with preference persisted across reloads.
7. **Responsive & Mobile-Ready**:
   - Adaptive sizing for desktop monitors, laptops, tablets, and mobile devices (including small screens <= 360px and landscape orientations).
   - High-DPI / Retina display crispness via dynamic `devicePixelRatio` scaling.
   - **Accidental scroll prevention**: `touch-action: none` strictly on the game arena so swiping never scrolls the page, while the surrounding page scrolls naturally.
8. **Lifecycle & Accessibility**:
   - Start, pause, resume, and restart controls.
   - Tab visibility change detection automatically pauses the game if you switch tabs.
   - Keyboard shortcuts: <kbd>Space</kbd> / <kbd>P</kbd> to Pause/Resume, <kbd>R</kbd> to Restart, <kbd>M</kbd> to Mute, and <kbd>Enter</kbd> to Start/Play Again.
   - Full ARIA labels, accessible focus indicators, and semantic HTML5 landmarks.

---

## 📁 File Structure

```text
juicy-rush/
├── index.html        # Semantic HTML5 markup, HUD, accessible SVG icons, and modal overlays
├── style.css         # Modern arcade styling, responsive breakpoints, animations, and typography
├── game.js           # Physics engine, procedural vector renderers, collision detection, and audio synth
└── README.md         # Documentation, testing guides, and deployment instructions
```

---

## 🚀 Running Locally

Because **Juicy Rush** uses pure vanilla web standards, you can run it immediately with any method below:

### Method 1: Direct File Opening (Instant)
Double-click `index.html` or drag it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Method 2: Python Local Server
Run in this directory:
```bash
# Python 3
python -m http.server 8080

# Or on Windows with py launcher:
py -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

### Method 3: Node.js / npx
If you have Node.js installed:
```bash
npx serve .
```

### Method 4: PowerShell Native Server (No Node or Python required)
If you are on Windows and do not have Python or Node installed, you can start a simple static HTTP listener directly in PowerShell:
```powershell
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"
Start-Process "http://localhost:8080/"
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $path = Join-Path (Get-Location) ($context.Request.Url.LocalPath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($context.Request.Url.LocalPath.TrimStart('/'))) { $path = Join-Path (Get-Location) "index.html" }
    if (Test-Path $path -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $ext = [System.IO.Path]::GetExtension($path).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $context.Response.ContentType = $contentType
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
    }
    $context.Response.Close()
}
```

---

## 🌐 Deploying to Vercel

Juicy Rush is a zero-build static site, making deployment to Vercel seamless.

### Option A: Deploy via GitHub (Recommended)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Juicy Rush"
   git remote add origin https://github.com/<your-username>/juicy-rush.git
   git push -u origin main
   ```
2. Log into [Vercel](https://vercel.com).
3. Click **Add New...** → **Project**.
4. Import your `juicy-rush` GitHub repository.
5. In the configuration window:
   - **Framework Preset**: Select `Other` (or leave default).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: Leave empty.
   - **Output Directory**: Leave empty (root is served).
6. Click **Deploy**. Vercel will generate your live production URL in seconds!

### Option B: Deploy via Vercel CLI
1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```
2. In the `juicy-rush` project directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts. When prompted for settings, accept the defaults.
4. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## 🎯 Game Controls Reference

| Control | Action |
| :--- | :--- |
| **Mouse Drag / Touch Swipe** | Slice fruits and trigger combos |
| <kbd>Space</kbd> or <kbd>P</kbd> | Pause / Resume game |
| <kbd>R</kbd> | Restart round immediately |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>Enter</kbd> | Start Game / Play Again |
| <kbd>Esc</kbd> | Pause game / Open menu |

---

## 🛠️ Browser Compatibility

- **Google Chrome** (v66+)
- **Microsoft Edge** (v79+)
- **Mozilla Firefox** (v65+)
- **Apple Safari** (iOS 12+, macOS 10.14+)
- **Android Webview / Chrome Mobile**

100% compliant with standard HTML5 Canvas, Web Audio API, and Touch/Pointer Events Level 2 specifications.
