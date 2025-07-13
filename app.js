// DreamScope App - Main JavaScript File
console.log('app.js loaded');

// App State
const app = {
    currentView: 'input',
    dreams: [],
    words: [],  // 抽出された単語を保存するための配列
    serverEndpoint: '/api/analyze-dream',  // サーバーエンドポイント
    settings: {
        reminderEnabled: false,
        theme: '' // デフォルトテーマ（空文字列）
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
    applyTheme(); // テーマを適用
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
            // テーマ設定を復元
            if (document.getElementById('theme-selector')) {
                document.getElementById('theme-selector').value = app.settings.theme || '';
            }
        }
        
        // API key loading removed - using server endpoint
    } catch (error) {
        console.error('データの読み込みエラー:', error);
        showToast('データの読み込みに失敗しました。データをリセットします。', 'error');
        
        // Reset corrupted data
        app.dreams = [];
        app.settings = { reminderEnabled: false, theme: '' };
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
    
    
    // Record button
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) recordBtn.addEventListener('click', recordDream);
    
    // Result actions
    const saveDreamBtn = document.getElementById('save-dream-btn');
    if (saveDreamBtn) saveDreamBtn.addEventListener('click', saveDream);
    
    const shareDreamBtn = document.getElementById('share-dream-btn');
    if (shareDreamBtn) shareDreamBtn.addEventListener('click', () => {
        showToast('共有機能は現在開発中です', 'info');
    });
    
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
    
    // テーマセレクターのイベントリスナー
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            app.settings.theme = e.target.value;
            applyTheme();
            saveDataToStorage();
            showToast('テーマを変更しました', 'success');
        });
    }
    
    document.getElementById('backup-data').addEventListener('click', backupData);
    document.getElementById('restore-data').addEventListener('click', restoreData);
    document.getElementById('clear-data').addEventListener('click', clearData);
    
    // Symbol edit view buttons
    const analyzeSymbolsBtn = document.getElementById('analyze-symbols-btn');
    if (analyzeSymbolsBtn) analyzeSymbolsBtn.addEventListener('click', analyzeEditedSymbols);
    
    const backToInputBtn = document.getElementById('back-to-input-btn');
    if (backToInputBtn) backToInputBtn.addEventListener('click', () => {
        updateView('input');
        // Don't reset input to preserve the content
    });
    
    const addSymbolBtn = document.getElementById('add-symbol-btn');
    if (addSymbolBtn) addSymbolBtn.addEventListener('click', () => {
        const input = document.getElementById('new-symbol-input');
        const categorySelect = document.getElementById('new-symbol-category');
        const symbol = input.value.trim();
        if (symbol) {
            const category = categorySelect.value || '未分類';
            addSymbolTag({ text: symbol, category: category, importance: 'medium' });
            input.value = '';
            categorySelect.selectedIndex = 0;
        }
    });
    
    const newSymbolInput = document.getElementById('new-symbol-input');
    if (newSymbolInput) newSymbolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const symbol = e.target.value.trim();
            if (symbol) {
                const categorySelect = document.getElementById('new-symbol-category');
                const category = categorySelect.value || '未分類';
                addSymbolTag({ text: symbol, category: category, importance: 'medium' });
                e.target.value = '';
                categorySelect.selectedIndex = 0;
            }
        }
    });
    
}

// View Management
function updateView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Only update nav button if it exists (symbol-edit doesn't have a nav button)
    const navButton = document.querySelector(`[data-view="${viewName}"]`);
    if (navButton) {
        navButton.classList.add('active');
    }
    
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
        
        // 分析画面表示時のAPI呼び出しを削除（登録時のみ呼ぶため）
    }
    
    app.currentView = viewName;
}


// Dream Recording
let isAnalyzing = false; // 解析中フラグを追加

