/**
 * LookAway - Main Electron Process
 * This is the "brain" of the app that controls everything
 */

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');

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
let workCountdown;      // Seconds until work break

// Overlay queue system
let overlayQueue = [];  // Queue of pending overlays
let isShowingOverlay = false; // Is an overlay currently showing?

// Settings file path
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Default settings
let settings = {
  eyeRestInterval: 60,    // Show eye rest every 60 minutes
  eyeRestDuration: 30,    // Eye rest lasts 30 seconds
  postureInterval: 10,    // Show posture reminder every 10 minutes
  postureDuration: 10,    // Posture reminder lasts 10 seconds
  workInterval: 0,        // Work focus time (0 = disabled)
  workBreakMin: 30,       // Minimum break time (seconds)
  workBreakMax: 300,      // Maximum break time (seconds)
  soundEnabled: true      // Play sound notifications
};

// Load saved settings
loadSettings();

// Initialize countdowns with staggered timing
eyeCountdown = settings.eyeRestInterval * 60;
postureCountdown = settings.postureInterval * 60;
workCountdown = settings.workInterval > 0 ? settings.workInterval * 60 : 0;

// Add 30 second offset to posture to prevent simultaneous triggers
if (postureCountdown > 0) {
  postureCountdown += 30;
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

/**
 * Load settings from file
 */
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      const savedSettings = JSON.parse(data);
      settings = { ...settings, ...savedSettings };
      console.log('✅ Settings loaded:', settings);
    }
  } catch (error) {
    console.error('❌ Error loading settings:', error);
  }
}

/**
 * Save settings to file
 */
function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log('💾 Settings saved:', settings);
  } catch (error) {
    console.error('❌ Error saving settings:', error);
  }
}

// ============================================================================
// WINDOW CREATION FUNCTIONS
// ============================================================================

/**
 * Create the settings window
 */
function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 800,
    minHeight: 650,
    title: 'LookAway - Settings',
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 }
  });

  settingsWindow.loadFile(path.join(__dirname, '../renderer/windows/settings.html'));

  // Send settings to window when loaded
  settingsWindow.webContents.on('did-finish-load', () => {
    settingsWindow.webContents.send('load-settings', settings);
  });

  settingsWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

/**
 * Create overlay window with blur background
 * @param {string} type - 'eye-rest', 'posture', or 'work-break'
 * @param {number} duration - How long to show overlay (seconds)
 */
function createOverlayWindow(type, duration) {
  // Prevent multiple overlays at once
  if (isShowingOverlay || overlayWindow) {
    console.log(`⏳ Overlay already showing, added ${type} to queue`);
    overlayQueue.push({ type, duration });
    return;
  }

  isShowingOverlay = true;

  // Get primary display size
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: false, // Don't show immediately
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Determine which overlay to load
  let overlayFile;
  if (type === 'work-break') {
    overlayFile = 'work-break.html';
  } else {
    overlayFile = type === 'eye-rest' ? 'eye-rest.html' : 'posture.html';
  }

  overlayWindow.loadFile(path.join(__dirname, '../renderer/overlays', overlayFile));

  // Send countdown duration to overlay
  overlayWindow.webContents.on('did-finish-load', () => {
    overlayWindow.webContents.send('start-countdown', duration);
    
    // Smooth fade-in: show after a short delay
    setTimeout(() => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.show();
        overlayWindow.setOpacity(0);
        
        // Fade in animation
        let opacity = 0;
        const fadeIn = setInterval(() => {
          opacity += 0.1;
          if (opacity >= 1) {
            opacity = 1;
            clearInterval(fadeIn);
          }
          if (overlayWindow && !overlayWindow.isDestroyed()) {
            overlayWindow.setOpacity(opacity);
          }
        }, 30);
      }
    }, 100);
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    isShowingOverlay = false;
    
    // Check if there are queued overlays
    processOverlayQueue();
  });
}

/**
 * Process queued overlays
 */
function processOverlayQueue() {
  if (overlayQueue.length > 0 && !isShowingOverlay) {
    console.log(`📋 Processing overlay queue (${overlayQueue.length} items)`);
    const next = overlayQueue.shift();
    
    // Small delay before showing next overlay
    setTimeout(() => {
      createOverlayWindow(next.type, next.duration);
    }, 500);
  }
}

// ============================================================================
// SYSTEM TRAY / MENUBAR
// ============================================================================

/**
 * Create system tray icon with menu
 */
