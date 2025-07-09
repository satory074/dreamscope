// DreamScope Utilities - Security and Helper Functions

/**
 * Security utilities for input sanitization and validation
 */
class SecurityUtils {
    /**
     * Sanitize HTML content to prevent XSS attacks
     * @param {string} input - Raw input string
     * @returns {string} - Sanitized HTML string
     */
    static sanitizeHTML(input) {
        if (typeof input !== 'string') return '';
        
        // Create a temporary div element to leverage browser's HTML parsing
        const tempDiv = document.createElement('div');
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    }

    /**
     * Sanitize and validate keyword input
     * @param {string} keyword - Keyword to sanitize
     * @returns {string} - Clean keyword
     */
    static sanitizeKeyword(keyword) {
        if (typeof keyword !== 'string') return '';
        
        // Remove HTML tags, scripts, and dangerous characters
        return keyword
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>'"&]/g, '') // Remove dangerous characters
            .trim()
            .substring(0, 50); // Limit length
    }

    /**
     * Validate API key format (basic validation)
     * @param {string} apiKey - API key to validate
     * @returns {boolean} - Is valid format
     */
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') return false;
        
        // Basic validation for OpenAI API key format
        return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey);
    }

    /**
     * Escape string for use in HTML attributes
     * @param {string} str - String to escape
     * @returns {string} - Escaped string
     */
    static escapeHtmlAttribute(str) {
        if (typeof str !== 'string') return '';
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

/**
 * Application constants
 */
const CONSTANTS = {
    // Storage keys
    STORAGE_KEYS: {
        DREAMS: 'dreamscope_dreams',
        SETTINGS: 'dreamscope_settings',
        API_KEY: 'dreamscope_apikey',
        WORDS: 'dreamscope_words',
        VECTORS: 'dreamscope_vectors',
        AI_VECTORS: 'dreamscope_ai_vectors',
        BACKUP: 'dreamscope_backup',
        ONBOARDED: 'dreamscope_onboarded'
    },

    // API configuration
    API: {
        OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
        // Future Gemini endpoint (placeholder)
        GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        MODEL_GPT4: 'gpt-4',
        MODEL_GEMINI: 'gemini-pro',
        MAX_TOKENS: 1500,
        TEMPERATURE: 0.7,
        REQUEST_TIMEOUT: 30000 // 30 seconds
    },

    // UI constants
    UI: {
        TOAST_DURATION: 3000,
        LOADING_TIMEOUT: 30000,
        ANIMATION_DURATION: 300,
        RIPPLE_DURATION: 600,
        DEBOUNCE_DELAY: 500
    },

    // Validation limits
    VALIDATION: {
        MAX_KEYWORD_LENGTH: 50,
        MAX_DREAM_LENGTH: 2000,
        MAX_KEYWORDS_COUNT: 20,
        MIN_DREAM_LENGTH: 3,
        MAX_API_KEY_LENGTH: 100
    },

    // Date ranges
    DATE_RANGES: {
        CALENDAR_DAYS: 7,
        STREAK_CHECK_DAYS: 30,
        TIMELINE_DAYS: 7
    },

    // Word analysis
    WORD_ANALYSIS: {
        MAX_WORD_CLOUD_ITEMS: 30,
        MAX_FREQUENCY_ITEMS: 10,
        MAX_SIMILAR_WORDS: 5,
        VECTOR_DIMENSIONS: 5,
        MIN_SIMILARITY_THRESHOLD: 0.1
    },

    // Categories
    CATEGORIES: {
        EMOTION: 'emotion',
        THEME: 'theme',
        SYMBOL: 'symbol',
        GENERAL: 'general'
    },

    // View names
    VIEWS: {
        INPUT: 'input',
        HISTORY: 'history',
        ANALYSIS: 'analysis',
        SETTINGS: 'settings'
    }
};

/**
 * DOM manipulation utilities
 */
class DOMUtils {
    /**
     * Create a safe element with sanitized content
     * @param {string} tagName - HTML tag name
     * @param {string} content - Text content
     * @param {Object} attributes - HTML attributes
     * @returns {HTMLElement} - Created element
     */
    static createSafeElement(tagName, content = '', attributes = {}) {
        const element = document.createElement(tagName);
        
        // Set text content (automatically escapes)
        if (content) {
            element.textContent = content;
        }
        
        // Set attributes safely
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'onclick') {
                // For onclick, use addEventListener instead of setting attribute
                console.warn('Use addEventListener instead of onclick attribute');
            } else {
                element.setAttribute(key, SecurityUtils.escapeHtmlAttribute(value));
            }
        });
        
        return element;
    }

    /**
     * Add event listener with error handling
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    static safeAddEventListener(element, event, handler, options = {}) {
        if (!element || !event || typeof handler !== 'function') return;
        
        element.addEventListener(event, (e) => {
            try {
                handler(e);
            } catch (error) {
                console.error(`Error in ${event} handler:`, error);
                if (window.showToast) {
                    window.showToast('操作中にエラーが発生しました', 'error');
                }
            }
        }, options);
    }

    /**
     * Get element by ID with error handling
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} - Found element or null
     */
    static safeGetElementById(id) {
        try {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`Element with ID '${id}' not found`);
            }
            return element;
        } catch (error) {
            console.error(`Error getting element with ID '${id}':`, error);
            return null;
        }
    }
}

