/**
 * LookAway - Main Electron Process
 * This is the "brain" of the app that controls everything
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let settingsWindow;      // Settings window instance
let overlayWindow;       // Overlay window instance (eye rest or posture)
let tray;               // System tray icon
let isQuitting = false; // Flag to check if app is quitting

// Timer state
let isRunning = true;   // Is timer active?
let eyeCountdown;       // Seconds until next eye rest
let postureCountdown;   // Seconds until next posture check

// User settings (default values)
let settings = {
  eyeRestInterval: 60,    // Show eye rest every 60 minutes
  eyeRestDuration: 30,    // Eye rest lasts 30 seconds
  postureInterval: 10,    // Show posture reminder every 10 minutes
  postureDuration: 10,    // Posture reminder lasts 10 seconds
  soundEnabled: true      // Play sound notifications
};

// Initialize countdowns
eyeCountdown = settings.eyeRestInterval * 60;
postureCountdown = settings.postureInterval * 60;

// ============================================================================
// WINDOW CREATION FUNCTIONS
// ============================================================================

/**
 * Create the settings window
 * This is where users can configure the app
 */
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'LookAway - Settings',
    backgroundColor: '#1a1a2e',
    show: false, // Don't show immediately
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset', // macOS style
    trafficLightPosition: { x: 15, y: 15 } // macOS traffic lights position
  });

  // Load the settings HTML file
  settingsWindow.loadFile(path.join(__dirname, '../renderer/windows/settings.html'));

  // Handle window close (minimize to tray instead of quitting)
  settingsWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  // Clean up when window is destroyed
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * Create full-screen overlay window
 * @param {string} type - 'eye-rest' or 'posture'
 * @param {number} duration - How long to show overlay (seconds)
 */
function createOverlayWindow(type, duration) {
  // Close existing overlay if any
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  overlayWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the appropriate overlay HTML
  const overlayFile = type === 'eye-rest' ? 'eye-rest.html' : 'posture.html';
  overlayWindow.loadFile(path.join(__dirname, '../renderer/overlays', overlayFile));

  // Send countdown duration to overlay
  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow.webContents.send('start-countdown', duration);
  });

  // Clean up when closed
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// ============================================================================
// SYSTEM TRAY / MENUBAR
// ============================================================================

/**
 * Create system tray icon with menu
 */
