# real-work-life-balance


lookaway-app/
│
├── src/
│   ├── main/
│   │   └── main.js                    [Main Electron process]
│   │
│   └── renderer/
│       ├── windows/
│       │   └── settings.html          [Settings window]
│       │
│       └── overlays/
│           ├── eye-rest.html          [Eye rest overlay]
│           └── posture.html           [Posture overlay]
│
├── assets/
│   └── icons/
│       ├── icon.png                   [App icon - 512x512]
│       ├── icon.icns                  [macOS icon]
│       └── trayTemplate.png           [Menubar icon - 32x32]
│
├── build/
│   └── entitlements.mac.plist        [macOS permissions]
│
├── package.json                       [Project config]
├── .gitignore                        [Git ignore]
└── README.md                         [Documentation]

Initialize Project
bash
# Initialize npm project
npm init -y

# Install dependencies
npm install --save-dev electron@latest electron-builder@latest

# Install optional but useful packages
npm install --save-dev electron-reload

🎨 Features Matching LookAway
Core Features:
Focus Mode ✅ (Our Eye Rest)
Rest Mode ✅ (Our Break Timer)
Wellness Reminders ✅ (Posture Check)
Menubar Countdown ✅ (Shows time in menubar)
Beautiful Gradients ✅ (Cyan/Purple themes)
Smooth Animations ✅ (Fade in, pulse effects)
Customization ✅ (Adjust all timings)
Sound Alerts ✅ (Gentle notifications)
Pause/Resume ✅ (Right-click tray)
Skip Break ✅ (Button on overlay)


🚀 Quick Start Commands (After Setup)
bash
# Run in development mode
npm start

# Build for macOS
npm run build:mac

# Build for all platforms
npm run build

📊 Architecture Overview
┌────────────────────────────────────────────────┐
│              LOOKAWAY APP                       │
├────────────────────────────────────────────────┤
│                                                 │
│  MAIN PROCESS (src/main/main.js)               │
│  ┌──────────────────────────────────────┐     │
│  │ • App Lifecycle Management            │     │
│  │ • Timer Engine (Eye: 60min, Posture:10min) │
│  │ • Menubar Controller (Shows countdown)│     │
│  │ • Window Manager (Settings, Overlays) │     │
│  │ • IPC Communication Handler           │     │
│  └──────────────────────────────────────┘     │
│                    ▲                            │
│                    │ IPC                        │
│                    ▼                            │
│  RENDERER PROCESS                               │
│  ┌──────────────────────────────────────┐     │
│  │ Settings Window (settings.html)      │     │
│  │ • Start/Pause controls               │     │
│  │ • Interval customization             │     │
│  │ • Live countdown display             │     │
│  └──────────────────────────────────────┘     │
│  ┌──────────────────────────────────────┐     │
│  │ Eye Rest Overlay (eye-rest.html)     │     │
│  │ • Full-screen gradient background    │     │
│  │ • Animated blinking eye              │     │
│  │ • 30-second countdown                │     │
│  └──────────────────────────────────────┘     │
│  ┌──────────────────────────────────────┐     │
│  │ Posture Overlay (posture.html)       │     │
│  │ • Full-screen gradient background    │     │
│  │ • Animated posture figure            │     │
│  │ • 10-second countdown                │     │
│  └──────────────────────────────────────┘     │
└────────────────────────────────────────────────┘

🎨 Design System (Matching LookAway)
Color Palette:
css
/* Eye Rest Screen */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Posture Screen */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Settings Window */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Card Backgrounds */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(10px);
Typography:
Font: SF Pro (macOS), Segoe UI (Windows)
Headers: 56px, Bold
Body: 18-24px, Regular
Countdown: 120px, Bold
Animation Timing:
Fade In: 0.3s ease-out
Pulse: 2s ease-in-out infinite
Wiggle: 0.5s ease-in-out
Blink: 0.15s
🔧 Configuration
Default Settings:
javascript
{
  eyeRestInterval: 60,      // minutes
  eyeRestDuration: 30,      // seconds
  postureInterval: 10,      // minutes
  postureDuration: 10,      // seconds
  soundEnabled: true,
  autoStart: true
}