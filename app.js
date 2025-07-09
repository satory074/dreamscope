// DreamScope App - Main JavaScript File
console.log('app.js loaded');

// App State
const app = {
    currentView: 'input',
    dreams: [],
    serverEndpoint: '/api/analyze-dream',  // サーバーエンドポイント
    settings: {
        reminderEnabled: false
    },
    words: [],  // 単語データの追加
    wordAnalysis: {},  // 単語分析用データ
    customVectors: {},  // カスタム単語ベクトル
    aiGeneratedVectors: {}  // AI生成単語ベクトル
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    initializeEventListeners();
    updateView('input');
    updateStatistics();
    updateWordStatistics();  // 単語統計の初期化
    enhanceAccessibility();
    addMicroInteractions();
    checkFirstTimeUser();
});

// Data Management with error handling
function loadDataFromStorage() {
    try {
        const savedDreams = localStorage.getItem('dreamscope_dreams');
        const savedSettings = localStorage.getItem('dreamscope_settings');
        // API key loading removed
        const savedWords = localStorage.getItem('dreamscope_words');
        const savedVectors = localStorage.getItem('dreamscope_vectors');
        const savedAIVectors = localStorage.getItem('dreamscope_ai_vectors');
        
        if (savedDreams) {
            const dreams = JSON.parse(savedDreams);
            // Validate data structure
            if (Array.isArray(dreams)) {
                app.dreams = dreams;
            } else {
                throw new Error('Invalid dreams data format');
            }
        }
        
        if (savedSettings) {
            app.settings = JSON.parse(savedSettings);
            if (document.getElementById('reminder-enabled')) {
                document.getElementById('reminder-enabled').checked = app.settings.reminderEnabled;
            }
        }
        
        // API key loading removed - using server endpoint
        
        if (savedWords) {
            const words = JSON.parse(savedWords);
            if (Array.isArray(words)) {
                app.words = words;
            }
        }
        
        if (savedVectors) {
            app.customVectors = JSON.parse(savedVectors);
        }
        
        if (savedAIVectors) {
            app.aiGeneratedVectors = JSON.parse(savedAIVectors);
        }
    } catch (error) {
        console.error('データの読み込みエラー:', error);
        showToast('データの読み込みに失敗しました。データをリセットします。', 'error');
        
        // Reset corrupted data
        app.dreams = [];
        app.settings = { reminderEnabled: false };
        // API key removed - using server endpoint
        
        // Try to save clean state
        saveDataToStorage();
    }
}

function saveDataToStorage() {
    try {
        // Check storage quota
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(({usage, quota}) => {
                const percentUsed = (usage / quota) * 100;
                if (percentUsed > 90) {
                    showToast('ストレージ容量が少なくなっています', 'warning');
                }
            });
        }
        
        localStorage.setItem('dreamscope_dreams', JSON.stringify(app.dreams));
        localStorage.setItem('dreamscope_settings', JSON.stringify(app.settings));
        localStorage.setItem('dreamscope_words', JSON.stringify(app.words));
        localStorage.setItem('dreamscope_vectors', JSON.stringify(app.customVectors));
        // API key storage removed - using server endpoint
        
        // Create backup
        createBackup();
    } catch (error) {
        console.error('データの保存エラー:', error);
        if (error.name === 'QuotaExceededError') {
            showToast('ストレージ容量が不足しています。古いデータを削除してください。', 'error');
        } else {
            showToast('データの保存に失敗しました', 'error');
        }
    }
}

// Backup functionality
function createBackup() {
    const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        dreams: app.dreams,
        settings: app.settings
    };
    
    try {
        localStorage.setItem('dreamscope_backup', JSON.stringify(backup));
    } catch (error) {
        // Silently fail for backup
        console.warn('バックアップの作成に失敗:', error);
    }
}

// Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            updateView(view);
        });
    });
    
    // Input type selection
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const button = e.target.closest('.type-btn');
            const type = button.dataset.type;
            updateInputType(type);
        });
    });
    
    // Keywords input handling
    const keywordsField = document.getElementById('keywords-field');
    if (keywordsField) {
        keywordsField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    addKeywordTag(value);
                    e.target.value = '';
                }
            }
        });
    }
    
    // Record button
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) recordBtn.addEventListener('click', recordDream);
    
    // Result actions
    const saveDreamBtn = document.getElementById('save-dream-btn');
    if (saveDreamBtn) saveDreamBtn.addEventListener('click', saveDream);
    
    const shareDreamBtn = document.getElementById('share-dream-btn');
    if (shareDreamBtn) shareDreamBtn.addEventListener('click', showShareModal);
    
    const newDreamBtn = document.getElementById('new-dream-btn');
    if (newDreamBtn) newDreamBtn.addEventListener('click', resetInput);
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => navigateCalendar(-1));
    document.getElementById('next-month').addEventListener('click', () => navigateCalendar(1));
    
    // Export buttons
    document.getElementById('export-csv').addEventListener('click', exportAsCSV);
    document.getElementById('export-json').addEventListener('click', exportAsJSON);
    
    
    // Settings
    // API key input removed - using server endpoint
    
    document.getElementById('reminder-enabled').addEventListener('change', (e) => {
        app.settings.reminderEnabled = e.target.checked;
        saveDataToStorage();
    });
    
    document.getElementById('backup-data').addEventListener('click', backupData);
    document.getElementById('restore-data').addEventListener('click', restoreData);
    document.getElementById('clear-data').addEventListener('click', clearData);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', hideShareModal);
    document.getElementById('copy-text').addEventListener('click', copyShareText);
}

// View Management
function updateView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // View-specific updates
    if (viewName === 'history') {
        renderCalendar();
        renderDreamList();
    } else if (viewName === 'analysis') {
        updateStatistics();
        updateWordStatistics();
        renderTagCloud();
        renderWordAnalysis();
        
        // 分析画面表示時のAPI呼び出しを削除（登録時のみ呼ぶため）
    }
    
    app.currentView = viewName;
}

