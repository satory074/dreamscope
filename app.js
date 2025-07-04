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
});

// Data Management
function loadDataFromStorage() {
    const savedDreams = localStorage.getItem('dreamscope_dreams');
    const savedSettings = localStorage.getItem('dreamscope_settings');
    const savedApiKey = localStorage.getItem('dreamscope_apikey');
    
    if (savedDreams) {
        app.dreams = JSON.parse(savedDreams);
    }
    
    if (savedSettings) {
        app.settings = JSON.parse(savedSettings);
        document.getElementById('reminder-enabled').checked = app.settings.reminderEnabled;
    }
    
    if (savedApiKey) {
        app.apiKey = savedApiKey;
        document.getElementById('api-key').value = app.apiKey;
    }
}

function saveDataToStorage() {
    localStorage.setItem('dreamscope_dreams', JSON.stringify(app.dreams));
    localStorage.setItem('dreamscope_settings', JSON.stringify(app.settings));
    if (app.apiKey) {
        localStorage.setItem('dreamscope_apikey', app.apiKey);
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
    
    if (isKeywordsMode) {
        // Get keywords from field and tags
        const fieldValue = document.getElementById('keywords-field').value.trim();
        if (fieldValue) {
            keywords.push(...fieldValue.split(/\s+/));
        }
        
        if (keywords.length === 0) {
            alert('キーワードを入力してください');
            return;
        }
        
        dreamContent = keywords.join(' ');
    } else {
        dreamContent = document.getElementById('freetext-field').value.trim();
        if (!dreamContent) {
            alert('夢の内容を入力してください');
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
        alert('夢の解析中にエラーが発生しました: ' + error.message);
    }
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
    
    alert('夢が保存されました！');
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
function showShareModal() {
    if (!app.currentAnalysis) return;
    
    generateShareImage();
    document.getElementById('share-modal').classList.remove('hidden');
}

function hideShareModal() {
    document.getElementById('share-modal').classList.add('hidden');
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
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Make functions globally accessible
window.removeKeywordTag = removeKeywordTag;
window.showDreamDetail = showDreamDetail;