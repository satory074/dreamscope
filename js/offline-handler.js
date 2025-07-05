// Offline functionality handler

class OfflineHandler {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.init();
    }
    
    init() {
        // Monitor online/offline status
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Check initial status
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
        
        // Setup offline queue processing
        this.processQueueInterval = setInterval(() => {
            if (this.isOnline && this.offlineQueue.length > 0) {
                this.processOfflineQueue();
            }
        }, 30000); // Check every 30 seconds
    }
    
    handleOnline() {
        this.isOnline = true;
        this.hideOfflineIndicator();
        this.showToast('インターネット接続が復旧しました', 'success');
        
        // Process any queued actions
        if (this.offlineQueue.length > 0) {
            this.processOfflineQueue();
        }
    }
    
    handleOffline() {
        this.isOnline = false;
        this.showOfflineIndicator();
        this.showToast('オフラインモードで動作中', 'info');
    }
    
    showOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.classList.add('show');
        }
    }
    
    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }
    
    queueAction(action) {
        this.offlineQueue.push({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action: action,
            retries: 0
        });
        
        // Save queue to localStorage
        this.saveQueue();
    }
    
    async processOfflineQueue() {
        const queue = [...this.offlineQueue];
        
        for (const item of queue) {
            try {
                await this.executeAction(item.action);
                
                // Remove from queue if successful
                this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
                this.saveQueue();
            } catch (error) {
                item.retries++;
                
                if (item.retries > 3) {
                    // Remove after 3 failed attempts
                    this.offlineQueue = this.offlineQueue.filter(q => q.id !== item.id);
                    this.showToast('同期に失敗したデータがあります', 'error');
                }
            }
        }
    }
    
    async executeAction(action) {
        switch (action.type) {
            case 'SAVE_DREAM':
                return this.saveDreamToServer(action.data);
            case 'UPDATE_SETTINGS':
                return this.updateSettingsOnServer(action.data);
            default:
                throw new Error('Unknown action type');
        }
    }
    
    async saveDreamToServer(dreamData) {
        // This would be the actual API call
        console.log('Saving dream to server:', dreamData);
        // Simulate API call
        return new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    async updateSettingsOnServer(settings) {
        // This would be the actual API call
        console.log('Updating settings on server:', settings);
        // Simulate API call
        return new Promise((resolve) => setTimeout(resolve, 1000));
    }
    
    saveQueue() {
        localStorage.setItem('dreamscope_offline_queue', JSON.stringify(this.offlineQueue));
    }
    
    loadQueue() {
        const saved = localStorage.getItem('dreamscope_offline_queue');
        if (saved) {
            try {
                this.offlineQueue = JSON.parse(saved);
            } catch (error) {
                this.offlineQueue = [];
            }
        }
    }
    
    showToast(message, type) {
        // Use the existing toast function if available
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// Initialize offline handler
const offlineHandler = new OfflineHandler();

// Export for use in other modules
window.OfflineHandler = offlineHandler;