// Input Type Management
function updateInputType(type) {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    document.querySelectorAll('.input-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${type}-input`).classList.add('active');
}

// Keywords Management
const keywords = [];

function addKeywordTag(keyword) {
    if (!keywords.includes(keyword)) {
        keywords.push(keyword);
        renderKeywordTags();
    }
}

function removeKeywordTag(keyword) {
    const index = keywords.indexOf(keyword);
    if (index > -1) {
        keywords.splice(index, 1);
        renderKeywordTags();
    }
}

function renderKeywordTags() {
    const container = document.getElementById('keyword-tags');
    container.innerHTML = keywords.map(keyword => `
        <span class="keyword-tag">
            ${keyword}
            <span class="remove" onclick="removeKeywordTag('${keyword}')">&times;</span>
        </span>
    `).join('');
}

// Dream Recording
let isAnalyzing = false; // 解析中フラグを追加

async function recordDream() {
    // 既に解析中の場合は処理を中断
    if (isAnalyzing) {
        showToast('現在解析中です。しばらくお待ちください。', 'warning');
        return;
    }
    
    const isKeywordsMode = document.querySelector('[data-type="keywords"]').classList.contains('active');
    let dreamContent = '';
    
    // Clear previous errors
    clearError();
    
    if (isKeywordsMode) {
        // Get keywords from field and tags
        const fieldValue = document.getElementById('keywords-field').value.trim();
        if (fieldValue) {
            keywords.push(...fieldValue.split(/\s+/));
        }
        
        if (keywords.length === 0) {
            showError('キーワードを入力してください', 'keywords-field');
            return;
        }
        
        dreamContent = keywords.join(' ');
    } else {
        dreamContent = document.getElementById('freetext-field').value.trim();
        if (!dreamContent) {
            showError('夢の内容を入力してください', 'freetext-field');
            return;
        }
    }
    
    // Set analyzing flag and show loading
    isAnalyzing = true;
    showLoading();
    
    try {
        // Process dream with AI
        const result = await analyzeDream(dreamContent, isKeywordsMode);
        
        // 元の入力内容を保持
        result.originalInput = dreamContent;
        
        // 単語の抽出と分析
        const extractedWords = await extractWordsFromDream(dreamContent, result);
        result.extractedWords = extractedWords;
        
        displayAnalysisResult(result);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('夢の解析中にエラーが発生しました。もう一度お試しください。');
    } finally {
        // 解析完了後にフラグをリセット
        isAnalyzing = false;
    }
}

// Error handling functions
function showError(message, fieldId = null) {
    const errorElement = document.getElementById('error-message');
    const ariaLive = document.getElementById('aria-live-region');
    
    errorElement.textContent = message;
    ariaLive.textContent = message;
    
    if (fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.add('input-error');
        field.focus();
    }
}

function clearError() {
    const errorElement = document.getElementById('error-message');
    const ariaLive = document.getElementById('aria-live-region');
    
    errorElement.textContent = '';
    ariaLive.textContent = '';
    
    // Remove error styling from all inputs
    document.querySelectorAll('.input-error').forEach(element => {
        element.classList.remove('input-error');
    });
}

// AI Analysis
async function analyzeDream(content, isKeywords) {
    const systemPrompt = 'あなたは夢の解釈の専門家です。ユング心理学と認知心理学の観点から夢を分析します。';
    
    const prompt = `以下の夢の内容を心理学的に解釈してください。
        
        夢の内容: ${content}
        
        以下の形式でJSONで回答してください:
        {
            "dreamText": "${content}",
            "symbols": [
                {"symbol": "シンボル名", "meaning": "意味の説明"}
            ],
            "psychologicalMessage": "深層心理からのメッセージ",
            "dailyInsight": "今日の気づき（1文）"
        }`;
    
    try {
        const response = await fetch(app.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dreamContent: content,
                isKeywords: isKeywords,
                systemPrompt: systemPrompt,
                prompt: prompt
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        console.log('サーバーに接続できません。モック分析を使用します。');
        return generateMockAnalysis(content, isKeywords);
    }
}

// Mock Analysis for Demo
function generateMockAnalysis(content, isKeywords) {
    const words = content.split(/\s+/);
    
    const dreamText = content;
    
    const symbols = words.slice(0, 3).map(word => ({
        symbol: word,
        meaning: `「${word}」は内面の${['変化', '成長', '不安', '希望', '挑戦'][Math.floor(Math.random() * 5)]}を象徴している可能性があります。`
    }));
    
    const messages = [
        '今のあなたは新しい可能性に向かって進む準備ができています。',
        '内なる声に耳を傾け、本当の気持ちと向き合う時期かもしれません。',
        '変化を恐れず、自分を信じて一歩踏み出してみましょう。'
    ];
    
    const insights = [
        '今日は小さな挑戦から始めてみよう',
        '自分の感情を大切にする一日に',
        '新しい視点で物事を見てみる'
    ];
    
    return {
        dreamText,
        symbols,
        psychologicalMessage: messages[Math.floor(Math.random() * messages.length)],
        dailyInsight: insights[Math.floor(Math.random() * insights.length)]
    };
}

// Display Analysis Result
function displayAnalysisResult(result) {
    app.currentAnalysis = result;
    
    document.getElementById('converted-dream-text').textContent = result.dreamText;
    
    const symbolsContainer = document.getElementById('symbol-meanings');
    symbolsContainer.innerHTML = result.symbols.map(symbol => `
        <div class="symbol-item">
            <strong>${symbol.symbol}</strong>: ${symbol.meaning}
        </div>
    `).join('');
    
    
    // 抽出された単語を表示
    if (result.extractedWords && result.extractedWords.length > 0) {
        displayExtractedWords(result.extractedWords);
    }
    
    document.getElementById('analysis-result').classList.remove('hidden');
}

// Save Dream
function saveDream() {
    if (!app.currentAnalysis) return;
    
    const dream = {
        id: Date.now(),
        date: new Date().toISOString(),
        content: app.currentAnalysis.originalInput || app.currentAnalysis.dreamText,
        keywords: keywords.slice(),
        analysis: app.currentAnalysis,
        tags: extractTags(app.currentAnalysis)
    };
    
    app.dreams.push(dream);
    
    // 確定した単語を保存
    if (app.currentAnalysis.extractedWords) {
        saveExtractedWords(dream.id, app.currentAnalysis.extractedWords);
        
        // 夢保存後のAPI呼び出しを削除（登録時のみ呼ぶため）
    }
    
    saveDataToStorage();
    
    showToast('夢が保存されました！', 'success');
    resetInput();
}

function extractTags(analysis) {
    const tags = [];
    analysis.symbols.forEach(symbol => {
        tags.push(symbol.symbol);
    });
    return tags;
}

// Reset Input
function resetInput() {
    document.getElementById('keywords-field').value = '';
    document.getElementById('freetext-field').value = '';
    keywords.length = 0;
    renderKeywordTags();
    document.getElementById('analysis-result').classList.add('hidden');
    app.currentAnalysis = null;
}

// Calendar Rendering
let currentCalendarDate = new Date();

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    document.getElementById('current-month').textContent = 
        `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Day headers
    const dayHeaders = ['日', '月', '火', '水', '木', '金', '土'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header-day';
        header.textContent = day;
        header.style.textAlign = 'center';
        header.style.fontWeight = 'bold';
        header.style.color = 'var(--text-secondary)';
        calendar.appendChild(header);
    });
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        calendar.appendChild(emptyCell);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        // Check if this day has a dream
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasDream = app.dreams.some(dream => 
            dream.date.startsWith(dateStr)
        );
        
        if (hasDream) {
            dayCell.classList.add('has-dream');
        }
        
        dayCell.addEventListener('click', () => showDreamsForDate(dateStr));
        calendar.appendChild(dayCell);
    }
}

function navigateCalendar(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function showDreamsForDate(dateStr) {
    const dreams = app.dreams.filter(dream => dream.date.startsWith(dateStr));
    if (dreams.length > 0) {
        // Show the first dream in a modal (since typically there's one dream per day)
        showDreamInModal(dreams[0]);
    }
}

// Modal functions
function showDreamInModal(dream) {
    const modal = document.getElementById('dream-modal');
    
    // Populate modal content
    document.getElementById('modal-date').textContent = formatDate(dream.date);
    document.getElementById('modal-dream-content').textContent = dream.content;
    
    // Populate analysis if available
    if (dream.analysis) {
        // Symbols
        const symbolsContainer = document.getElementById('modal-symbols');
        symbolsContainer.innerHTML = dream.analysis.symbols.map(symbol => `
            <div class="symbol-item">
                <strong>${symbol.symbol}</strong>: ${symbol.meaning}
            </div>
        `).join('');
        
        // Extracted words - 抽出された単語を表示
        if (dream.analysis.extractedWords && dream.analysis.extractedWords.length > 0) {
            const extractedWordsContainer = document.getElementById('modal-extracted-words');
            if (extractedWordsContainer) {
                extractedWordsContainer.innerHTML = dream.analysis.extractedWords.map(word => `
                    <span class="word-tag ${word.category}">${word.word}</span>
                `).join('');
                // 親コンテナも表示
                const parentContainer = extractedWordsContainer.parentElement;
                if (parentContainer) {
                    parentContainer.style.display = 'block';
                }
            }
        }
    }
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
}

function closeDreamModal(event) {
    // If event exists and it's clicking on the overlay (not the content), close
    if (event && event.target !== event.currentTarget) return;
    
    const modal = document.getElementById('dream-modal');
    modal.classList.add('hidden');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Dream List Rendering
function renderDreamList(dreamsToShow = null) {
    const dreamList = document.getElementById('dream-list');
    const dreams = dreamsToShow || app.dreams.slice().reverse();
    
    if (dreams.length === 0) {
        dreamList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">まだ夢が記録されていません</p>';
        return;
    }
    
    dreamList.innerHTML = dreams.map(dream => `
        <div class="dream-item" onclick="showDreamDetail(${dream.id})">
            <div class="dream-date">${formatDate(dream.date)}</div>
            <div class="dream-preview">${dream.content.substring(0, 100)}...</div>
        </div>
    `).join('');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function showDreamDetail(dreamId) {
    const dream = app.dreams.find(d => d.id === dreamId);
    if (!dream) return;
    
    // Show the dream in a modal instead of switching views
    showDreamInModal(dream);
}

// Tag Cloud
function renderTagCloud() {
    const tagCounts = {};
    
    app.dreams.forEach(dream => {
        dream.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    const tagCloud = document.getElementById('tag-cloud');
    
    if (Object.keys(tagCounts).length === 0) {
        tagCloud.innerHTML = '<p style="color: var(--text-secondary);">まだタグがありません</p>';
        return;
    }
    
    const maxCount = Math.max(...Object.values(tagCounts));
    
    tagCloud.innerHTML = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([tag, count]) => {
            const size = 0.8 + (count / maxCount) * 1.2;
            return `<span class="tag-cloud-item" style="font-size: ${size}rem">${tag}</span>`;
        })
        .join('');
}

// Statistics
function updateStatistics() {
    document.getElementById('total-dreams').textContent = app.dreams.length;
    
    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let checkDate = new Date(today);
    
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasDream = app.dreams.some(dream => dream.date.startsWith(dateStr));
        
        if (hasDream) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    document.getElementById('current-streak').textContent = streak;
    
    // Most common theme
    const themeCounts = {};
    app.dreams.forEach(dream => {
        dream.tags.forEach(tag => {
            themeCounts[tag] = (themeCounts[tag] || 0) + 1;
        });
    });
    
    const mostCommon = Object.entries(themeCounts)
        .sort((a, b) => b[1] - a[1])[0];
    
    document.getElementById('common-theme').textContent = mostCommon ? mostCommon[0] : '-';
}

// Export Functions
function exportAsCSV() {
    const headers = ['日付', '夢の内容', 'キーワード', '今日の気づき'];
    const rows = app.dreams.map(dream => [
        formatDate(dream.date),
        dream.content,
        dream.keywords.join(' '),
        dream.analysis.dailyInsight
    ]);
    
    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    downloadFile(csv, 'dreamscope_export.csv', 'text/csv');
}

function exportAsJSON() {
    const json = JSON.stringify(app.dreams, null, 2);
    downloadFile(json, 'dreamscope_export.json', 'application/json');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Share Modal
let previouslyFocused = null;

function showShareModal() {
    if (!app.currentAnalysis) return;
    
    // Store previously focused element
    previouslyFocused = document.activeElement;
    
    generateShareText();
    const modal = document.getElementById('share-modal');
    modal.classList.remove('hidden');
    
    // Set initial focus to close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.focus();
    
    // Add focus trap
    setupFocusTrap(modal);
}

function hideShareModal() {
    const modal = document.getElementById('share-modal');
    modal.classList.add('hidden');
    
    // Remove focus trap
    removeFocusTrap(modal);
    
    // Restore focus to previously focused element
    if (previouslyFocused) {
        previouslyFocused.focus();
        previouslyFocused = null;
    }
}

// Focus trap implementation
function setupFocusTrap(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    function handleTabKey(e) {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    
    function handleEscKey(e) {
        if (e.key === 'Escape') {
            hideShareModal();
        }
    }
    
    element.addEventListener('keydown', handleTabKey);
    element.addEventListener('keydown', handleEscKey);
    
    // Store handlers for removal
    element._focusTrapHandlers = { handleTabKey, handleEscKey };
}

function removeFocusTrap(element) {
    if (element._focusTrapHandlers) {
        element.removeEventListener('keydown', element._focusTrapHandlers.handleTabKey);
        element.removeEventListener('keydown', element._focusTrapHandlers.handleEscKey);
        delete element._focusTrapHandlers;
    }
}

function generateShareText() {
    const shareTextArea = document.getElementById('share-text');
    const date = formatDate(new Date().toISOString());
    const dreamContent = app.currentAnalysis.originalInput || app.currentAnalysis.dreamText || '';
    const symbols = app.currentAnalysis.symbols || [];
    
    let shareText = `🌙 DreamScope - ${date}\n\n`;
    shareText += `【夢の内容】\n${dreamContent}\n\n`;
    
    if (symbols.length > 0) {
        shareText += `【象徴と意味】\n`;
        symbols.forEach(symbol => {
            shareText += `・${symbol.symbol}: ${symbol.meaning}\n`;
        });
    }
    
    shareText += `\n#DreamScope #夢日記 #夢分析`;
    
    shareTextArea.value = shareText;
}

function copyShareText() {
    const shareTextArea = document.getElementById('share-text');
    shareTextArea.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = document.getElementById('copy-text');
    const originalText = button.textContent;
    button.textContent = 'コピーしました！';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}


// Settings Functions
function backupData() {
    const backup = {
        dreams: app.dreams,
        settings: app.settings,
        date: new Date().toISOString()
    };
    
    const json = JSON.stringify(backup, null, 2);
    downloadFile(json, `dreamscope_backup_${Date.now()}.json`, 'application/json');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            
            if (backup.dreams && backup.settings) {
                app.dreams = backup.dreams;
                app.settings = backup.settings;
                saveDataToStorage();
                
                alert('データを復元しました！');
                location.reload();
            } else {
                alert('無効なバックアップファイルです');
            }
        } catch (err) {
            alert('ファイルの読み込みに失敗しました');
        }
    };
    
    input.click();
}

