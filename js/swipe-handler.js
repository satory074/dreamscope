// Swipe gesture handler for native-like navigation

class SwipeHandler {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.maxSwipeTime = 300;
        this.startTime = 0;
        
        this.views = ['input', 'history', 'analysis', 'settings'];
        this.currentViewIndex = 0;
        
        this.init();
    }
    
    init() {
        // Add touch event listeners
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Add visual feedback container
        this.createSwipeIndicator();
        
        // Track current view
        this.updateCurrentViewIndex();
    }
    
    createSwipeIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'swipe-indicator';
        indicator.className = 'swipe-indicator';
        document.body.appendChild(indicator);
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.startTime = Date.now();
        
        // Show edge glow effect
        this.showEdgeGlow(this.touchStartX);
    }
    
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const diffX = currentX - this.touchStartX;
        const diffY = currentY - this.touchStartY;
        
        // Only handle horizontal swipes
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Prevent default scrolling
            e.preventDefault();
            
            // Visual feedback during swipe
            this.updateSwipeProgress(diffX);
            
            // Elastic effect for edge boundaries
            if ((this.currentViewIndex === 0 && diffX > 0) || 
                (this.currentViewIndex === this.views.length - 1 && diffX < 0)) {
                this.applyElasticEffect(diffX);
            }
        }
    }
    
    handleTouchEnd(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        this.touchEndX = e.changedTouches[0].clientX;
        this.touchEndY = e.changedTouches[0].clientY;
        
        const swipeTime = Date.now() - this.startTime;
        
        this.handleSwipe(swipeTime);
        
        // Reset
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.hideEdgeGlow();
        this.resetSwipeProgress();
    }
    
    handleSwipe(swipeTime) {
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = this.touchEndY - this.touchStartY;
        
        // Check if it's a horizontal swipe
        if (Math.abs(diffX) > Math.abs(diffY) && 
            Math.abs(diffX) > this.minSwipeDistance && 
            swipeTime < this.maxSwipeTime) {
            
            if (diffX > 0) {
                // Swipe right - go to previous view
                this.navigateToPreviousView();
            } else {
                // Swipe left - go to next view
                this.navigateToNextView();
            }
        }
    }
    
    navigateToPreviousView() {
        if (this.currentViewIndex > 0) {
            this.currentViewIndex--;
            this.animateViewTransition('right');
            window.updateView(this.views[this.currentViewIndex]);
        } else {
            // Bounce effect at the edge
            this.showBounceEffect('left');
        }
    }
    
    navigateToNextView() {
        if (this.currentViewIndex < this.views.length - 1) {
            this.currentViewIndex++;
            this.animateViewTransition('left');
            window.updateView(this.views[this.currentViewIndex]);
        } else {
            // Bounce effect at the edge
            this.showBounceEffect('right');
        }
    }
    
    animateViewTransition(direction) {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.animation = `slide${direction === 'left' ? 'Left' : 'Right'} 0.3s ease-out`;
        
        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        
        setTimeout(() => {
            mainContent.style.animation = '';
        }, 300);
    }
    
    showEdgeGlow(x) {
        const indicator = document.getElementById('swipe-indicator');
        const edge = x < window.innerWidth / 2 ? 'left' : 'right';
        indicator.className = `swipe-indicator ${edge}-glow active`;
    }
    
    hideEdgeGlow() {
        const indicator = document.getElementById('swipe-indicator');
        indicator.classList.remove('active');
    }
    
    updateSwipeProgress(diffX) {
        const progress = Math.min(Math.abs(diffX) / this.minSwipeDistance, 1);
        const indicator = document.getElementById('swipe-indicator');
        indicator.style.opacity = progress * 0.5;
    }
    
    resetSwipeProgress() {
        const indicator = document.getElementById('swipe-indicator');
        indicator.style.opacity = 0;
    }
    
    applyElasticEffect(diffX) {
        const mainContent = document.querySelector('.main-content');
        const elasticDistance = Math.sqrt(Math.abs(diffX)) * 2;
        mainContent.style.transform = `translateX(${diffX > 0 ? elasticDistance : -elasticDistance}px)`;
    }
    
    showBounceEffect(edge) {
        const mainContent = document.querySelector('.main-content');
        mainContent.style.animation = `bounce${edge === 'left' ? 'Left' : 'Right'} 0.4s ease-out`;
        
        if ('vibrate' in navigator) {
            navigator.vibrate([10, 10, 10]);
        }
        
        setTimeout(() => {
            mainContent.style.animation = '';
            mainContent.style.transform = '';
        }, 400);
    }
    
    updateCurrentViewIndex() {
        // Listen for view changes
        const originalUpdateView = window.updateView;
        window.updateView = (viewName) => {
            originalUpdateView(viewName);
            this.currentViewIndex = this.views.indexOf(viewName);
        };
    }
}

// Initialize swipe handler
document.addEventListener('DOMContentLoaded', () => {
    new SwipeHandler();
});