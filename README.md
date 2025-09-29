# 👁️ LookAway - Professional Wellness Reminder App

A beautiful, professional desktop application that reminds you to rest your eyes and maintain good posture. Built with Electron.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **🎯 Background Running** - Lives in your system tray/menubar
- **⏱️ macOS Menubar Countdown** - See next reminder time directly in your menubar
- **👁️ Eye Rest Reminders** - Based on the 20-20-20 rule
- **🧍 Posture Check Reminders** - Regular posture corrections
- **🎨 Beautiful UI** - Stunning gradient designs and smooth animations
- **⚙️ Fully Customizable** - Adjust all intervals and durations
- **🔔 Sound Notifications** - Gentle audio alerts
- **⏸️ Pause/Resume** - Control via tray menu
- **🚀 Auto-start Support** - Launch on login
- **💾 Settings Persistence** - Remembers your preferences

---

## 📁 Project Structure

```
lookaway-app/
│
├── src/
│   ├── main/
│   │   └── main.js                    # Main Electron process
│   │
│   └── renderer/
│       ├── windows/
│       │   └── settings.html          # Settings window
│       │
│       └── overlays/
│           ├── eye-rest.html          # Eye rest full-screen overlay
│           └── posture.html           # Posture check overlay
│
├── assets/
│   └── icons/
│       ├── icon.png                   # App icon (512x512)
│       ├── icon.icns                  # macOS icon
│       ├── icon.ico                   # Windows icon
│       └── trayTemplate.png           # Menubar icon (32x32)
│
├── build/
│   └── entitlements.mac.plist        # macOS permissions
│
├── package.json                       # Project configuration
├── .gitignore                        # Git ignore file
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional) - [Download here](https://git-scm.com/)

### Step-by-Step Installation

#### 1. Create Project Folder

```bash
# Navigate to where you want the project
cd ~/Desktop

# Create the folder structure
mkdir -p lookaway-app/src/main
mkdir -p lookaway-app/src/renderer/windows
mkdir -p lookaway-app/src/renderer/overlays
mkdir -p lookaway-app/assets/icons
mkdir -p lookaway-app/build

cd lookaway-app
```

#### 2. Create All Files

Copy the following files from the artifacts into your project:

- **`package.json`** → Root folder
- **`.gitignore`** → Root folder
- **`build/entitlements.mac.plist`** → build/ folder
- **`src/main/main.js`** → src/main/ folder
- **`src/renderer/windows/settings.html`** → src/renderer/windows/ folder
- **`src/renderer/overlays/eye-rest.html`** → src/renderer/overlays/ folder
- **`src/renderer/overlays/posture.html`** → src/renderer/overlays/ folder

#### 3. Install Dependencies

```bash
npm install
```

This will install Electron and electron-builder.

#### 4. Run the App

```bash
npm start
```

🎉 **The app should launch!**

You'll see:
- Settings window appears
- App icon in system tray (bottom-right on Windows, top-right on macOS)
- **On macOS**: Countdown timer in menubar next to the clock

---

## 🎮 How to Use

### Basic Usage

1. **Launch the app** - It starts automatically when opened
2. **Minimize to tray** - Click "Minimize to Tray" button in settings window
3. **View menubar countdown** (macOS) - See time until next reminder
4. **Right-click tray icon** - Access pause/resume and settings
5. **Full-screen reminders** - Appear automatically at set intervals

### Controls

- **Pause/Resume**: Right-click tray icon → Pause/Resume
- **Adjust Settings**: Click tray icon OR right-click → Settings
- **Skip Reminder**: Click "Skip Break" or "I'm Ready" button on overlay
- **Quick Close**: Press `Escape` key during overlay
- **Quit App**: Right-click tray icon → Quit (or `Cmd+Q` on macOS)

### Default Settings

- **Eye Rest**: Every 60 minutes for 30 seconds
- **Posture Check**: Every 10 minutes for 10 seconds
- **Sound**: Enabled by default

---

## 🛠️ Building the App

### Build for macOS

```bash
npm run build:mac
```

**Output**: `dist/LookAway-1.0.0-mac.zip` and `dist/LookAway-1.0.0.dmg`

**To Install**:
1. Open the `.dmg` file
2. Drag LookAway to Applications folder
3. Launch from Applications

### Build for Windows

```bash
npm run build:win
```

**Output**: `dist/LookAway Setup 1.0.0.exe`

**To Install**:
1. Run the installer
2. Follow installation wizard
3. Launch from Start Menu or Desktop

### Build for Linux

```bash
npm run build:linux
```

**Output**: `dist/LookAway-1.0.0.AppImage` and `dist/lookaway_1.0.0_amd64.deb`

**To Install (Ubuntu/Debian)**:
```bash
sudo dpkg -i dist/lookaway_1.0.0_amd64.deb
```

**To Install (AppImage)**:
```bash
chmod +x dist/LookAway-1.0.0.AppImage
./dist/LookAway-1.0.0.AppImage
```

### Build for All Platforms

```bash
npm run build:all
```

---

## 🎨 Customization

### Creating App Icons

#### For macOS (icon.icns)

1. Create a 1024x1024 PNG image
2. Use online converter: [CloudConvert PNG to ICNS](https://cloudconvert.com/png-to-icns)
3. Save as `assets/icons/icon.icns`

#### For Windows (icon.ico)

1. Create a 256x256 PNG image
2. Use online converter: [CloudConvert PNG to ICO](https://cloudconvert.com/png-to-ico)
3. Save as `assets/icons/icon.ico`

#### For Menubar (trayTemplate.png)

1. Create a 32x32 PNG image (transparent background)
2. Use simple, monochrome design
3. Save as `assets/icons/trayTemplate.png`

### Modifying Intervals

Edit `src/main/main.js`:

```javascript
// Find this section (around line 20)
let settings = {
  eyeRestInterval: 60,    // Change to your preference (minutes)
  eyeRestDuration: 30,    // Change to your preference (seconds)
  postureInterval: 10,    // Change to your preference (minutes)
  postureDuration: 10,    // Change to your preference (seconds)
  soundEnabled: true
};
```

### Changing Colors

Edit the HTML files in `src/renderer/`:

**Eye Rest** (eye-rest.html):
```css
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