function clearData() {
    if (confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
        localStorage.clear();
        app.dreams = [];
        app.settings = { reminderEnabled: false };
        // API key removed - using server endpoint
        
        alert('すべてのデータを削除しました');
        location.reload();
    }
}

// Loading
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    const recordBtn = document.getElementById('record-btn');
    
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    
    // Disable button during loading
    recordBtn.disabled = true;
    recordBtn.setAttribute('aria-busy', 'true');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    const recordBtn = document.getElementById('record-btn');
    
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    // Re-enable button
    recordBtn.disabled = false;
    recordBtn.setAttribute('aria-busy', 'false');
}

// Toast notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    container.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Make functions globally accessible
window.removeKeywordTag = removeKeywordTag;
window.showDreamDetail = showDreamDetail;

// Enhanced Accessibility
function enhanceAccessibility() {
    // Announce page changes to screen readers
    const announcePageChange = (viewName) => {
        const viewNames = {
            'input': '夢の記録画面',
            'history': '夢の履歴画面',
            'analysis': '夢の分析画面',
            'settings': '設定画面'
        };
        announceToScreenReader(`${viewNames[viewName]}に切り替わりました`);
    };
    
    // Store reference to updateView function
    window.updateView = updateView;
    
    // Enhance keyboard navigation for keyword tags
    const keywordsField = document.getElementById('keywords-field');
    keywordsField.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const tags = document.querySelectorAll('.keyword-tag');
            if (tags.length > 0) {
                e.preventDefault();
                navigateKeywordTags(e.key === 'ArrowRight' ? 1 : -1);
            }
        }
    });
    
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'sr-only skip-link';
    skipLink.textContent = 'メインコンテンツへスキップ';
    skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('input-view').focus();
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Screen reader announcements
function announceToScreenReader(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
        liveRegion.textContent = '';
    }, 1000);
}

// Micro-interactions
function addMicroInteractions() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
    
    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
        const importantButtons = document.querySelectorAll('.record-btn, .save-dream-btn');
        importantButtons.forEach(button => {
            button.addEventListener('click', () => {
                navigator.vibrate(10);
            });
        });
    }
    
    // Enhance loading state with particles
    enhanceLoadingAnimation();
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add input feedback
    addInputFeedback();
}

// Ripple effect for buttons
function createRipple(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Enhanced loading animation with dream particles
function enhanceLoadingAnimation() {
    const loadingElement = document.querySelector('.loading-spinner');
    if (!loadingElement) return;
    
    const particleContainer = document.createElement('div');
    particleContainer.className = 'loading-particles';
    
    // Create 5 particles
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'dream-particle';
        particleContainer.appendChild(particle);
    }
    
    loadingElement.appendChild(particleContainer);
}

// Input feedback
function addInputFeedback() {
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('input-focused');
        });
        
        // Real-time character count for textarea
        if (input.tagName === 'TEXTAREA') {
            const counter = document.createElement('div');
            counter.className = 'character-counter';
            input.parentElement.appendChild(counter);
            
            input.addEventListener('input', () => {
                const length = input.value.length;
                counter.textContent = `${length}文字`;
                counter.classList.toggle('warning', length > 500);
            });
        }
    });
}

