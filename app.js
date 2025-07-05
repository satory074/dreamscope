// DreamScope App - Main JavaScript File

// App State
const app = {
    currentView: 'input',
    dreams: [],
    apiKey: '',
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
        const savedApiKey = localStorage.getItem('dreamscope_apikey');
        
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
        
        if (savedApiKey) {
            app.apiKey = savedApiKey;
            if (document.getElementById('api-key')) {
                document.getElementById('api-key').value = app.apiKey;
            }
        }
    } catch (error) {
        console.error('データの読み込みエラー:', error);
        showToast('データの読み込みに失敗しました。データをリセットします。', 'error');
        
        // Reset corrupted data
        app.dreams = [];
        app.settings = { reminderEnabled: false };
        app.apiKey = '';
        
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
        if (app.apiKey) {
            localStorage.setItem('dreamscope_apikey', app.apiKey);
        }
        
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
            const type = e.target.dataset.type;
            updateInputType(type);
        });
    });
    
    // Keywords input handling
    const keywordsField = document.getElementById('keywords-field');
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
    
    // Record button
    document.getElementById('record-btn').addEventListener('click', recordDream);
    
    // Result actions
    document.getElementById('save-dream-btn').addEventListener('click', saveDream);
    document.getElementById('share-dream-btn').addEventListener('click', showShareModal);
    document.getElementById('new-dream-btn').addEventListener('click', resetInput);
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => navigateCalendar(-1));
    document.getElementById('next-month').addEventListener('click', () => navigateCalendar(1));
    
    // Export buttons
    document.getElementById('export-csv').addEventListener('click', exportAsCSV);
    document.getElementById('export-json').addEventListener('click', exportAsJSON);
    
    // Settings
    document.getElementById('api-key').addEventListener('change', (e) => {
        app.apiKey = e.target.value;
        saveDataToStorage();
    });
    
    document.getElementById('reminder-enabled').addEventListener('change', (e) => {
        app.settings.reminderEnabled = e.target.checked;
        saveDataToStorage();
    });
    
    document.getElementById('backup-data').addEventListener('click', backupData);
    document.getElementById('restore-data').addEventListener('click', restoreData);
    document.getElementById('clear-data').addEventListener('click', clearData);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', hideShareModal);
    document.getElementById('download-image').addEventListener('click', downloadShareImage);
    document.getElementById('copy-image').addEventListener('click', copyShareImage);
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
        renderTagCloud();
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
async function recordDream() {
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
    
    // Show loading
    showLoading();
    
    try {
        // Process dream with AI
        const result = await analyzeDream(dreamContent, isKeywordsMode);
        displayAnalysisResult(result);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('夢の解析中にエラーが発生しました。もう一度お試しください。');
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
    if (!app.apiKey) {
        // Fallback for demo without API key
        return generateMockAnalysis(content, isKeywords);
    }
    
    const prompt = isKeywords ? 
        `以下のキーワードから夢の内容を自然な文章に変換し、心理学的な解釈を提供してください。
        
        キーワード: ${content}
        
        以下の形式でJSONで回答してください:
        {
            "dreamText": "変換された夢の文章",
            "symbols": [
                {"symbol": "シンボル名", "meaning": "意味の説明"}
            ],
            "psychologicalMessage": "深層心理からのメッセージ",
            "dailyInsight": "今日の気づき（1文）"
        }` :
        `以下の夢の内容を心理学的に解釈してください。
        
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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [{
                    role: 'system',
                    content: 'あなたは夢の解釈の専門家です。ユング心理学と認知心理学の観点から夢を分析します。'
                }, {
                    role: 'user',
                    content: prompt
                }],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('API Error:', error);
        return generateMockAnalysis(content, isKeywords);
    }
}

// Mock Analysis for Demo
function generateMockAnalysis(content, isKeywords) {
    const words = content.split(/\s+/);
    
    const dreamText = isKeywords ? 
        `私は夢の中で${words.join('、')}という要素が印象的な体験をしました。` :
        content;
    
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
    
    document.getElementById('psychological-message').textContent = result.psychologicalMessage;
    document.getElementById('daily-insight').textContent = result.dailyInsight;
    
    document.getElementById('analysis-result').classList.remove('hidden');
}

// Save Dream
function saveDream() {
    if (!app.currentAnalysis) return;
    
    const dream = {
        id: Date.now(),
        date: new Date().toISOString(),
        content: app.currentAnalysis.dreamText,
        keywords: keywords.slice(),
        analysis: app.currentAnalysis,
        tags: extractTags(app.currentAnalysis)
    };
    
    app.dreams.push(dream);
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
        renderDreamList(dreams);
    }
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
    
    app.currentAnalysis = dream.analysis;
    displayAnalysisResult(dream.analysis);
    updateView('input');
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
    
    generateShareImage();
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

function generateShareImage() {
    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 1080;
    canvas.height = 1080;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#6B5B95');
    gradient.addColorStop(1, '#88B0D3');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);
    
    // Add semi-transparent overlay
    ctx.fillStyle = 'rgba(26, 26, 46, 0.7)';
    ctx.fillRect(0, 0, 1080, 1080);
    
    // Title
    ctx.fillStyle = '#FFB6C1';
    ctx.font = 'bold 80px Noto Sans JP';
    ctx.textAlign = 'center';
    ctx.fillText('🌙 DreamScope', 540, 150);
    
    // Date
    ctx.fillStyle = '#ffffff';
    ctx.font = '40px Noto Sans JP';
    ctx.fillText(formatDate(new Date().toISOString()), 540, 250);
    
    // Daily Insight
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Noto Sans JP';
    
    // Word wrap for insight
    const insight = app.currentAnalysis.dailyInsight;
    const words = insight.split('');
    let line = '';
    let y = 540;
    const lineHeight = 80;
    const maxWidth = 900;
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, 540, y);
            line = words[i];
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 540, y);
    
    // Footer
    ctx.fillStyle = '#b8b8d1';
    ctx.font = '30px Noto Sans JP';
    ctx.fillText('あなたの夢が教えてくれること', 540, 950);
}

function downloadShareImage() {
    const canvas = document.getElementById('share-canvas');
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dreamscope_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

async function copyShareImage() {
    const canvas = document.getElementById('share-canvas');
    canvas.toBlob(async blob => {
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('画像をクリップボードにコピーしました！');
        } catch (err) {
            alert('クリップボードへのコピーに失敗しました');
        }
    });
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
        app.apiKey = '';
        
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