**Posture** (posture.html):
```css
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
```

**Settings** (settings.html):
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

---

## 🔧 Advanced Configuration

### Auto-Start on Login

#### macOS

1. Build the app: `npm run build:mac`
2. Install to Applications folder
3. Open **System Preferences** → **Users & Groups** → **Login Items**
4. Click **+** and select **LookAway.app**

#### Windows

1. Build the app: `npm run build:win`
2. Install the app
3. Press `Win+R`, type `shell:startup`
4. Create a shortcut to LookAway.exe in that folder

#### Linux (systemd)

Create `~/.config/systemd/user/lookaway.service`:

```ini
[Unit]
Description=LookAway Wellness App

[Service]
ExecStart=/path/to/LookAway.AppImage

[Install]
WantedBy=default.target
```

Enable:
```bash
systemctl --user enable lookaway.service
systemctl --user start lookaway.service
```

### Development Mode

Run with auto-reload:

```bash
npm run dev
```

Open DevTools (for debugging):
- Press `Cmd+Option+I` (macOS)
- Press `Ctrl+Shift+I` (Windows/Linux)

---

## 📊 Architecture

### Main Process (src/main/main.js)

- **App Lifecycle Management** - Start, quit, background running
- **Timer Engine** - Countdown logic for eye rest and posture
- **Window Manager** - Creates and manages all windows
- **System Tray Controller** - Menubar/tray icon and menu
- **IPC Handler** - Communication with renderer processes

### Renderer Process (src/renderer/)

- **Settings Window** - User interface for configuration
- **Eye Rest Overlay** - Full-screen eye rest reminder
- **Posture Overlay** - Full-screen posture reminder

### Communication Flow

```
Main Process (main.js)
        ↓
    IPC Send/Receive
        ↓
Renderer Process (HTML files)
```

---

## 🐛 Troubleshooting

### App Won't Start

**Check Node.js installation**:
```bash
node --version  # Should be v18 or higher
npm --version
```

**Reinstall dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### No Menubar Countdown (macOS)

- Quit and restart the app
- Check System Preferences → Privacy → Accessibility
- Grant permission to LookAway if prompted

### Build Fails

**macOS**: Install Xcode Command Line Tools
```bash
xcode-select --install
```

**Windows**: Install Visual Studio Build Tools
```bash
npm install --global windows-build-tools
```

**Linux**: Install build dependencies
```bash
sudo apt-get install build-essential
```

### Overlay Doesn't Appear

- Check that timer is running (not paused)
- Right-click tray icon → Resume
- Check settings for correct intervals
- Look in DevTools console for errors

---

## 🎯 Tips for Best Results

### Eye Rest (20-20-20 Rule)

Every 20 minutes, look at something 20 feet (6 meters) away for at least 20 seconds.

**Why it works:**
- Reduces eye strain
- Prevents dry eyes
- Relaxes eye muscles
- Improves focus

### Good Posture

- **Back**: Straight against chair
- **Shoulders**: Relaxed, not hunched
- **Feet**: Flat on floor
- **Screen**: Eye level, arm's length away
- **Keyboard**: Elbows at 90°

---

## 📝 Development

### Project Scripts

```bash
npm start          # Run app in development
npm run dev        # Run with dev mode flag
npm run build      # Build for current platform
npm run build:mac  # Build for macOS
npm run build:win  # Build for Windows
npm run build:linux # Build for Linux
npm run build:all  # Build for all platforms
```

### Tech Stack

- **Electron** v28 - Desktop app framework
- **Node.js** - JavaScript runtime
- **HTML/CSS/JS** - UI rendering
- **IPC** - Inter-process communication

---

## 📄 License

MIT License - Feel free to modify and distribute!

---

## 🙏 Credits

- Inspired by [LookAway](https://lookaway.app/) and [BreakTimer](https://breaktimer.app/)
- Built with [Electron](https://www.electronjs.org/)

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Make sure all files are in correct locations
3. Verify Node.js and npm are installed
4. Check DevTools console for errors
5. Try deleting `node_modules` and running `npm install` again

---

**Enjoy healthier screen time! 👁️ 🧍**

Made with ❤️ for your wellness