async function recordDream() {
    // 既に解析中の場合は処理を中断
    if (isAnalyzing) {
        showToast('現在解析中です。しばらくお待ちください。', 'warning');
        return;
    }
    
    let dreamContent = '';
    
    // Clear previous errors
    clearError();
    
    dreamContent = document.getElementById('freetext-field').value.trim();
    if (!dreamContent) {
        showError('夢の内容を入力してください', 'freetext-field');
        return;
    }
    
    // Set analyzing flag and show loading
    isAnalyzing = true;
    showLoading();
    
    try {
        // Step 1: Extract symbols only
        const symbols = await extractSymbols(dreamContent);
        
        // Store the dream content and symbols temporarily
        app.tempDreamData = {
            dreamContent: dreamContent,
            symbols: symbols
        };
        
        // Show symbol edit view
        updateView('symbol-edit');
        displaySymbolsForEdit(symbols);
        document.getElementById('symbol-edit-dream-text').textContent = dreamContent;
        
        hideLoading();
    } catch (error) {
        console.error('recordDream error:', error);
        hideLoading();
        showError('分析中にエラーが発生しました。もう一度お試しください。');
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

// Extract symbols from dream
async function extractSymbols(dreamContent) {
    console.log('=== extractSymbols called ===');
    console.log('Dream content:', dreamContent);
    console.log('API endpoint:', '/api/extract-symbols');
    
    try {
        const requestBody = {
            dreamContent: dreamContent
        };
        console.log('Request body:', JSON.stringify(requestBody));
        
        // Check if running on Node.js server or Python server
        const isNodeServer = window.location.port === '3000' || window.location.port === '';
        const apiUrl = isNodeServer ? '/api/extract-symbols' : 'http://localhost:3000/api/extract-symbols';
        
        console.log('Fetching from:', apiUrl);
        console.log('Current origin:', window.location.origin);
        console.log('Current port:', window.location.port);
        console.log('Is Node server:', isNodeServer);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Server error response:', errorData);
            throw new Error(`Failed to extract symbols: ${response.status} ${errorData}`);
        }
        
        const result = await response.json();
        console.log('API response:', result);
        console.log('Extracted symbols:', result.symbols);
        
        return result.symbols || [];
    } catch (error) {
        console.error('Symbol extraction error details:', {
            message: error.message,
            stack: error.stack,
            error: error
        });
        throw error;
    }
}

// Analyze dream with edited symbols
async function analyzeWithSymbols(dreamContent, symbols) {
    console.log('=== analyzeWithSymbols called ===');
    console.log('Dream content:', dreamContent);
    console.log('Symbols:', symbols);
    
    try {
        // Check if running on Node.js server or Python server
        const isNodeServer = window.location.port === '3000' || window.location.port === '';
        const apiUrl = isNodeServer ? '/api/analyze-symbols' : 'http://localhost:3000/api/analyze-symbols';
        console.log('Analyzing with symbols at:', apiUrl);
        
        const requestBody = {
            dreamContent: dreamContent,
            symbols: symbols.map(s => typeof s === 'string' ? s : s.text)
        };
        console.log('Request body:', JSON.stringify(requestBody));
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to analyze symbols: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Analysis result:', result);
        return result;
    } catch (error) {
        console.error('Symbol analysis error details:', {
            message: error.message,
            stack: error.stack,
            error: error
        });
        throw error;
    }
}

// AI Analysis
async function analyzeDream(content) {
    const systemPrompt = 'あなたは夢の意味を読み解く専門家です。難しい専門用語は使わず、誰にでもわかるやさしい日本語で説明してください。';
    
    const prompt = `以下の夢の内容をやさしく解釈してください。
        
        夢の内容: ${content}
        
        以下の形式でJSONで回答してください:
        {
            "dreamText": "${content}",
            "symbols": [
                {"symbol": "夢に出てきたもの", "meaning": "それが表す意味をやさしく説明"}
            ],
            "psychologicalMessage": "あなたの心が伝えたいメッセージ",
            "dailyInsight": "今日の気づき（1文）"
        }`;
    
    try {
        // Check if running on Node.js server or Python server
        const isNodeServer = window.location.port === '3000' || window.location.port === '';
        const apiUrl = isNodeServer ? app.serverEndpoint : 'http://localhost:3000' + app.serverEndpoint;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dreamContent: content,
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
        return generateMockAnalysis(content);
    }
}

// Mock Analysis for Demo
function generateMockAnalysis(content) {
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
    
    // Extract words from symbols if not already present
    if (!result.extractedWords && result.symbols) {
        result.extractedWords = extractWordsFromDream(result.dreamText, result);
    }
    
    // Update Hero Card - 総合的な解釈を最初に表示
    const heroTheme = document.getElementById('hero-theme');
    const heroInsight = document.getElementById('hero-insight');
    if (result.overallComment) {
        // 総合的な解釈を冒頭に表示
        heroTheme.textContent = result.dreamTheme || '夢の分析';
        heroInsight.textContent = result.overallComment;
    } else {
        heroTheme.textContent = '夢の分析完了';
        heroInsight.textContent = '以下の分析結果をご確認ください。';
    }
    
    // Update dream content
    document.getElementById('converted-dream-text').textContent = result.dreamText;
    
    // Update symbols with progressive disclosure
    const symbolsContainer = document.getElementById('symbol-meanings');
    const symbolsCount = document.getElementById('symbols-count');
    symbolsCount.textContent = `${result.symbols.length}個`;
    
    symbolsContainer.innerHTML = result.symbols.map((symbol, index) => {
        // Determine category based on symbol type (can be enhanced with AI categorization)
        let category = 'object'; // default
        if (symbol.category) {
            category = symbol.category;
        }
        
        return `
        <div class="symbol-item" data-category="${category}" data-expanded="false" onclick="toggleSymbol(this)">
            <strong>${symbol.symbol}</strong>
            <div class="symbol-summary">${symbol.meaning}</div>
            <div class="symbol-details">
                ${symbol.comment ? `<div class="symbol-comment">💭 ${symbol.comment}</div>` : ''}
                ${symbol.interpretation ? `<div class="symbol-interpretation">🔍 ${symbol.interpretation}</div>` : ''}
            </div>
        </div>
        `;
    }).join('');
    
    // Update emotion/theme analysis
    if (result.dreamTheme) {
        document.getElementById('dream-theme').innerHTML = `
            <div class="emotion-tag">${result.dreamTheme}</div>
        `;
    }
    
    // Extract emotions/feelings from the analysis (simple implementation)
    const emotionIndicators = document.getElementById('emotion-indicators');
    if (result.emotions || result.overallComment) {
        const emotions = extractEmotions(result.overallComment || '');
        emotionIndicators.innerHTML = emotions.map(emotion => 
            `<div class="emotion-tag">${emotion}</div>`
        ).join('');
    }
    
    // Overall comment is displayed in the hero card, so no need for separate element
    
    document.getElementById('analysis-result').classList.remove('hidden');
}

// Toggle symbol expansion
function toggleSymbol(element) {
    const isExpanded = element.getAttribute('data-expanded') === 'true';
    element.setAttribute('data-expanded', !isExpanded);
}

// Toggle card expansion
function toggleCard(button) {
    const card = button.closest('.analysis-card');
    const content = card.querySelector('.card-content');
    const icon = button.querySelector('.expand-icon');
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    }
}