/**
 * Validation utilities
 */
class ValidationUtils {
    /**
     * Validate dream content
     * @param {string} content - Dream content to validate
     * @returns {Object} - Validation result
     */
    static validateDreamContent(content) {
        if (!content || typeof content !== 'string') {
            return { valid: false, error: '夢の内容を入力してください' };
        }
        
        const trimmedContent = content.trim();
        
        if (trimmedContent.length < CONSTANTS.VALIDATION.MIN_DREAM_LENGTH) {
            return { valid: false, error: '夢の内容をもう少し詳しく入力してください' };
        }
        
        if (trimmedContent.length > CONSTANTS.VALIDATION.MAX_DREAM_LENGTH) {
            return { valid: false, error: '夢の内容が長すぎます' };
        }
        
        return { valid: true, content: trimmedContent };
    }

    /**
     * Validate keywords array
     * @param {Array} keywords - Keywords to validate
     * @returns {Object} - Validation result
     */
    static validateKeywords(keywords) {
        if (!Array.isArray(keywords)) {
            return { valid: false, error: 'キーワードの形式が正しくありません' };
        }
        
        if (keywords.length === 0) {
            return { valid: false, error: 'キーワードを入力してください' };
        }
        
        if (keywords.length > CONSTANTS.VALIDATION.MAX_KEYWORDS_COUNT) {
            return { valid: false, error: 'キーワードが多すぎます' };
        }
        
        // Validate each keyword
        for (const keyword of keywords) {
            if (typeof keyword !== 'string' || keyword.trim().length === 0) {
                return { valid: false, error: '無効なキーワードが含まれています' };
            }
            
            if (keyword.length > CONSTANTS.VALIDATION.MAX_KEYWORD_LENGTH) {
                return { valid: false, error: 'キーワードが長すぎます' };
            }
        }
        
        return { valid: true, keywords: keywords.map(k => SecurityUtils.sanitizeKeyword(k)) };
    }
}

/**
 * Error handling utilities
 */
class ErrorHandler {
    /**
     * Handle API errors consistently
     * @param {Error} error - Error object
     * @param {string} operation - Operation that failed
     * @returns {Object} - Error response
     */
    static handleApiError(error, operation = 'API request') {
        console.error(`${operation} failed:`, error);
        
        let userMessage = '操作中にエラーが発生しました';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            userMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
        } else if (error.status === 401) {
            userMessage = 'APIキーが無効です。設定を確認してください。';
        } else if (error.status === 429) {
            userMessage = 'APIの使用制限に達しました。しばらく待ってから再試行してください。';
        } else if (error.status >= 500) {
            userMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。';
        }
        
        return {
            success: false,
            error: userMessage,
            details: error.message
        };
    }

    /**
     * Handle storage errors
     * @param {Error} error - Error object
     * @returns {Object} - Error response
     */
    static handleStorageError(error) {
        console.error('Storage error:', error);
        
        let userMessage = 'データの保存に失敗しました';
        
        if (error.name === 'QuotaExceededError') {
            userMessage = 'ストレージ容量が不足しています。古いデータを削除してください。';
        } else if (error.name === 'SecurityError') {
            userMessage = 'セキュリティ設定によりデータの保存ができません。';
        }
        
        return {
            success: false,
            error: userMessage,
            details: error.message
        };
    }
}

// Export utilities for global use
window.SecurityUtils = SecurityUtils;
window.DOMUtils = DOMUtils;
window.ValidationUtils = ValidationUtils;
window.ErrorHandler = ErrorHandler;
window.CONSTANTS = CONSTANTS;