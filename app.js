// DreamScope App - Main JavaScript File
console.log('app.js loaded');

// App State
const app = {
    currentView: 'input',
    dreams: [],
    serverEndpoint: '/api/analyze-dream',  // サーバーエンドポイント
    settings: {
        reminderEnabled: false
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromStorage();
    initializeEventListeners();
    updateView('input');
    updateStatistics();
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

// Simplified first-time user check
function checkFirstTimeUser() {
    if (!localStorage.getItem('dreamscope_onboarded')) {
        setTimeout(() => {
            showToast('DreamScopeへようこそ！夢を記録してAIで分析しましょう', 'info');
            localStorage.setItem('dreamscope_onboarded', 'true');
        }, 1000);
    }
}

// Removed complex onboarding flow

// Simplified word extraction - removed complex pattern matching
function extractWordsFromDream(content, analysis) {
    const extractedWords = [];
    
    // Basic symbol extraction from AI analysis only
    if (analysis.symbols) {
        analysis.symbols.forEach(symbol => {
            extractedWords.push({
                word: symbol.symbol,
                category: 'symbol'
            });
        });
    }
    
    // Simple keyword extraction from user input keywords
    if (keywords && keywords.length > 0) {
        keywords.forEach(keyword => {
            if (!extractedWords.some(w => w.word === keyword)) {
                extractedWords.push({
                    word: keyword,
                    category: 'general'
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

// Simplified word editing - removed vector modal
function editExtractedWord(index) {
    if (!app.currentAnalysis || !app.currentAnalysis.extractedWords) return;
    
    const wordData = app.currentAnalysis.extractedWords[index];
    const newWord = prompt('単語を編集:', wordData.word);
    
    if (newWord && newWord.trim()) {
        app.currentAnalysis.extractedWords[index].word = newWord.trim();
        renderExtractedWords(app.currentAnalysis.extractedWords);
        showToast('単語を更新しました', 'success');
    }
}

// Removed complex vector edit modal function

// 単語の削除
function removeExtractedWord(index) {
    if (!app.currentAnalysis || !app.currentAnalysis.extractedWords) return;
    
    app.currentAnalysis.extractedWords.splice(index, 1);
    renderExtractedWords(app.currentAnalysis.extractedWords);
}

// Simplified word saving - removed vector complexity
function saveExtractedWords(dreamId, extractedWords) {
    extractedWords.forEach((wordData, index) => {
        app.words.push({
            id: Date.now() + index,
            word: wordData.word,
            category: wordData.category,
            dreamId: dreamId,
            date: new Date().toISOString()
        });
    });
}

// Removed complex vector creation function

// Simplified word statistics - removed complex features
function updateWordStatistics() {
    // Basic word statistics only
    const totalWords = app.words.length;
    const uniqueWords = new Set(app.words.map(w => w.word)).size;
    const avgWords = app.dreams.length > 0 ? 
        Math.round(app.words.length / app.dreams.length * 10) / 10 : 0;
    
    // Update only if elements exist
    const totalElement = document.getElementById('total-words');
    const uniqueElement = document.getElementById('unique-words');
    const avgElement = document.getElementById('avg-words-per-dream');
    
    if (totalElement) totalElement.textContent = totalWords;
    if (uniqueElement) uniqueElement.textContent = uniqueWords;
    if (avgElement) avgElement.textContent = avgWords;
}

// Removed complex word cloud generation

// Removed complex word frequency analysis

// Simplified word details - removed complex vector modal
function showWordDetails(word) {
    const wordData = app.words.filter(w => w.word === word);
    const count = wordData.length;
    showToast(`「${word}」は${count}回出現しました`, 'info');
}

// Removed complex word vector modal

// Removed complex vector display update

// Removed complex similar words calculation

// Removed complex vector saving

// Removed custom vector storage

// Removed vector reset functionality

// Removed modal close function

// Removed complex AI vector generation function


// Simplified word analysis rendering
function renderWordAnalysis() {
    // Basic word statistics only
    updateWordStatistics();
}

// Removed complex D3.js visualization code
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

// Removed complex semantic analysis with consciousness mapping

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


// Removed complex edit vector display

// Removed complex word editing with vectors

// Removed complex edit modal close

// Simplified global function registrations
window.addCustomWord = addCustomWord;
window.editExtractedWord = editExtractedWord;
window.removeExtractedWord = removeExtractedWord;
window.showWordDetails = showWordDetails;

// Removed complex onboarding flow class