// Extract emotions from text (simple implementation)
function extractEmotions(text) {
    const emotionKeywords = {
        '不安': ['不安', '心配', '恐れ', '怖'],
        '希望': ['希望', '期待', '楽しみ', '前向き'],
        '喜び': ['喜び', '嬉しい', '幸せ', '満足'],
        '悲しみ': ['悲しい', '寂しい', '孤独', '失望'],
        '怒り': ['怒り', 'イライラ', '不満', '憤り'],
        '平和': ['平和', '穏やか', '安心', '落ち着']
    };
    
    const detectedEmotions = [];
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            detectedEmotions.push(emotion);
        }
    }
    
    return detectedEmotions.length > 0 ? detectedEmotions : ['深層心理'];
}

// Ask follow-up question (placeholder)
function askFollowUp() {
    showToast('追加の質問機能は開発中です', 'info');
}

// Display symbols for editing
function displaySymbolsForEdit(symbols) {
    const container = document.getElementById('symbol-tags-container');
    container.innerHTML = '';
    
    symbols.forEach(symbol => {
        // Handle both old format (string) and new format (object)
        if (typeof symbol === 'string') {
            addSymbolTag({ text: symbol, category: '未分類', importance: 'medium' });
        } else {
            addSymbolTag(symbol);
        }
    });
}