function createTray() {
  const iconPath = path.join(__dirname, '../../assets/icons/trayTemplate.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 18, height: 18 });
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('LookAway - Wellness Reminders');

  updateTrayMenu();
  updateTrayTitle();

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
  const menuItems = [
    {
      label: `Eye Rest: ${formatTime(eyeCountdown)}`,
      enabled: false
    },
    {
      label: `Posture: ${formatTime(postureCountdown)}`,
      enabled: false
    }
  ];

  // Add work timer if enabled
  if (settings.workInterval > 0) {
    menuItems.push({
      label: `Work Focus: ${formatTime(workCountdown)}`,
      enabled: false
    });
  }

  menuItems.push(
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
  );

  const contextMenu = Menu.buildFromTemplate(menuItems);
  tray.setContextMenu(contextMenu);
}

/**
 * Update menubar title with countdown
 */
function updateTrayTitle() {
  if (process.platform === 'darwin' && tray) {
    // Show work timer if enabled, otherwise show shortest reminder time
    let displayTime;
    if (settings.workInterval > 0 && workCountdown > 0) {
      displayTime = workCountdown;
    } else {
      displayTime = Math.min(eyeCountdown, postureCountdown);
    }
    tray.setTitle(` ${formatTime(displayTime)}`);
  }
}

// ============================================================================
// TIMER LOGIC
// ============================================================================

/**
 * Start the main timer
 */
function startMainTimer() {
  setInterval(() => {
    if (!isRunning) return; // Don't count if paused
    
    // Only countdown when no overlay is showing
    if (overlayWindow) return;

    // Eye rest countdown
    eyeCountdown--;
    if (eyeCountdown <= 0) {
      triggerEyeRest();
      eyeCountdown = settings.eyeRestInterval * 60;
    }

    // Posture countdown
    postureCountdown--;
    if (postureCountdown <= 0) {
      triggerPostureCheck();
      postureCountdown = settings.postureInterval * 60;
    }

    // Work focus countdown (if enabled)
    if (settings.workInterval > 0) {
      workCountdown--;
      if (workCountdown <= 0) {
        triggerWorkBreak();
        workCountdown = settings.workInterval * 60;
      }
    }

    updateTrayTitle();
    updateTrayMenu();
    sendTimerUpdate();
  }, 1000);
}

/**
 * Trigger eye rest reminder
 */
function triggerEyeRest() {
  console.log('⏰ Eye rest time!');
  if (settings.soundEnabled) playNotificationSound();
  createOverlayWindow('eye-rest', settings.eyeRestDuration);
}

/**
 * Trigger posture check reminder
 */
function triggerPostureCheck() {
  console.log('⏰ Posture check time!');
  if (settings.soundEnabled) playNotificationSound();
  createOverlayWindow('posture', settings.postureDuration);
}

/**
 * Trigger work break
 */
function triggerWorkBreak() {
  console.log('⏰ Work break time!');
  
  // Random duration between min and max
  const min = settings.workBreakMin;
  const max = settings.workBreakMax;
  const duration = Math.floor(Math.random() * (max - min + 1)) + min;
  
  if (settings.soundEnabled) playNotificationSound();
  createOverlayWindow('work-break', duration);
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  // Sound handled in renderer
}

// ============================================================================
// IPC COMMUNICATION
// ============================================================================

/**
 * Send timer updates to settings window
 */
function sendTimerUpdate() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('timer-update', {
      eye: eyeCountdown,
      posture: postureCountdown,
      work: workCountdown,
      isRunning: isRunning
    });
  }
}

/**
 * Handle settings save from renderer
 */
ipcMain.on('save-settings', (event, newSettings) => {
  console.log('💾 Saving settings:', newSettings);
  
  settings = { ...settings, ...newSettings };
  
  // Reset timers with new intervals
  eyeCountdown = settings.eyeRestInterval * 60;
  postureCountdown = settings.postureInterval * 60;
  workCountdown = settings.workInterval > 0 ? settings.workInterval * 60 : 0;
  
  saveSettings();
  updateTrayMenu();
  sendTimerUpdate();
  
  // Send confirmation back
  event.reply('settings-saved', true);
});

/**
 * Handle timer toggle
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
    // Fade out before closing
    let opacity = 1;
    const fadeOut = setInterval(() => {
      opacity -= 0.15;
      if (opacity <= 0) {
        opacity = 0;
        clearInterval(fadeOut);
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.close();
        }
      }
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(opacity);
      }
    }, 20);
  }
});

/**
 * Handle reset timers request
 */
ipcMain.on('reset-timers', () => {
  eyeCountdown = settings.eyeRestInterval * 60;
  postureCountdown = settings.postureInterval * 60;
  workCountdown = settings.workInterval > 0 ? settings.workInterval * 60 : 0;
  updateTrayMenu();
  sendTimerUpdate();
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.whenReady().then(() => {
  console.log('🚀 LookAway is starting...');
  
  createSettingsWindow();
  createTray();
  startMainTimer();
  
  setTimeout(() => {
    if (settingsWindow) {
      settingsWindow.show();
    }
  }, 500);
});

app.on('window-all-closed', () => {
  // Don't quit - keep running in background
});

app.on('activate', () => {
  if (settingsWindow === null) {
    createSettingsWindow();
  } else {
    settingsWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

console.log('✅ Main process loaded successfully!');