// Keyboard navigation for tags
let currentTagIndex = -1;

function navigateKeywordTags(direction) {
    const tags = document.querySelectorAll('.keyword-tag');
    if (tags.length === 0) return;
    
    currentTagIndex += direction;
    if (currentTagIndex < 0) currentTagIndex = tags.length - 1;
    if (currentTagIndex >= tags.length) currentTagIndex = 0;
    
    tags.forEach((tag, index) => {
        tag.classList.toggle('focused', index === currentTagIndex);
        if (index === currentTagIndex) {
            tag.focus();
        }
    });
}

// Onboarding for first-time users
function checkFirstTimeUser() {
    if (!localStorage.getItem('dreamscope_onboarded')) {
        setTimeout(() => {
            startOnboarding();
        }, 500);
    }
}

// Onboarding flow
function startOnboarding() {
    const onboarding = new OnboardingFlow();
    onboarding.start();
}

// 単語抽出関数
async function extractWordsFromDream(content, analysis) {
    const extractedWords = [];
    
    // 感情単語の検出
    const emotionPatterns = {
        '不安': ['心配', '不安', 'そわそわ', '落ち着かない'],
        '喜び': ['嬉しい', '楽しい', '幸せ', 'happy'],
        '恐怖': ['怖い', '恐ろしい', 'こわい', '逃げ'],
        '悲しみ': ['悲しい', '泣', '涙', 'さみしい'],
        '怒り': ['怒', 'いらいら', 'むかつく', '腹立'],
        '驚き': ['驚', 'びっくり', '突然', '急に'],
        '期待': ['期待', '楽しみ', 'わくわく', '待ち遠しい'],
        '安心': ['安心', 'ほっと', '落ち着', '穏やか']
    };

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
        if (patterns.some(pattern => content.includes(pattern))) {
            extractedWords.push({ 
                word: emotion, 
                category: 'emotion', 
                confidence: 0.8,
                source: 'pattern' 
            });
        }
    }

    // テーマの抽出
    const themes = {
        '家族': ['家族', '母', '父', '兄', '弟', '姉', '妹', '親', '子供'],
        '仕事': ['仕事', '会社', '職場', '上司', '同僚', '締切', 'プロジェクト'],
        '学校': ['学校', '授業', '試験', 'テスト', '先生', '勉強', '宿題'],
        '旅行': ['旅行', '旅', '飛行機', '電車', '外国', '観光', 'ホテル'],
        '自然': ['山', '海', '川', '森', '空', '雲', '太陽', '月', '星']
    };

    for (const [theme, keywords] of Object.entries(themes)) {
        if (keywords.some(keyword => content.includes(keyword))) {
            extractedWords.push({ 
                word: theme, 
                category: 'theme', 
                confidence: 0.7,
                source: 'pattern' 
            });
        }
    }

    // シンボルの抽出
    const symbolPatterns = {
        '水': ['水', '海', '川', '雨', '涙', 'プール'],
        '火': ['火', '炎', '燃える', '熱い', '太陽'],
        '動物': ['犬', '猫', '鳥', '魚', '馬', '蛇', '虫'],
        '建物': ['家', '建物', 'ビル', '部屋', '扉', '窓'],
        '乗り物': ['車', '電車', '飛行機', '自転車', 'バス', '船']
    };

    for (const [symbol, patterns] of Object.entries(symbolPatterns)) {
        if (patterns.some(pattern => content.includes(pattern))) {
            extractedWords.push({ 
                word: symbol, 
                category: 'symbol', 
                confidence: 0.6,
                source: 'pattern' 
            });
        }
    }
    
    // AI分析からのシンボルも追加
    if (analysis.symbols) {
        analysis.symbols.forEach(symbol => {
            if (!extractedWords.some(w => w.word === symbol.symbol)) {
                extractedWords.push({
                    word: symbol.symbol,
                    category: 'symbol',
                    confidence: 0.9,
                    source: 'ai'
                });
            }
        });
    }

    return extractedWords;
}