function createTray() {
  // Create tray icon
  // You can replace this with a custom icon file
  const iconPath = path.join(__dirname, '../../assets/icons/trayTemplate.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // Resize for menubar
    trayIcon = trayIcon.resize({ width: 18, height: 18 });
  } catch (e) {
    // Fallback: create a simple icon
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  
  // Set tooltip
  tray.setToolTip('LookAway - Wellness Reminders');

  // Update menu and title
  updateTrayMenu();
  updateTrayTitle();

  // Click tray icon to show settings
  tray.on('click', () => {
    if (settingsWindow) {
      settingsWindow.show();
      settingsWindow.focus();
    }
  });
}

/**
 * Update tray context menu
 */
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Eye Rest: ${formatTime(eyeCountdown)}`,
      enabled: false,
      icon: nativeImage.createEmpty()
    },
    {
      label: `Posture: ${formatTime(postureCountdown)}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: isRunning ? '⏸️ Pause' : '▶️ Resume',
      click: () => {
        isRunning = !isRunning;
        updateTrayMenu();
        sendTimerUpdate();
      }
    },
    {
      label: '⚙️ Settings',
      click: () => {
        if (settingsWindow) {
          settingsWindow.show();
          settingsWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '❌ Quit LookAway',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * Update menubar title with countdown
 * This shows the countdown in macOS menubar
 */
function updateTrayTitle() {
  if (process.platform === 'darwin' && tray) {
    // Show the shorter countdown in menubar
    const nextReminder = Math.min(eyeCountdown, postureCountdown);
    tray.setTitle(` ${formatTime(nextReminder)}`);
  }
}

// ============================================================================
// TIMER LOGIC
// ============================================================================

/**
 * Start the main timer that counts down and triggers reminders
 */
function startMainTimer() {
  setInterval(() => {
    // Don't count down if paused or overlay is showing
    if (!isRunning || overlayWindow) return;

    // Countdown eye rest timer
    eyeCountdown--;
    if (eyeCountdown <= 0) {
      triggerEyeRest();
      eyeCountdown = settings.eyeRestInterval * 60; // Reset
    }

    // Countdown posture timer
    postureCountdown--;
    if (postureCountdown <= 0) {
      triggerPostureCheck();
      postureCountdown = settings.postureInterval * 60; // Reset
    }

    // Update UI
    updateTrayTitle();
    updateTrayMenu();
    sendTimerUpdate();
  }, 1000); // Run every second
}

/**
 * Trigger eye rest reminder
 */
function triggerEyeRest() {
  console.log('⏰ Eye rest time!');
  
  if (settings.soundEnabled) {
    playNotificationSound();
  }
  
  createOverlayWindow('eye-rest', settings.eyeRestDuration);
}

/**
 * Trigger posture check reminder
 */
function triggerPostureCheck() {
  console.log('⏰ Posture check time!');
  
  if (settings.soundEnabled) {
    playNotificationSound();
  }
  
  createOverlayWindow('posture', settings.postureDuration);
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  // Sound is handled in renderer process
  // Just send notification to system
  if (process.platform === 'darwin') {
    // macOS notification sound
    const { shell } = require('electron');
    // You can add native macOS sound here if needed
  }
}

// ============================================================================
// IPC COMMUNICATION (Main ↔️ Renderer)
// ============================================================================

/**
 * Send timer updates to settings window
 */
function sendTimerUpdate() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('timer-update', {
      eye: eyeCountdown,
      posture: postureCountdown,
      isRunning: isRunning
    });
  }
}

/**
 * Handle settings update from renderer
 */
ipcMain.on('update-settings', (event, newSettings) => {
  console.log('⚙️ Settings updated:', newSettings);
  
  // Update settings
  if (newSettings.eyeRestInterval) {
    settings.eyeRestInterval = newSettings.eyeRestInterval;
    eyeCountdown = newSettings.eyeRestInterval * 60;
  }
  if (newSettings.eyeRestDuration) {
    settings.eyeRestDuration = newSettings.eyeRestDuration;
  }
  if (newSettings.postureInterval) {
    settings.postureInterval = newSettings.postureInterval;
    postureCountdown = newSettings.postureInterval * 60;
  }
  if (newSettings.postureDuration) {
    settings.postureDuration = newSettings.postureDuration;
  }
  if (typeof newSettings.soundEnabled !== 'undefined') {
    settings.soundEnabled = newSettings.soundEnabled;
  }
  
  updateTrayMenu();
  sendTimerUpdate();
});

/**
 * Handle timer toggle from renderer
 */
ipcMain.on('toggle-timer', () => {
  isRunning = !isRunning;
  updateTrayMenu();
  sendTimerUpdate();
});

/**
 * Handle overlay close request
 */
ipcMain.on('close-overlay', () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
});

/**
 * Handle reset timers request
 */
ipcMain.on('reset-timers', () => {
  eyeCountdown = settings.eyeRestInterval * 60;
  postureCountdown = settings.postureInterval * 60;
  updateTrayMenu();
  sendTimerUpdate();
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format seconds to MM:SS
 * @param {number} seconds 
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

/**
 * App is ready - create everything
 */
app.whenReady().then(() => {
  console.log('🚀 LookAway is starting...');
  
  createSettingsWindow();
  createTray();
  startMainTimer();
  
  // Show settings window on first launch (after a short delay)
  setTimeout(() => {
    if (settingsWindow) {
      settingsWindow.show();
    }
  }, 500);
});

/**
 * Handle all windows closed
 */
app.on('window-all-closed', () => {
  // Don't quit the app - keep running in background
  // On macOS, apps typically continue running even when all windows are closed
  if (process.platform !== 'darwin') {
    // On Windows/Linux, you might want to quit
    // app.quit();
  }
});

/**
 * Handle app activation (macOS)
 */
app.on('activate', () => {
  if (settingsWindow === null) {
    createSettingsWindow();
  } else {
    settingsWindow.show();
  }
});

/**
 * Handle app quit
 */
app.on('before-quit', () => {
  isQuitting = true;
});

// ============================================================================
// DONE! 🎉
// ============================================================================

console.log('✅ Main process loaded successfully!');