// Add a symbol tag to the container
function addSymbolTag(symbolData) {
    const container = document.getElementById('symbol-tags-container');
    const tag = document.createElement('div');
    
    // Handle both string and object formats
    const text = typeof symbolData === 'string' ? symbolData : symbolData.text;
    const category = typeof symbolData === 'string' ? '未分類' : symbolData.category;
    const importance = typeof symbolData === 'string' ? 'medium' : symbolData.importance;
    
    tag.className = `symbol-tag importance-${importance}`;
    tag.dataset.category = category;
    tag.dataset.importance = importance;
    
    const categoryColors = {
        '人物': '#FF6B6B',
        '場所': '#4ECDC4', 
        '物体': '#45B7D1',
        '動物': '#96CEB4',
        '行動': '#FECA57',
        '感情': '#DDA0DD',
        '色彩': '#FFA07A',
        '数字': '#B19CD9',
        '未分類': '#999999'
    };
    
    const categoryColor = categoryColors[category] || categoryColors['未分類'];
    
    tag.innerHTML = `
        <span class="symbol-category-badge" style="background-color: ${categoryColor}">${category}</span>
        <span class="symbol-tag-text">${text}</span>
        <span class="symbol-tag-remove" onclick="removeSymbolTag(this)">×</span>
    `;
    container.appendChild(tag);
}

// Remove a symbol tag
function removeSymbolTag(element) {
    const tag = element.closest('.symbol-tag');
    tag.remove();
}

// Get all symbols from the edit view
function getEditedSymbols() {
    const tags = document.querySelectorAll('.symbol-tag');
    return Array.from(tags).map(tag => {
        const text = tag.querySelector('.symbol-tag-text').textContent;
        const category = tag.dataset.category || '未分類';
        const importance = tag.dataset.importance || 'medium';
        return { text, category, importance };
    });
}

// Handle symbol analysis after editing
async function analyzeEditedSymbols() {
    console.log('=== analyzeEditedSymbols called ===');
    
    if (isAnalyzing) {
        showToast('現在解析中です。しばらくお待ちください。', 'warning');
        return;
    }
    
    const symbols = getEditedSymbols();
    console.log('Edited symbols:', symbols);
    
    if (symbols.length === 0) {
        showSymbolError('少なくとも1つの象徴が必要です');
        return;
    }
    
    // Check if tempDreamData exists
    if (!app.tempDreamData || !app.tempDreamData.dreamContent) {
        console.error('app.tempDreamData is missing or invalid:', app.tempDreamData);
        showSymbolError('夢の内容が見つかりません。もう一度最初からやり直してください。');
        return;
    }
    
    console.log('Dream content:', app.tempDreamData.dreamContent);
    
    isAnalyzing = true;
    showLoading();
    
    try {
        const result = await analyzeWithSymbols(app.tempDreamData.dreamContent, symbols);
        console.log('Analysis result:', result);
        
        // Display the final analysis result
        displayAnalysisResult(result);
        updateView('input');
        hideLoading();
    } catch (error) {
        console.error('Error in analyzeEditedSymbols:', error);
        hideLoading();
        showSymbolError('分析中にエラーが発生しました。もう一度お試しください。');
    } finally {
        isAnalyzing = false;
    }
}

