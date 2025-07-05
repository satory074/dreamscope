// Core functionality and Service Worker registration

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showUpdatePrompt();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
    
    // Handle messages from Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'SYNC_DREAMS') {
            syncDreamsToServer();
        }
    });
}

// Check if app is installed
let deferredPrompt;
let isAppInstalled = false;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button if not installed
    if (!isAppInstalled) {
        showInstallPrompt();
    }
});

window.addEventListener('appinstalled', () => {
    isAppInstalled = true;
    hideInstallPrompt();
});

// Detect if running as installed PWA
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
    isAppInstalled = true;
}

// Update prompt
function showUpdatePrompt() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
        <p>新しいバージョンが利用可能です</p>
        <button onclick="updateApp()">更新</button>
        <button onclick="dismissUpdate(this)">後で</button>
    `;
    document.body.appendChild(updateBanner);
}

function updateApp() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        });
    }
    window.location.reload();
}

function dismissUpdate(button) {
    button.parentElement.remove();
}

// Install prompt
function showInstallPrompt() {
    const installBanner = document.createElement('div');
    installBanner.id = 'install-banner';
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-content">
            <p>🌙 DreamScopeをホーム画面に追加して、より快適に使いましょう</p>
            <div class="install-actions">
                <button onclick="installApp()" class="install-btn">インストール</button>
                <button onclick="dismissInstall()" class="dismiss-btn">今はしない</button>
            </div>
        </div>
    `;
    document.body.appendChild(installBanner);
}

function hideInstallPrompt() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.remove();
}

async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        hideInstallPrompt();
    }
}

function dismissInstall() {
    hideInstallPrompt();
    // Don't show again for 7 days
    localStorage.setItem('installPromptDismissed', Date.now());
}

// Background sync
async function syncDreamsToServer() {
    // This would sync dreams to a backend server
    console.log('Syncing dreams in background...');
}

// Request notification permission
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted');
            // Register for push notifications
            registerPushNotifications();
        }
    }
}

async function registerPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
            });
            console.log('Push notification subscription:', subscription);
            // Send subscription to server
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Export functions
window.AppCore = {
    requestNotificationPermission,
    syncDreamsToServer
};