// 抽出した単語の表示
function displayExtractedWords(words) {
    // 既存のコンテナがあれば削除
    const existingContainer = document.querySelector('.extracted-words-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    const container = document.createElement('div');
    container.className = 'extracted-words-container';
    container.innerHTML = `
        <h4>抽出された単語</h4>
        <div id="extracted-words" class="word-container"></div>
        <div class="word-add-section">
            <h4>単語を追加</h4>
            <input type="text" id="new-word" placeholder="新しい単語を入力">
            <button onclick="addCustomWord()">単語を追加</button>
        </div>
    `;
    
    // 既存の分析結果の後に挿入
    const analysisResult = document.getElementById('analysis-result');
    const interpretation = analysisResult.querySelector('.interpretation');
    interpretation.insertAdjacentElement('afterend', container);
    
    // 単語を表示
    renderExtractedWords(words);
}

// 単語のレンダリング
function renderExtractedWords(words) {
    const container = document.getElementById('extracted-words');
    container.innerHTML = words.map((wordData, index) => `
        <div class="word-tag ${wordData.category}" data-index="${index}">
            <span>${wordData.word}</span>
            <button onclick="editExtractedWord(${index})">編集</button>
            <button onclick="removeExtractedWord(${index})">×</button>
        </div>
    `).join('');
}

// カスタム単語の追加
function addCustomWord() {
    const wordInput = document.getElementById('new-word');
    const word = wordInput.value.trim();
    const category = 'general'; // デフォルトカテゴリーを使用

    if (word && app.currentAnalysis) {
        if (!app.currentAnalysis.extractedWords) {
            app.currentAnalysis.extractedWords = [];
        }
        
        app.currentAnalysis.extractedWords.push({
            word: word,
            category: category,
            confidence: 1.0,
            source: 'user'
        });
        
        renderExtractedWords(app.currentAnalysis.extractedWords);
        wordInput.value = '';
    }
}

// 単語の編集
function editExtractedWord(index) {
    if (!app.currentAnalysis || !app.currentAnalysis.extractedWords) return;
    
    const wordData = app.currentAnalysis.extractedWords[index];
    
    // パラメータ編集モーダルを表示
    showWordVectorEditModal(wordData, index);
}

// 単語ベクトル編集モーダルの表示（夢登録時用）
function showWordVectorEditModal(wordData, index) {
    const word = wordData.word;
    
    // 既存のベクトルを取得、なければデフォルト値
    const currentVector = app.customVectors[word] || 
                         app.aiGeneratedVectors[word] || 
                         [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'word-vector-edit-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content vector-modal" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeWordVectorEditModal()">×</button>
            <h3 class="modal-title">「${word}」の編集</h3>
            
            <div class="word-name-editor">
                <label>単語名:</label>
                <input type="text" id="word-name-input" value="${word}" class="word-name-input">
            </div>
            
            <div class="vector-editor">
                <h4>意味的特徴（-1.0 〜 1.0）</h4>
                
                <div class="vector-dimension">
                    <label>気持ち <small>(暗い ← → 明るい)</small></label>
                    <input type="range" id="edit-vector-0" min="-100" max="100" value="${currentVector[0] * 100}" 
                           oninput="updateEditVectorDisplay(0, this.value)">
                    <span id="edit-vector-value-0" class="vector-value">${currentVector[0].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>動き <small>(じっと ← → 活発)</small></label>
                    <input type="range" id="edit-vector-1" min="-100" max="100" value="${currentVector[1] * 100}"
                           oninput="updateEditVectorDisplay(1, this.value)">
                    <span id="edit-vector-value-1" class="vector-value">${currentVector[1].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>深さ <small>(表面的 ← → 深層的)</small></label>
                    <input type="range" id="edit-vector-2" min="-100" max="100" value="${currentVector[2] * 100}"
                           oninput="updateEditVectorDisplay(2, this.value)">
                    <span id="edit-vector-value-2" class="vector-value">${currentVector[2].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>つながり <small>(ひとり ← → みんな)</small></label>
                    <input type="range" id="edit-vector-3" min="-100" max="100" value="${currentVector[3] * 100}"
                           oninput="updateEditVectorDisplay(3, this.value)">
                    <span id="edit-vector-value-3" class="vector-value">${currentVector[3].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>形 <small>(はっきり ← → ぼんやり)</small></label>
                    <input type="range" id="edit-vector-4" min="-100" max="100" value="${currentVector[4] * 100}"
                           oninput="updateEditVectorDisplay(4, this.value)">
                    <span id="edit-vector-value-4" class="vector-value">${currentVector[4].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>時 <small>(過去 ← → 未来)</small></label>
                    <input type="range" id="edit-vector-5" min="-100" max="100" value="${currentVector[5] * 100}"
                           oninput="updateEditVectorDisplay(5, this.value)">
                    <span id="edit-vector-value-5" class="vector-value">${currentVector[5].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>不思議さ <small>(普通 ← → 不思議)</small></label>
                    <input type="range" id="edit-vector-6" min="-100" max="100" value="${currentVector[6] * 100}"
                           oninput="updateEditVectorDisplay(6, this.value)">
                    <span id="edit-vector-value-6" class="vector-value">${currentVector[6].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>体感 <small>(心 ← → 体)</small></label>
                    <input type="range" id="edit-vector-7" min="-100" max="100" value="${currentVector[7] * 100}"
                           oninput="updateEditVectorDisplay(7, this.value)">
                    <span id="edit-vector-value-7" class="vector-value">${currentVector[7].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>変化 <small>(同じ ← → 変わる)</small></label>
                    <input type="range" id="edit-vector-8" min="-100" max="100" value="${currentVector[8] * 100}"
                           oninput="updateEditVectorDisplay(8, this.value)">
                    <span id="edit-vector-value-8" class="vector-value">${currentVector[8].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>広がり <small>(自分だけ ← → みんなの)</small></label>
                    <input type="range" id="edit-vector-9" min="-100" max="100" value="${currentVector[9] * 100}"
                           oninput="updateEditVectorDisplay(9, this.value)">
                    <span id="edit-vector-value-9" class="vector-value">${currentVector[9].toFixed(2)}</span>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="primary-btn" onclick="saveEditedWord(${index}, '${word}')">保存</button>
                <button class="secondary-btn" onclick="closeWordVectorEditModal()">キャンセル</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWordVectorEditModal();
        }
    });
}

// 単語の削除
function removeExtractedWord(index) {
    if (!app.currentAnalysis || !app.currentAnalysis.extractedWords) return;
    
    app.currentAnalysis.extractedWords.splice(index, 1);
    renderExtractedWords(app.currentAnalysis.extractedWords);
}

// 抽出した単語の保存
function saveExtractedWords(dreamId, extractedWords) {
    extractedWords.forEach((wordData, index) => {
        // デフォルトのベクトル値を設定または既存の値を使用
        const vector = getOrCreateWordVector(wordData.word);
        
        app.words.push({
            id: Date.now() + index,
            word: wordData.word,
            category: wordData.category,
            dreamId: dreamId,
            date: new Date().toISOString(),
            confidence: wordData.confidence,
            source: wordData.source,
            vector: vector // ベクトル情報を追加
        });
    });
    
    // カスタムベクトルを保存
    saveCustomVectors();
}

// 単語のベクトルを取得または作成
function getOrCreateWordVector(word) {
    // カスタムベクトルが存在する場合
    if (app.customVectors && app.customVectors[word]) {
        return app.customVectors[word];
    }
    
    // AIで生成されたベクトルが存在する場合
    if (app.aiGeneratedVectors && app.aiGeneratedVectors[word]) {
        return app.aiGeneratedVectors[word];
    }
    
    // 既定のベクトルが存在する場合
    if (window.dreamWordEmbeddings && window.dreamWordEmbeddings[word]) {
        return window.dreamWordEmbeddings[word];
    }
    
    // 新規作成（デフォルト値）- 10次元
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

// 単語統計の更新
function updateWordStatistics() {
    if (!document.getElementById('word-stats')) {
        // 単語統計セクションを追加
        const analysisView = document.getElementById('analysis-view');
        const statsSection = document.createElement('div');
        statsSection.className = 'word-statistics';
        statsSection.innerHTML = `
            <h3>単語分析</h3>
            <div id="word-stats" class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number" id="total-words">0</span>
                    <span class="stat-label">総単語数</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" id="unique-words">0</span>
                    <span class="stat-label">ユニーク単語数</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number" id="avg-words-per-dream">0</span>
                    <span class="stat-label">平均単語数/夢</span>
                </div>
            </div>
            <div class="word-cloud-container">
                <h4>ワードクラウド</h4>
                <div id="word-cloud" class="word-cloud"></div>
            </div>
            <div class="word-frequency-container">
                <h4>頻出単語</h4>
                <div id="word-frequency-list" class="frequency-list"></div>
            </div>
        `;
        
        const tagCloudContainer = analysisView.querySelector('.tag-cloud-container');
        tagCloudContainer.insertAdjacentElement('afterend', statsSection);
    }
    
    // 統計値の計算
    document.getElementById('total-words').textContent = app.words.length;
    
    const uniqueWords = new Set(app.words.map(w => w.word));
    document.getElementById('unique-words').textContent = uniqueWords.size;
    
    const avgWords = app.dreams.length > 0 ? 
        Math.round(app.words.length / app.dreams.length * 10) / 10 : 0;
    document.getElementById('avg-words-per-dream').textContent = avgWords;
    
    // ワードクラウドと頻出単語を更新
    updateWordCloud();
    updateWordFrequency();
}

// ワードクラウドの更新
function updateWordCloud() {
    const wordCloud = document.getElementById('word-cloud');
    if (!wordCloud) return;
    
    const wordFreq = {};
    
    // 単語の頻度を計算
    app.words.forEach(w => {
        wordFreq[w.word] = (wordFreq[w.word] || 0) + 1;
    });

    // ワードクラウドを生成
    wordCloud.innerHTML = '';
    Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .forEach(([word, freq]) => {
            const span = document.createElement('span');
            span.className = 'cloud-word';
            span.textContent = word;
            span.style.fontSize = `${Math.min(12 + freq * 4, 40)}px`;
            span.style.color = `hsl(${Math.random() * 60 + 240}, 70%, ${50 - freq * 2}%)`;
            span.onclick = () => showWordDetails(word);
            wordCloud.appendChild(span);
        });

    if (app.words.length === 0) {
        wordCloud.innerHTML = '<p style="color: var(--text-secondary);">まだ単語が登録されていません</p>';
    }
}

// 頻出単語リストの更新
function updateWordFrequency() {
    const frequencyList = document.getElementById('word-frequency-list');
    if (!frequencyList) return;
    
    const wordFreq = {};
    app.words.forEach(w => {
        wordFreq[w.word] = (wordFreq[w.word] || 0) + 1;
    });
    
    const sortedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    frequencyList.innerHTML = sortedWords.map(([word, count], index) => `
        <div class="frequency-item">
            <span class="rank">${index + 1}</span>
            <span class="word">${word}</span>
            <span class="count">${count}回</span>
        </div>
    `).join('');
    
    if (sortedWords.length === 0) {
        frequencyList.innerHTML = '<p style="color: var(--text-secondary);">データがありません</p>';
    }
}

// 単語の詳細表示
function showWordDetails(word) {
    const wordData = app.words.filter(w => w.word === word);
    const dreams = wordData.map(w => {
        return app.dreams.find(d => d.id === w.dreamId);
    }).filter(d => d);
    
    // ベクトル編集モーダルを表示
    showWordVectorModal(word, wordData);
}

// 単語ベクトル編集モーダルの表示
function showWordVectorModal(word, wordDataArray) {
    // 既存のモーダルを削除
    const existingModal = document.getElementById('word-vector-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // AIベクトルは登録時に取得しているため、ここでの取得は不要
    
    // 現在のベクトルを取得
    const currentVector = getOrCreateWordVector(word);
    
    // モーダルを作成
    const modal = document.createElement('div');
    modal.id = 'word-vector-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content vector-modal" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeWordVectorModal()">×</button>
            <h3 class="modal-title">「${word}」の特徴</h3>
            
            <div class="vector-info">
                <p>出現回数: ${wordDataArray.length}回</p>
                ${app.aiGeneratedVectors[word] ? '<p class="ai-generated-tag">🤖 AI生成</p>' : ''}
            </div>
            
            <div class="vector-editor">
                <h4>意味的特徴（-1.0 〜 1.0）</h4>
                
                <div class="vector-dimension">
                    <label>気持ち <small>(暗い ← → 明るい)</small></label>
                    <input type="range" id="vector-0" min="-100" max="100" value="${currentVector[0] * 100}" 
                           oninput="updateVectorDisplay(0, this.value)">
                    <span id="vector-value-0" class="vector-value">${currentVector[0].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>動き <small>(じっと ← → 活発)</small></label>
                    <input type="range" id="vector-1" min="-100" max="100" value="${currentVector[1] * 100}"
                           oninput="updateVectorDisplay(1, this.value)">
                    <span id="vector-value-1" class="vector-value">${currentVector[1].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>深さ <small>(表面的 ← → 深層的)</small></label>
                    <input type="range" id="vector-2" min="-100" max="100" value="${currentVector[2] * 100}"
                           oninput="updateVectorDisplay(2, this.value)">
                    <span id="vector-value-2" class="vector-value">${currentVector[2].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>つながり <small>(ひとり ← → みんな)</small></label>
                    <input type="range" id="vector-3" min="-100" max="100" value="${currentVector[3] * 100}"
                           oninput="updateVectorDisplay(3, this.value)">
                    <span id="vector-value-3" class="vector-value">${currentVector[3].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>形 <small>(はっきり ← → ぼんやり)</small></label>
                    <input type="range" id="vector-4" min="-100" max="100" value="${currentVector[4] * 100}"
                           oninput="updateVectorDisplay(4, this.value)">
                    <span id="vector-value-4" class="vector-value">${currentVector[4].toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>時 <small>(過去 ← → 未来)</small></label>
                    <input type="range" id="vector-5" min="-100" max="100" value="${(currentVector[5] || 0) * 100}"
                           oninput="updateVectorDisplay(5, this.value)">
                    <span id="vector-value-5" class="vector-value">${(currentVector[5] || 0).toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>不思議さ <small>(普通 ← → 不思議)</small></label>
                    <input type="range" id="vector-6" min="-100" max="100" value="${(currentVector[6] || 0) * 100}"
                           oninput="updateVectorDisplay(6, this.value)">
                    <span id="vector-value-6" class="vector-value">${(currentVector[6] || 0).toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>体感 <small>(心 ← → 体)</small></label>
                    <input type="range" id="vector-7" min="-100" max="100" value="${(currentVector[7] || 0) * 100}"
                           oninput="updateVectorDisplay(7, this.value)">
                    <span id="vector-value-7" class="vector-value">${(currentVector[7] || 0).toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>変化 <small>(同じ ← → 変わる)</small></label>
                    <input type="range" id="vector-8" min="-100" max="100" value="${(currentVector[8] || 0) * 100}"
                           oninput="updateVectorDisplay(8, this.value)">
                    <span id="vector-value-8" class="vector-value">${(currentVector[8] || 0).toFixed(2)}</span>
                </div>
                
                <div class="vector-dimension">
                    <label>広がり <small>(自分だけ ← → みんなの)</small></label>
                    <input type="range" id="vector-9" min="-100" max="100" value="${(currentVector[9] || 0) * 100}"
                           oninput="updateVectorDisplay(9, this.value)">
                    <span id="vector-value-9" class="vector-value">${(currentVector[9] || 0).toFixed(2)}</span>
                </div>
                
                <div class="similar-words">
                    <h4>類似する単語</h4>
                    <div id="similar-words-list"></div>
                </div>
                
                <div class="modal-actions">
                    <button onclick="saveWordVector('${word}')" class="action-btn primary">保存</button>
                    <button onclick="resetWordVector('${word}')" class="action-btn secondary">リセット</button>
                    <button onclick="closeWordVectorModal()" class="action-btn tertiary">キャンセル</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = closeWordVectorModal;
    
    // 類似単語を表示
    updateSimilarWords(word);
}

// ベクトル値の表示更新
function updateVectorDisplay(index, value) {
    const displayValue = (value / 100).toFixed(2);
    document.getElementById(`vector-value-${index}`).textContent = displayValue;
    
    // 現在編集中の単語を取得
    const modalTitle = document.querySelector('.vector-modal h3').textContent;
    const word = modalTitle.match(/「(.+)」/)[1];
    
    // 類似単語を更新
    updateSimilarWords(word);
}

// 類似単語の更新
function updateSimilarWords(targetWord) {
    // 現在のベクトル値を取得
    const currentVector = [];
    for (let i = 0; i < 5; i++) {
        const value = document.getElementById(`vector-${i}`).value / 100;
        currentVector.push(value);
    }
    
    // すべての単語との類似度を計算
    const similarities = [];
    const allWords = new Set();
    
    // 既存の単語を収集
    if (window.dreamWordEmbeddings) {
        Object.keys(window.dreamWordEmbeddings).forEach(word => allWords.add(word));
    }
    app.words.forEach(w => allWords.add(w.word));
    
    allWords.forEach(word => {
        if (word !== targetWord) {
            const wordVector = getOrCreateWordVector(word);
            const similarity = window.cosineSimilarity ? 
                window.cosineSimilarity(currentVector, wordVector) : 0;
            similarities.push({ word, similarity });
        }
    });
    
    // 類似度でソート
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // 上位5個を表示
    const listHtml = similarities.slice(0, 5).map(item => 
        `<div class="similar-word-item">
            <span class="word">${item.word}</span>
            <span class="similarity">${(item.similarity * 100).toFixed(0)}%</span>
        </div>`
    ).join('');
    
    document.getElementById('similar-words-list').innerHTML = listHtml || '<p>類似単語が見つかりません</p>';
}

// 単語ベクトルの保存
function saveWordVector(word) {
    const vector = [];
    for (let i = 0; i < 10; i++) {
        vector.push(document.getElementById(`vector-${i}`).value / 100);
    }
    
    // カスタムベクトルとして保存
    if (!app.customVectors) {
        app.customVectors = {};
    }
    app.customVectors[word] = vector;
    
    // ストレージに保存
    saveCustomVectors();
    
    showToast(`「${word}」の特徴を保存しました`, 'success');
    closeWordVectorModal();
    
    // 分析画面を更新
    if (app.currentView === 'analysis') {
    }
}

// カスタムベクトルの保存
function saveCustomVectors() {
    localStorage.setItem('dreamscope_vectors', JSON.stringify(app.customVectors));
}

// 単語ベクトルのリセット
function resetWordVector(word) {
    // デフォルトベクトルを取得
    const defaultVector = window.dreamWordEmbeddings && window.dreamWordEmbeddings[word] ?
        window.dreamWordEmbeddings[word] : [0, 0, 0, 0, 0];
    
    // スライダーを更新
    for (let i = 0; i < 5; i++) {
        document.getElementById(`vector-${i}`).value = defaultVector[i] * 100;
        document.getElementById(`vector-value-${i}`).textContent = defaultVector[i].toFixed(2);
    }
    
    // 類似単語を更新
    updateSimilarWords(word);
}

// モーダルを閉じる
function closeWordVectorModal() {
    const modal = document.getElementById('word-vector-modal');
    if (modal) {
        modal.remove();
    }
}

// AIから単語ベクトルを取得
async function fetchWordVectorFromAI(word) {
    
    const systemPrompt = 'あなたは夢分析の専門家です。単語の意味的特徴を数値化して評価します。';
    
    const prompt = `以下の単語「${word}」について、夢分析の観点から10の特徴を-1.0から1.0の範囲で評価してください。

特徴:
1. 気持ち (暗い:-1.0 ← → 明るい:1.0)
2. 動き (じっと:-1.0 ← → 活発:1.0)
3. 深さ (表面的:-1.0 ← → 深層的:1.0)
4. つながり (ひとり:-1.0 ← → みんな:1.0)
5. 形 (はっきり:-1.0 ← → ぼんやり:1.0)
6. 時 (過去:-1.0 ← → 未来:1.0)
7. 不思議さ (普通:-1.0 ← → 不思議:1.0)
8. 体感 (心:-1.0 ← → 体:1.0)
9. 変化 (同じ:-1.0 ← → 変わる:1.0)
10. 広がり (自分だけ:-1.0 ← → みんなの:1.0)

必ず以下のJSON形式で回答してください:
{
    "word": "${word}",
    "vector": [気持ち, 動き, 深さ, つながり, 形, 時, 不思議さ, 体感, 変化, 広がり],
    "explanation": "この評価の簡単な説明"
}`;

    try {
        const response = await fetch(app.serverEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'word_vector',
                word: word,
                systemPrompt: systemPrompt,
                prompt: prompt
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        const result = data;
        
        // 結果を保存
        if (!app.aiGeneratedVectors) {
            app.aiGeneratedVectors = {};
        }
        app.aiGeneratedVectors[word] = result.vector;
        
        // ストレージに保存
        localStorage.setItem('dreamscope_ai_vectors', JSON.stringify(app.aiGeneratedVectors));
        
        showToast(`「${word}」の特徴をAIから取得しました`, 'success');
        
        return result.vector;
    } catch (error) {
        console.error('AI Vector Fetch Error:', error);
        showToast('AIからの取得に失敗しました', 'error');
        return null;
    }
}


// 単語分析のレンダリング
function renderWordAnalysis() {
    updateWordStatistics();
    
    // This function appears to be incomplete or merged with another function
    // For now, just close it properly
}

/* ORPHANED CODE - Commenting out to fix syntax error
        chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">この期間のデータがありません</p>';
        return;
    }
    
    // Process words for semantic distance calculation
    const processedWords = calculateSemanticPositions(recentWords);
    
    // Set up D3.js chart dimensions
    const margin = {top: 20, right: 20, bottom: 40, left: 40};
    const width = Math.min(chartContainer.offsetWidth - margin.left - margin.right, 600);
    const height = Math.min(400 - margin.top - margin.bottom, 400);
    
    // Create SVG
    const svg = d3.select(chartContainer)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales based on semantic positions
    const xScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([-1, 1])
        .range([height, 0]);
    
    // Color scale for categories
    const colorScale = d3.scaleOrdinal()
        .domain(['emotion', 'theme', 'symbol', 'general'])
        .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#95a5a6']);
    
    // Size scale for frequency
    const sizeScale = d3.scaleSqrt()
        .domain([1, d3.max(processedWords, d => d.frequency) || 1])
        .range([5, 20]);
    
    // Add axes with labels
    const xAxis = d3.axisBottom(xScale).tickValues([-1, -0.5, 0, 0.5, 1]);
    const yAxis = d3.axisLeft(yScale).tickValues([-1, -0.5, 0, 0.5, 1]);
    
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .style('opacity', 0.3);
    
    svg.append('g')
        .call(yAxis)
        .style('opacity', 0.3);
    
    // Add center lines
    svg.append('line')
        .attr('x1', xScale(0))
        .attr('x2', xScale(0))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', 'var(--border-color)')
        .style('stroke-width', 1)
        .style('opacity', 0.5);
    
    svg.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .style('stroke', 'var(--border-color)')
        .style('stroke-width', 1)
        .style('opacity', 0.5);
    
    // Add quadrant labels
    const quadrantLabels = [
        { x: 0.7, y: -0.7, text: '意識的・個人的' },
        { x: -0.7, y: -0.7, text: '無意識的・個人的' },
        { x: -0.7, y: 0.7, text: '無意識的・普遍的' },
        { x: 0.7, y: 0.7, text: '意識的・普遍的' }
    ];
    
    svg.selectAll('.quadrant-label')
        .data(quadrantLabels)
        .enter().append('text')
        .attr('class', 'quadrant-label')
        .attr('x', d => xScale(d.x))
        .attr('y', d => yScale(d.y))
        .attr('text-anchor', 'middle')
        .style('fill', 'var(--text-secondary)')
        .style('font-size', '11px')
        .style('opacity', 0.6)
        .text(d => d.text);
    
    // Add tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'word-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    const bubbles = svg.selectAll('.word-bubble')
        .data(processedWords)
        .enter().append('g')
        .attr('class', 'word-bubble');
    
    bubbles.append('circle')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', d => sizeScale(d.frequency))
        .attr('fill', d => colorScale(d.category))
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1);
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`
                <strong>${d.word}</strong><br/>
                カテゴリ: ${getCategoryLabel(d.category)}<br/>
                出現回数: ${d.frequency}<br/>
                最近の出現: ${formatShortDate(new Date(d.lastDate))}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(d) {
            d3.select(this).attr('opacity', 0.7);
            tooltip.transition().duration(500).style('opacity', 0);
        })
        .on('click', function(event, d) {
            showWordDetails(d.word);
        });
    
    // Add word labels for high-frequency words
    bubbles.filter(d => d.frequency >= 3)
        .append('text')
        .attr('x', d => xScale(d.x))
        .attr('y', d => yScale(d.y))
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('font-size', '10px')
        .style('fill', 'var(--text-primary)')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => d.word.length > 6 ? d.word.substring(0, 6) + '...' : d.word);
    
    // Store tooltip reference for cleanup
    chartContainer._tooltip = tooltip;
}
*/ // END OF ORPHANED CODE

// 単語の意味的位置を計算
function calculateSemanticPositions(words) {
    // 単語の頻度を計算
    const wordFrequency = {};
    const wordLastDate = {};
    
    words.forEach(word => {
        wordFrequency[word.word] = (wordFrequency[word.word] || 0) + 1;
        wordLastDate[word.word] = word.date;
    });
    
    // ユニークな単語とその属性を取得
    const uniqueWords = {};
    words.forEach(word => {
        if (!uniqueWords[word.word]) {
            uniqueWords[word.word] = {
                word: word.word,
                category: word.category,
                frequency: wordFrequency[word.word],
                lastDate: wordLastDate[word.word]
            };
        }
    });
    
    // word-embeddings.jsの高度な配置を使用
    if (window.calculateWordPositions) {
        try {
            const uniqueWordsArray = Object.values(uniqueWords);
            return window.calculateWordPositions(uniqueWordsArray);
        } catch (error) {
            console.log('埋め込みベースの配置にフォールバック');
        }
    }
    
    // フォールバック：既存の意味的位置計算（夢分析に特化）
    const processedWords = Object.values(uniqueWords).map(wordData => {
        // カテゴリーと単語の意味に基づいて2D座標を割り当て
        let x = 0, y = 0;
        
        // X軸：意識的内容 ←→ 無意識的内容
        // 意識的（右側）：日常的、具体的、現実的な要素
        const consciousWords = {
            '仕事': 0.8, '学校': 0.7, '家': 0.6, '友達': 0.6, '電話': 0.7,
            '車': 0.5, '食事': 0.6, '会社': 0.8, '勉強': 0.7, 'お金': 0.8
        };
        
        // 無意識的（左側）：象徴的、抽象的、非現実的な要素
        const unconsciousWords = {
            '飛ぶ': -0.8, '落ちる': -0.7, '追われる': -0.8, '変身': -0.9,
            '死': -0.9, '光': -0.6, '闇': -0.7, '迷う': -0.6, '消える': -0.7,
            '生まれる': -0.8, '溶ける': -0.8, '浮かぶ': -0.7
        };
        
        // Y軸：個人的体験 ←→ 普遍的・元型的体験
        // 個人的（上側）：個人の経験、記憶、具体的な人物
        const personalWords = {
            '母': -0.8, '父': -0.8, '兄弟': -0.7, '恋人': -0.8, '上司': -0.6,
            '同僚': -0.6, 'ペット': -0.7, '自分': -0.9, '名前': -0.8
        };
        
        // 普遍的（下側）：元型的シンボル、集合的無意識
        const archetypeWords = {
            '太陽': 0.8, '月': 0.8, '海': 0.7, '山': 0.6, '火': 0.7,
            '水': 0.7, '風': 0.6, '大地': 0.7, '宇宙': 0.9, '神': 0.9,
            '悪魔': 0.8, '天使': 0.8, '竜': 0.8, '蛇': 0.7
        };
        
        // 単語による位置の決定
        if (consciousWords[wordData.word]) {
            x = consciousWords[wordData.word] + (Math.random() - 0.5) * 0.1;
        } else if (unconsciousWords[wordData.word]) {
            x = unconsciousWords[wordData.word] + (Math.random() - 0.5) * 0.1;
        }
        
        if (personalWords[wordData.word]) {
            y = personalWords[wordData.word] + (Math.random() - 0.5) * 0.1;
        } else if (archetypeWords[wordData.word]) {
            y = archetypeWords[wordData.word] + (Math.random() - 0.5) * 0.1;
        }
        
        // カテゴリーによる調整
        switch(wordData.category) {
            case 'emotion':
                // 感情は個人的体験寄り
                if (y === 0) y = -0.3 + (Math.random() - 0.5) * 0.4;
                if (x === 0) x = (Math.random() - 0.5) * 0.6;
                break;
            case 'theme':
                // テーマは中央寄り
                if (x === 0) x = (Math.random() - 0.5) * 0.5;
                if (y === 0) y = (Math.random() - 0.5) * 0.5;
                break;
            case 'symbol':
                // シンボルは無意識・普遍的寄り
                if (x === 0) x = -0.3 + (Math.random() - 0.5) * 0.4;
                if (y === 0) y = 0.3 + (Math.random() - 0.5) * 0.4;
                break;
            default:
                // その他はランダム配置
                if (x === 0) x = (Math.random() - 0.5) * 0.8;
                if (y === 0) y = (Math.random() - 0.5) * 0.8;
        }
        
        // 重なり防止の微調整
        x += (Math.random() - 0.5) * 0.05;
        y += (Math.random() - 0.5) * 0.05;
        
        return {
            ...wordData,
            x: Math.max(-0.95, Math.min(0.95, x)),
            y: Math.max(-0.95, Math.min(0.95, y))
        };
    });
    
    return processedWords;
}

// タイムライン操作の削除（不要）
function navigateTimeline(days) {
    // この関数は使用しないが、互換性のため残す
}

function formatShortDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getCategoryLabel(category) {
    const labels = {
        'emotion': '感情',
        'theme': 'テーマ',
        'symbol': 'シンボル',
        'general': '一般'
    };
    return labels[category] || category;
}


// 編集モーダル用の表示更新
function updateEditVectorDisplay(index, value) {
    const floatValue = value / 100;
    document.getElementById(`edit-vector-value-${index}`).textContent = floatValue.toFixed(2);
}

// 編集した単語の保存
function saveEditedWord(index, originalWord) {
    if (!app.currentAnalysis || !app.currentAnalysis.extractedWords) return;
    
    const newWord = document.getElementById('word-name-input').value.trim();
    if (!newWord) {
        showToast('単語名を入力してください', 'error');
        return;
    }
    
    // ベクトルを取得
    const vector = [];
    for (let i = 0; i < 10; i++) {
        vector.push(document.getElementById(`edit-vector-${i}`).value / 100);
    }
    
    // 単語データを更新
    app.currentAnalysis.extractedWords[index].word = newWord;
    
    // カスタムベクトルとして保存
    if (!app.customVectors) {
        app.customVectors = {};
    }
    app.customVectors[newWord] = vector;
    
    // 元の単語と異なる場合、元の単語のベクトルを削除
    if (newWord !== originalWord && app.customVectors[originalWord]) {
        delete app.customVectors[originalWord];
    }
    
    // ストレージに保存
    saveCustomVectors();
    
    // UIを更新
    renderExtractedWords(app.currentAnalysis.extractedWords);
    
    showToast(`「${newWord}」を保存しました`, 'success');
    closeWordVectorEditModal();
}

// 編集モーダルを閉じる
function closeWordVectorEditModal() {
    const modal = document.getElementById('word-vector-edit-modal');
    if (modal) {
        modal.remove();
    }
}

// グローバル関数として追加
window.addCustomWord = addCustomWord;
window.editExtractedWord = editExtractedWord;
window.removeExtractedWord = removeExtractedWord;
window.showWordDetails = showWordDetails;
window.updateVectorDisplay = updateVectorDisplay;
window.saveWordVector = saveWordVector;
window.resetWordVector = resetWordVector;
window.closeWordVectorModal = closeWordVectorModal;
window.updateEditVectorDisplay = updateEditVectorDisplay;
window.saveEditedWord = saveEditedWord;
window.closeWordVectorEditModal = closeWordVectorEditModal;

class OnboardingFlow {
    constructor() {
        this.steps = [
            {
                title: "DreamScopeへようこそ 🌙",
                content: "夢を記録し、AIが深層心理を読み解きます",
                action: null,
                position: 'center'
            },
            {
                title: "簡単な記録方法",
                content: "単語だけでもOK。AIが文章に整えます",
                action: () => this.highlightElement('.keywords-input-field'),
                position: 'bottom'
            },
            {
                title: "AIによる解析",
                content: "心理学的な視点から夢の意味を解釈します",
                action: () => this.showSampleAnalysis(),
                position: 'center'
            },
            {
                title: "プライバシー保護",
                content: "あなたの夢は安全に保護されます",
                action: null,
                position: 'center'
            }
        ];
        this.currentStep = 0;
    }
    
    start() {
        this.createOverlay();
        this.showStep(0);
    }
    
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.innerHTML = `
            <div class="onboarding-content">
                <button class="onboarding-skip">スキップ</button>
                <div class="onboarding-step">
                    <h2 class="onboarding-title"></h2>
                    <p class="onboarding-text"></p>
                    <div class="onboarding-sample hidden"></div>
                    <div class="onboarding-actions">
                        <button class="onboarding-prev hidden">戻る</button>
                        <button class="onboarding-next">次へ</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Event listeners
        this.overlay.querySelector('.onboarding-skip').addEventListener('click', () => this.complete());
        this.overlay.querySelector('.onboarding-next').addEventListener('click', () => this.nextStep());
        this.overlay.querySelector('.onboarding-prev').addEventListener('click', () => this.prevStep());
    }
    
    showStep(index) {
        const step = this.steps[index];
        const content = this.overlay.querySelector('.onboarding-content');
        
        // Update content
        this.overlay.querySelector('.onboarding-title').textContent = step.title;
        this.overlay.querySelector('.onboarding-text').textContent = step.content;
        
        // Update buttons
        this.overlay.querySelector('.onboarding-prev').classList.toggle('hidden', index === 0);
        this.overlay.querySelector('.onboarding-next').textContent = 
            index === this.steps.length - 1 ? '始める' : '次へ';
        
        // Execute action
        if (step.action) {
            step.action();
        }
        
        // Update position
        content.className = `onboarding-content position-${step.position}`;
        
        // Animate
        content.style.animation = 'onboardingFadeIn 0.3s ease-out';
    }
    
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.complete();
        }
    }
    
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlighted');
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 2000);
        }
    }
    
    showSampleAnalysis() {
        const sample = this.overlay.querySelector('.onboarding-sample');
        sample.innerHTML = `
            <div class="sample-analysis">
                <h3>サンプル解析結果</h3>
                <p class="sample-dream">「崖から海に落ちる夢」</p>
                <div class="sample-symbols">
                    <span class="symbol-tag">崖: 人生の転機</span>
                    <span class="symbol-tag">海: 無意識の深層</span>
                    <span class="symbol-tag">落下: コントロールの喪失</span>
                </div>
                <p class="sample-insight">新しい挑戦への不安と期待が入り混じっています</p>
            </div>
        `;
        sample.classList.remove('hidden');
    }
    
    complete() {
        localStorage.setItem('dreamscope_onboarded', 'true');
        this.overlay.style.animation = 'onboardingFadeOut 0.3s ease-out';
        setTimeout(() => {
            this.overlay.remove();
        }, 300);
        
        // Show welcome toast
        showToast('DreamScopeへようこそ！最初の夢を記録してみましょう', 'success');
    }
}