// Show error in symbol edit view
function showSymbolError(message) {
    const errorElement = document.getElementById('symbol-error-message');
    errorElement.textContent = message;
    setTimeout(() => {
        errorElement.textContent = '';
    }, 5000);
}

// Save Dream
function saveDream() {
    if (!app.currentAnalysis) return;
    
    const dream = {
        id: Date.now(),
        date: new Date().toISOString(),
        content: app.currentAnalysis.originalInput || app.currentAnalysis.dreamText,
        analysis: app.currentAnalysis,
        tags: extractTags(app.currentAnalysis)
    };
    
    app.dreams.push(dream);
    
    // 確定した単語を保存
    if (app.currentAnalysis.extractedWords) {
        saveExtractedWords(dream.id, app.currentAnalysis.extractedWords);
        
        // 夢保存後のAPI呼び出しを削除（登録時のみ呼ぶため）
    }
    
    // 象徴の頻度を追跡
    if (app.currentAnalysis.symbols) {
        trackSymbolFrequency(dream.id, app.currentAnalysis.symbols);
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

// Track symbol frequency
function trackSymbolFrequency(dreamId, symbols) {
    const symbolStats = JSON.parse(localStorage.getItem('dreamscope_symbol_stats') || '{}');
    
    symbols.forEach(symbolData => {
        const symbol = symbolData.symbol.toLowerCase();
        
        if (!symbolStats[symbol]) {
            symbolStats[symbol] = {
                text: symbolData.symbol,
                count: 0,
                firstSeen: new Date().toISOString(),
                lastSeen: null,
                dreams: [],
                meanings: []
            };
        }
        
        symbolStats[symbol].count++;
        symbolStats[symbol].lastSeen = new Date().toISOString();
        
        // Add dream ID to the list (keep only last 20)
        if (!symbolStats[symbol].dreams.includes(dreamId)) {
            symbolStats[symbol].dreams.push(dreamId);
            if (symbolStats[symbol].dreams.length > 20) {
                symbolStats[symbol].dreams.shift();
            }
        }
        
        // Store the meaning if it's new
        if (symbolData.meaning && !symbolStats[symbol].meanings.includes(symbolData.meaning)) {
            symbolStats[symbol].meanings.push(symbolData.meaning);
            if (symbolStats[symbol].meanings.length > 5) {
                symbolStats[symbol].meanings.shift();
            }
        }
    });
    
    localStorage.setItem('dreamscope_symbol_stats', JSON.stringify(symbolStats));
    return symbolStats;
}

// Reset Input
function resetInput() {
    document.getElementById('freetext-field').value = '';
    // renderKeywordTags(); // この関数は削除されたのでコメントアウト
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


// Statistics
function updateStatistics() {
    document.getElementById('total-dreams').textContent = app.dreams.length;
    
    // Display frequent symbols
    displayFrequentSymbols();
}

// Display frequent symbols
function displayFrequentSymbols() {
    const container = document.getElementById('frequent-symbols');
    if (!container) return;
    
    const symbolStats = JSON.parse(localStorage.getItem('dreamscope_symbol_stats') || '{}');
    
    // Sort symbols by count
    const sortedSymbols = Object.entries(symbolStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);
    
    container.innerHTML = '';
    
    if (sortedSymbols.length === 0) {
        container.innerHTML = '<p class="help-text">まだ象徴が記録されていません</p>';
        return;
    }
    
    sortedSymbols.forEach(([key, data]) => {
        const item = document.createElement('div');
        item.className = 'symbol-stat-item';
        item.innerHTML = `
            <span class="symbol-text">${data.text}</span>
            <span class="symbol-count-badge">${data.count}回</span>
        `;
        item.onclick = () => showSymbolDetail(key);
        container.appendChild(item);
    });
}

// Show symbol detail
function showSymbolDetail(symbolKey) {
    const symbolStats = JSON.parse(localStorage.getItem('dreamscope_symbol_stats') || '{}');
    const symbolData = symbolStats[symbolKey];
    
    if (!symbolData) return;
    
    
    const meanings = symbolData.meanings.join('\n\n');
    
    const message = `
象徴: ${symbolData.text}
出現回数: ${symbolData.count}回
初回出現: ${new Date(symbolData.firstSeen).toLocaleDateString('ja-JP')}
最終出現: ${new Date(symbolData.lastSeen).toLocaleDateString('ja-JP')}

AIによる意味:
${meanings || 'まだ分析されていません'}
    `;
    
    alert(message);
}









// Settings Functions


// Export functions
function exportAsCSV() {
    if (app.dreams.length === 0) {
        showToast('エクスポートする夢がありません', 'warning');
        return;
    }
    
    const headers = ['日付', '夢の内容', '象徴', '心理的メッセージ', '洞察'];
    const rows = app.dreams.map(dream => {
        const symbols = dream.aiAnalysis?.symbols?.map(s => `${s.symbol}: ${s.meaning}`).join('; ') || '';
        const psychMessage = dream.aiAnalysis?.psychologicalMessage || '';
        const insight = dream.aiAnalysis?.dailyInsight || '';
        
        return [
            new Date(dream.date).toLocaleString('ja-JP'),
            dream.content.replace(/"/g, '""'), // Escape quotes
            symbols.replace(/"/g, '""'),
            psychMessage.replace(/"/g, '""'),
            insight.replace(/"/g, '""')
        ].map(cell => `"${cell}"`).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dreamscope_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('CSVファイルをダウンロードしました');
}

function exportAsJSON() {
    if (app.dreams.length === 0) {
        showToast('エクスポートする夢がありません', 'warning');
        return;
    }
    
    const data = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        dreams: app.dreams,
        settings: app.settings
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dreamscope_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('JSONファイルをダウンロードしました');
}

function backupData() {
    const backup = {
        timestamp: new Date().toISOString(),
        dreams: app.dreams,
        settings: app.settings
    };
    
    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dreamscope_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showToast('バックアップファイルを作成しました');
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
            const data = JSON.parse(text);
            
            // Validate backup structure
            if (!data.dreams || !Array.isArray(data.dreams)) {
                throw new Error('無効なバックアップファイルです');
            }
            
            if (confirm('現在のデータを置き換えますか？この操作は取り消せません。')) {
                app.dreams = data.dreams;
                if (data.settings) {
                    app.settings = data.settings;
                    if (document.getElementById('reminder-enabled')) {
                        document.getElementById('reminder-enabled').checked = app.settings.reminderEnabled;
                    }
                }
                
                saveDataToStorage();
                updateStatistics();
                renderCalendar();
                renderDreamList();
                
                showToast('データを復元しました');
            }
        } catch (error) {
            console.error('Restore error:', error);
            showToast('データの復元に失敗しました', 'error');
        }
    };
    
    input.click();
}

function clearData() {
    if (confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。')) {
        localStorage.clear();
        app.dreams = [];
        
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

// Theme management
function applyTheme() {
    const theme = app.settings.theme || '';
    document.body.className = theme;
    
    // テーマが設定されている場合、ローカルストレージに保存
    if (theme) {
        localStorage.setItem('dreamscope_theme', theme);
    } else {
        localStorage.removeItem('dreamscope_theme');
    }
}

// Make functions globally accessible
window.showDreamDetail = showDreamDetail;
window.closeDreamModal = closeDreamModal;
window.removeSymbolTag = removeSymbolTag;

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
            
            // Function to update character count
            const updateCharCount = () => {
                const length = input.value.length;
                counter.textContent = `${length}文字`;
                counter.classList.toggle('warning', length > 500);
            };
            
            // Initial character count display
            updateCharCount();
            
            // Update on input
            input.addEventListener('input', updateCharCount);
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