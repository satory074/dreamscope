// Performance monitoring and optimization

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            memory: 0,
            loadTime: 0
        };
        this.init();
    }
    
    init() {
        // Monitor page load performance
        this.measureLoadTime();
        
        // Monitor runtime performance
        this.startFPSMonitoring();
        
        // Lazy load images
        this.setupLazyLoading();
        
        // Optimize animations based on device capability
        this.optimizeForDevice();
        
        // Monitor memory usage
        this.monitorMemory();
    }
    
    measureLoadTime() {
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.metrics.loadTime = perfData.loadEventEnd - perfData.fetchStart;
            
            // Report if load time is slow
            if (this.metrics.loadTime > 3000) {
                console.warn('Slow page load detected:', this.metrics.loadTime + 'ms');
                this.optimizeFurtherLoading();
            }
        });
    }
    
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
                
                // Reduce animations if FPS is low
                if (this.metrics.fps < 30) {
                    this.reduceAnimations();
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });
            
            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    optimizeForDevice() {
        // Check device capability
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        const connection = navigator.connection;
        
        // Low-end device detection
        if (deviceMemory < 4 || hardwareConcurrency < 4) {
            this.enableLowEndMode();
        }
        
        // Slow connection detection
        if (connection) {
            connection.addEventListener('change', () => {
                if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                    this.enableDataSaverMode();
                }
            });
        }
    }
    
    enableLowEndMode() {
        document.body.classList.add('low-end-device');
        
        // Disable complex animations
        const style = document.createElement('style');
        style.textContent = `
            .low-end-device * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            
            .low-end-device .loading-particles,
            .low-end-device .dream-particle,
            .low-end-device .ripple {
                display: none !important;
            }
            
            .low-end-device .daily-insight::before {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    enableDataSaverMode() {
        // Reduce data usage
        document.body.classList.add('data-saver');
        
        // Don't load web fonts
        const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => link.remove());
    }
    
    reduceAnimations() {
        if (!document.body.classList.contains('reduced-animations')) {
            document.body.classList.add('reduced-animations');
            console.log('Reducing animations due to low FPS');
        }
    }
    
    monitorMemory() {
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
                
                // Warn if memory usage is high
                if (this.metrics.memory > 100) {
                    console.warn('High memory usage detected:', this.metrics.memory + 'MB');
                    this.optimizeMemoryUsage();
                }
            }, 10000);
        }
    }
    
    optimizeMemoryUsage() {
        // Clear old dreams from memory if too many
        if (window.app && window.app.dreams && window.app.dreams.length > 100) {
            // Keep only recent 50 dreams in memory
            const recentDreams = window.app.dreams.slice(-50);
            window.app.dreams = recentDreams;
        }
        
        // Clear any cached images
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (!img.offsetParent) {
                // Image is not visible, clear it
                img.src = '';
            }
        });
    }
    
    optimizeFurtherLoading() {
        // Implement code splitting
        const routes = {
            'history': () => import('./views/history.js'),
            'analysis': () => import('./views/analysis.js'),
            'settings': () => import('./views/settings.js')
        };
        
        // Override updateView to lazy load views
        const originalUpdateView = window.updateView;
        window.updateView = async (viewName) => {
            if (routes[viewName] && !window[`${viewName}Loaded`]) {
                try {
                    await routes[viewName]();
                    window[`${viewName}Loaded`] = true;
                } catch (error) {
                    console.error('Failed to load view:', viewName, error);
                }
            }
            originalUpdateView(viewName);
        };
    }
    
    // Prefetch resources for better performance
    prefetchResources() {
        if ('link' in document.createElement('link')) {
            // Prefetch next likely navigation
            const currentView = window.app?.currentView || 'input';
            const nextViews = {
                'input': 'history',
                'history': 'analysis',
                'analysis': 'settings',
                'settings': 'input'
            };
            
            const nextView = nextViews[currentView];
            if (nextView && routes[nextView]) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = `./views/${nextView}.js`;
                document.head.appendChild(link);
            }
        }
    }
    
    // Get performance report
    getReport() {
        return {
            fps: this.metrics.fps,
            memory: this.metrics.memory + 'MB',
            loadTime: this.metrics.loadTime + 'ms',
            connectionType: navigator.connection?.effectiveType || 'unknown'
        };
    }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Export for debugging
window.PerformanceMonitor = performanceMonitor;